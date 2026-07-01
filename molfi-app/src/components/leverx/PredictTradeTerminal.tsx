import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { UnderlineTabs } from "@/components/leverx/UnderlineTabs";
import { LeverageWindowCountdown } from "@/components/leverx/LeverageWindowCountdown";
import { MarketFavoriteButton } from "@/components/leverx/MarketFavoriteButton";
import { MarketQuotePausedBadge } from "@/components/leverx/MarketQuotePausedBadge";
import { PredictLeveragePanel } from "@/components/leverx/PredictLeveragePanel";
import { LeverxLimitOrdersTable } from "@/components/leverx/LeverxLimitOrdersTable";
import { LeverxPositionsTable } from "@/components/leverx/LeverxPositionsTable";
import { PortfolioIndexSyncNotice } from "@/components/leverx/PortfolioIndexSyncNotice";
import { MarketCommentsPanel } from "@/components/leverx/comments/MarketCommentsPanel";
import { MarketTradesTable } from "@/components/leverx/MarketTradesTable";
import { useMarketComments } from "@/hooks/useMarketComments";
import { mergeCommentsWithSimulated } from "@/lib/comments/simulated-comments";
import { usePositionsMarkToMarket } from "@/hooks/usePositionsMarkToMarket";
import { useVerifiedOpenPositions } from "@/hooks/useVerifiedOpenPositions";
import { useMinMdViewport } from "@/hooks/use-min-md-viewport";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { PriceChart } from "@/components/PriceChart";
import { PredictOrderBook } from "@/components/leverx/PredictOrderBook";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { AssetBadge } from "@/components/AssetBadge";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import {
  AnimatedAssetPrice,
  AnimatedCount,
  AnimatedPercent,
  AnimatedPremium,
} from "@/components/ui/animated-numbers";
import { useWallet } from "@/context/WalletContext";
import {
  useIndexerGlobalTrades,
  useIndexerLimitOrders,
  useIndexerPositions,
  useIndexerProtocol,
  useIndexerVaultSummary,
  useMarketCatalog,
} from "@/hooks/useIndexer";
import { useChartPriceSeries, type ChartDisplayMode } from "@/hooks/useChartPriceSeries";
import { CHART_OHLCV_INTERVAL, type OhlcvInterval } from "@/lib/deepbook/ohlcv";
import { useLiveContractPremium } from "@/hooks/useLiveContractPremium";
import { useNow } from "@/hooks/useNow";
import { useOraclePriceLatest } from "@/hooks/useOracleSpotPriceSeries";
import { useOracleNeighbors, usePredictOracleRows } from "@/hooks/usePredictOracles";
import { usePredictOracleState } from "@/hooks/usePredictOracleState";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import {
  catalogToMarketRows,
} from "@/lib/leverx/indexer-markets";
import {
  atmStrikeRaw,
  enrichMarketRow,
  resolveRangeBounds,
  resolveTradeMarket,
} from "@/lib/leverx/predict-oracle-markets";
import { defaultRangeBoundsRaw, oracleStrikeBounds } from "@/lib/leverx/strike-selection";
import { useTradeNavigation } from "@/context/TradeNavigationContext";
import { baseFromUnderlying } from "@/lib/markets";
import { positionRowId } from "@/lib/leverx/position-metrics";
import { summarizeGlobalTrades } from "@/lib/leverx/trade-stats";
import { resolveFinalWindowMs } from "@/lib/leverx/protocol";
import {
  formatMarketCloses,
  isFinalHourBeforeExpiry,
} from "@/lib/leverx/trade-limits";
import {
  buildPositionStrikeChartLevels,
  buildStrikeChartLevels,
} from "@/lib/charts/predict-chart-levels";
import { formatCount, ui } from "@/lib/copy";
import { DATA_PLACEHOLDER } from "@/lib/leverx/placeholders";
import { coercePredictSide, type PredictSide } from "@/lib/predict/instruments";
import { isOracleSettledForTrade, shouldPatchOhlcvWithOracleSpot } from "@/lib/predict/oracles";
import { scaleQuote, scaleSpot } from "@/lib/predict/scaling";
import {
  textFilterActive,
  textFilterBtn,
  textFilterGroup,
  tradeStatItem,
  tradeStatItemLabel,
  tradeStatItemValue,
  tradeSummaryGrid,
  tradeTerminal,
  tradeTerminalBack,
  tradeTerminalBody,
  tradeTerminalHeader,
  tradeTerminalHeaderMetrics,
  tradeTerminalHeaderTop,
  tradeTerminalChart,
  tradeTerminalOrderbook,
  tradeTerminalPositions,
  tradeTerminalPositionsBody,
  tradeTerminalSidebar,
  tradeTerminalTabsRow,
  tradeTerminalTitle,
  tradeOracleNav,
  tradeOracleNavBtn,
  tradeOracleNavBtnDisabled,
  tradeTerminalWorkspace,
  tradeStatRow,
  tradeTerminalHeaderMetricsRow,
  tradeMobileDock,
  tradeMobileDockTab,
  tradeMobileDockTabActive,
  tradeMobileDockTabs,
  tradeTerminalMobileBody,
  tradeTerminalMobileChartPanel,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

const TABS = ["Comments", "Positions", "Open Orders", "Market trades", "Summary"] as const;
const MOBILE_WORKSPACE_TABS = ["trade", "chart"] as const;
type MobileWorkspaceTab = (typeof MOBILE_WORKSPACE_TABS)[number];

function tradeTabLabel(
  tab: (typeof TABS)[number],
  commentsLoading: boolean,
  commentCount: number,
  tradesLoading: boolean,
  tradeCount: string,
  positionsLoading: boolean,
  positionCount: number,
  ordersLoading: boolean,
  orderCount: number,
) {
  if (tab === "Comments") {
    const count = commentsLoading ? "…" : formatCount(commentCount);
    return <>Comments ({count})</>;
  }
  if (tab === "Market trades") {
    const count = tradesLoading ? "…" : tradeCount;
    return (
      <>
        <span className="sm:hidden">Trades ({count})</span>
        <span className="hidden sm:inline">Market trades ({count})</span>
      </>
    );
  }
  if (tab === "Open Orders") {
    const count = ordersLoading ? "…" : formatCount(orderCount);
    return (
      <>
        <span className="sm:hidden">Orders ({count})</span>
        <span className="hidden sm:inline">Open Orders ({count})</span>
      </>
    );
  }
  if (tab === "Positions") {
    const count = positionsLoading ? "…" : formatCount(positionCount);
    return (
      <>
        <span className="max-[380px]:hidden">Positions ({count})</span>
        <span className="hidden max-[380px]:inline">Pos ({count})</span>
      </>
    );
  }
  if (tab === "Summary") {
    return (
      <>
        <span className="max-[380px]:hidden">Summary</span>
        <span className="hidden max-[380px]:inline">Stats</span>
      </>
    );
  }
  return tab;
}

function StatItem({
  label,
  value,
  info,
  tone,
}: {
  label: string;
  value: ReactNode;
  info?: string;
  tone?: "success" | "destructive";
}) {
  return (
    <div className={tradeStatItem}>
      {info ? (
        <LabelWithInfo
          label={label}
          labelClassName={tradeStatItemLabel}
          info={info}
        />
      ) : (
        <span className={tradeStatItemLabel}>{label}</span>
      )}
      <span
        className={cn(
          tradeStatItemValue,
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TerminalPriceChart({
  asset,
  oracleId,
  chartStrikePrice,
  chartStrikeLevels,
  activeSide,
  chartRangeLower,
  chartRangeUpper,
  layoutActive = true,
  chartSeries,
  interval,
  onIntervalChange,
  displayMode,
  onDisplayModeChange,
}: {
  asset: string;
  oracleId: string;
  chartStrikePrice?: number;
  chartStrikeLevels?: ReturnType<typeof buildPositionStrikeChartLevels>;
  activeSide: PredictSide;
  chartRangeLower?: number;
  chartRangeUpper?: number;
  layoutActive?: boolean;
  chartSeries: ReturnType<typeof useChartPriceSeries>;
  interval: OhlcvInterval;
  onIntervalChange: (interval: OhlcvInterval) => void;
  displayMode: ChartDisplayMode;
  onDisplayModeChange: (mode: ChartDisplayMode) => void;
}) {
  return (
    <div className={tradeTerminalChart}>
      <PriceChart
        asset={asset}
        oracleId={oracleId}
        chartSeries={chartSeries}
        strikePrice={chartStrikePrice}
        strikeLevels={chartStrikeLevels}
        activeSide={activeSide}
        rangeLower={chartRangeLower}
        rangeUpper={chartRangeUpper}
        layoutActive={layoutActive}
        interval={interval}
        onIntervalChange={onIntervalChange}
        displayMode={displayMode}
        onDisplayModeChange={onDisplayModeChange}
      />
    </div>
  );
}

function TerminalOrderBook({
  oracleId,
  market,
  activeSide,
  onSideChange,
  compact = false,
}: {
  oracleId: string;
  market: ReturnType<typeof resolveTradeMarket> | undefined;
  activeSide: PredictSide;
  onSideChange: (side: PredictSide) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn(tradeTerminalOrderbook, compact ? "min-h-0" : "min-h-[280px]")}>
      <PredictOrderBook
        oracleId={oracleId}
        expiryMs={market?.expiry ?? 0}
        strike={market?.strikeRaw ?? 0}
        higherStrike={market?.higherStrikeRaw ?? 0}
        side={activeSide}
        onSideChange={onSideChange}
        placeholder={!market || market.strikeRaw <= 0 || !market.expiry}
        compact={compact}
      />
    </div>
  );
}

type TradePositionsPanelProps = {
  activeTab: (typeof TABS)[number];
  setActiveTab: (tab: (typeof TABS)[number]) => void;
  commentsLoading: boolean;
  commentCount: number;
  commentsState: ReturnType<typeof useMarketComments>;
  tradesLoading: boolean;
  tradeStats: ReturnType<typeof summarizeGlobalTrades>;
  trades: Awaited<ReturnType<typeof useIndexerGlobalTrades>>["data"];
  positionsFilter: "open" | "closed";
  setPositionsFilter: (filter: "open" | "closed") => void;
  address: string | null;
  positionsLoading: boolean;
  positions: Awaited<ReturnType<typeof useIndexerPositions>>["data"];
  stalePositions?: Awaited<ReturnType<typeof useIndexerPositions>>["data"];
  positionCount: number;
  ordersLoading: boolean;
  limitOrders: Awaited<ReturnType<typeof useIndexerLimitOrders>>["data"];
  vaultSummary: Awaited<ReturnType<typeof useIndexerVaultSummary>>["data"];
  chartVisiblePositionIds: ReadonlySet<string>;
  onChartVisibilityToggle: (positionId: string) => void;
};

function TradePositionsPanel({
  activeTab,
  setActiveTab,
  commentsLoading,
  commentCount,
  commentsState,
  tradesLoading,
  tradeStats,
  trades = [],
  positionsFilter,
  setPositionsFilter,
  address,
  positionsLoading,
  positions = [],
  stalePositions = [],
  positionCount,
  ordersLoading,
  limitOrders = [],
  vaultSummary,
  chartVisiblePositionIds,
  onChartVisibilityToggle,
}: TradePositionsPanelProps) {
  const { byPositionId, isRefreshing } = usePositionsMarkToMarket(positions);

  return (
    <div className={tradeTerminalPositions}>
      <div className={tradeTerminalTabsRow}>
        <UnderlineTabs
          variant="plain"
          className="min-w-0 flex-1"
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as (typeof TABS)[number])}
          options={TABS.map((tab) => ({
            value: tab,
            label: tradeTabLabel(
              tab,
              commentsLoading,
              commentCount,
              tradesLoading,
              formatCount(tradeStats.total),
              positionsLoading,
              positionCount,
              ordersLoading,
              limitOrders.length,
            ),
          }))}
        />
        {activeTab === "Positions" ? (
          <div className={textFilterGroup} role="group" aria-label="Position filter">
            <button
              type="button"
              className={cn(textFilterBtn, positionsFilter === "open" && textFilterActive)}
              onClick={() => setPositionsFilter("open")}
              aria-pressed={positionsFilter === "open"}
            >
              Open
            </button>
            <button
              type="button"
              className={cn(textFilterBtn, positionsFilter === "closed" && textFilterActive)}
              onClick={() => setPositionsFilter("closed")}
              aria-pressed={positionsFilter === "closed"}
            >
              Closed
            </button>
          </div>
        ) : null}
      </div>

      <div className={tradeTerminalPositionsBody}>
        {activeTab === "Comments" ? (
          <MarketCommentsPanel address={address} commentsState={commentsState} />
        ) : activeTab === "Summary" ? (
          <div className={tradeSummaryGrid}>
            <StatItem label="Total trades" value={<AnimatedCount value={tradeStats.total} />} />
            <StatItem label="24h trades" value={<AnimatedCount value={tradeStats.last24h} />} />
            <StatItem label="Opens" value={<AnimatedCount value={tradeStats.mints} />} />
            <StatItem label="Closes" value={<AnimatedCount value={tradeStats.redeems} />} />
            <StatItem
              label="Pool in use"
              value={
                vaultSummary?.snapshot?.utilization_bps != null ? (
                  <AnimatedPercent
                    value={vaultSummary.snapshot.utilization_bps / 10_000}
                    fractionDigits={1}
                  />
                ) : (
                  "—"
                )
              }
            />
          </div>
        ) : activeTab === "Market trades" ? (
          tradesLoading ? (
            <LoadingState label={ui.loadingTrades} compact />
          ) : trades.length > 0 ? (
            <MarketTradesTable trades={trades} />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No activity yet"
              description="Recent trades will show up here."
              compact
            />
          )
        ) : activeTab === "Positions" ? (
          !address ? (
            <EmptyState
              icon={Inbox}
              title="Sign in"
              description="Sign in to see your open trades."
              compact
            />
          ) : positionsLoading ? (
            <LoadingState label="Loading positions…" compact />
          ) : positions.length > 0 || stalePositions.length > 0 ? (
            <div className="space-y-3">
              {positionsFilter === "open" ? (
                <PortfolioIndexSyncNotice stalePositions={stalePositions} />
              ) : null}
              {positions.length > 0 ? (
                <LeverxPositionsTable
                  positions={positions}
                  markToMarket={byPositionId}
                  isRefreshing={isRefreshing}
                  owner={address ?? undefined}
                  compact
                  showHeader={false}
                  paginationKey={positionsFilter}
                  hideLiveMetrics={positionsFilter === "closed"}
                  chartVisibleIds={
                    positionsFilter === "open" ? chartVisiblePositionIds : undefined
                  }
                  onChartVisibilityToggle={
                    positionsFilter === "open" ? onChartVisibilityToggle : undefined
                  }
                />
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={Inbox}
              title={ui.emptyPositions}
              description={ui.emptyPositionsHint}
              compact
            />
          )
        ) : activeTab === "Open Orders" ? (
          !address ? (
            <EmptyState
              icon={Inbox}
              title="Sign in"
              description="Sign in to see your waiting orders."
              compact
            />
          ) : ordersLoading ? (
            <LoadingState label="Loading orders…" compact />
          ) : limitOrders.length > 0 ? (
            <LeverxLimitOrdersTable orders={limitOrders} />
          ) : (
            <EmptyState
              icon={Inbox}
              title="No waiting orders"
              description="Orders waiting for a match will appear here."
              compact
            />
          )
        ) : null}
      </div>
    </div>
  );
}

/** Stable key for trade UI state — avoids remounting forms on catalog/mark poll updates. */
function tradeContextKey(oracleId: string, side: PredictSide): string {
  return `${oracleId}:${side}`;
}

interface Props {
  oracleId: string;
}

export function PredictTradeTerminal({ oracleId }: Props) {
  const { consumePendingTrade } = useTradeNavigation();
  const [activeSide, setActiveSide] = useState<PredictSide>("up");
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Comments");
  const [positionsFilter, setPositionsFilter] = useState<"open" | "closed">("open");
  const [mobileWorkspace, setMobileWorkspace] = useState<MobileWorkspaceTab>("trade");
  const [dockMounted, setDockMounted] = useState(false);
  const [selectedStrikeRaw, setSelectedStrikeRaw] = useState<number | undefined>();
  const [selectedRangeLower, setSelectedRangeLower] = useState<number | undefined>();
  const [selectedRangeUpper, setSelectedRangeUpper] = useState<number | undefined>();
  const [chartInterval, setChartInterval] = useState<OhlcvInterval>(CHART_OHLCV_INTERVAL);
  const [chartDisplayMode, setChartDisplayMode] = useState<ChartDisplayMode>("line");
  const [chartVisiblePositionIds, setChartVisiblePositionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { address } = useWallet();

  useEffect(() => {
    setDockMounted(true);
  }, []);

  useEffect(() => {
    setSelectedStrikeRaw(undefined);
    setSelectedRangeLower(undefined);
    setSelectedRangeUpper(undefined);

    const intent = consumePendingTrade(oracleId);

    if (intent?.side) {
      setActiveSide(coercePredictSide(intent.side));
    } else {
      setActiveSide("up");
    }
    if (intent?.strike) setSelectedStrikeRaw(intent.strike);
    if (intent?.lower) setSelectedRangeLower(intent.lower);
    if (intent?.upper) setSelectedRangeUpper(intent.upper);
  }, [oracleId, consumePendingTrade]);

  const handleSideChange = useCallback((side: PredictSide) => {
    setActiveSide(side);
    setSelectedStrikeRaw(undefined);
    setSelectedRangeLower(undefined);
    setSelectedRangeUpper(undefined);
  }, []);

  const { data: protocol } = useIndexerProtocol();
  const finalWindowMs = resolveFinalWindowMs(protocol);
  const vaultId = protocol?.vault_id ?? undefined;
  const { data: vaultSummary } = useIndexerVaultSummary(vaultId);
  const { data: catalog = [] } = useMarketCatalog({ oracleId, limit: 200 });
  const { data: oracles = [], refetch: refetchOracles } = usePredictOracleRows();
  const { prev: prevOracle, next: nextOracle } = useOracleNeighbors(oracleId, {
    activeOnly: true,
  });

  const oracleSummary = useMemo(
    () => oracles.find((o) => o.oracle_id === oracleId),
    [oracles, oracleId],
  );

  const now = useNow(1000);
  const expiryForPolling = oracleSummary?.expiry;
  const oracleStateRefetchMs = useMemo(() => {
    if (!expiryForPolling || expiryForPolling <= 0) return 60_000;
    if (expiryForPolling <= now) return 5_000;
    if (expiryForPolling - now < finalWindowMs) return 15_000;
    return 60_000;
  }, [expiryForPolling, now, finalWindowMs]);

  const { data: oracleState } = usePredictOracleState(oracleId, {
    refetchInterval: oracleStateRefetchMs,
  });
  const { data: latestPrice } = useOraclePriceLatest(oracleId);

  const chartAsset =
    baseFromUnderlying(oracleSummary?.underlying_asset ?? oracleState?.underlying_asset ?? "") ||
    oracleId.slice(2, 6).toUpperCase();

  const isOracleSettled = useMemo(
    () => isOracleSettledForTrade(oracleSummary, oracleState),
    [oracleSummary, oracleState],
  );

  const oracleSpot =
    latestPrice?.spot ??
    oracleState?.spot_price ??
    (oracleSummary?.settlement_price
      ? oracleSummary.settlement_price / 1e9
      : null);

  const marketRows = useMemo(() => {
    const rows = catalogToMarketRows(catalog);
    if (!oracleSummary) return rows;
    const spot = oracleSpot ?? undefined;
    return rows.map((row) => enrichMarketRow(row, oracleSummary, spot));
  }, [catalog, oracleSummary, oracleSpot]);

  const oracleStrikeConfig = useMemo(
    () =>
      oracleStrikeBounds({
        minStrike: oracleSummary?.min_strike,
        tickSize: oracleSummary?.tick_size,
      }),
    [oracleSummary?.min_strike, oracleSummary?.tick_size],
  );

  const defaultBinaryStrikeRaw = useMemo(() => {
    if (oracleSpot != null && oracleSpot > 0) {
      return atmStrikeRaw(
        oracleSpot,
        oracleStrikeConfig.minStrikeRaw,
        oracleStrikeConfig.tickSizeRaw,
      );
    }
    return 0;
  }, [oracleSpot, oracleStrikeConfig]);

  const activeBinaryStrikeRaw = useMemo(() => {
    if (activeSide === "range") return 0;
    return selectedStrikeRaw ?? defaultBinaryStrikeRaw;
  }, [activeSide, selectedStrikeRaw, defaultBinaryStrikeRaw]);

  const rangeBounds = useMemo(() => {
    if (
      selectedRangeLower &&
      selectedRangeUpper &&
      selectedRangeUpper > selectedRangeLower
    ) {
      return { lower: selectedRangeLower, upper: selectedRangeUpper };
    }
    const resolved = resolveRangeBounds({
      oracleId,
      catalogRows: marketRows,
      oracle: oracleSummary,
      oracleSpot,
      lowerStrikeRaw: selectedRangeLower,
      upperStrikeRaw: selectedRangeUpper,
    });
    if (resolved) return resolved;
    if (oracleSpot != null && oracleSpot > 0) {
      return defaultRangeBoundsRaw(
        oracleSpot,
        oracleStrikeConfig.minStrikeRaw,
        oracleStrikeConfig.tickSizeRaw,
      );
    }
    return null;
  }, [
    oracleId,
    marketRows,
    oracleSummary,
    oracleSpot,
    selectedRangeLower,
    selectedRangeUpper,
    oracleStrikeConfig.minStrikeRaw,
    oracleStrikeConfig.tickSizeRaw,
  ]);

  const handleRangeBoundsChange = useCallback((lower: number, upper: number) => {
    setSelectedRangeLower(lower);
    setSelectedRangeUpper(upper);
  }, []);

  const market = useMemo(
    () =>
      resolveTradeMarket({
        oracleId,
        oracle: oracleSummary,
        oracleSpot,
        catalogRows: marketRows,
        strikeRaw:
          activeSide !== "range" && activeBinaryStrikeRaw > 0
            ? activeBinaryStrikeRaw
            : undefined,
        lowerStrikeRaw: rangeBounds?.lower,
        upperStrikeRaw: rangeBounds?.upper,
        side: activeSide,
      }),
    [
      oracleId,
      oracleSummary,
      oracleSpot,
      marketRows,
      rangeBounds,
      activeSide,
      activeBinaryStrikeRaw,
    ],
  );

  const { data: trades = [], isLoading: tradesLoading } = useIndexerGlobalTrades(oracleId);
  const {
    data: openPositions = [],
    isLoading: openPositionsLoading,
    refetch: refetchOpenPositions,
  } = useIndexerPositions(address ?? undefined, { status: "open", oracleId });
  const {
    data: closedPositions = [],
    isLoading: closedPositionsLoading,
    refetch: refetchClosedPositions,
  } = useIndexerPositions(address ?? undefined, { status: "closed", oracleId });
  const { data: limitOrders = [], isLoading: ordersLoading, refetch: refetchLimitOrders } =
    useIndexerLimitOrders(address ?? undefined, oracleId);

  const {
    activePositions: openOraclePositions,
    stalePositions: staleOraclePositions,
  } = useVerifiedOpenPositions(openPositions);

  const displayPositions = useMemo(
    () => (positionsFilter === "open" ? openOraclePositions : closedPositions),
    [positionsFilter, openOraclePositions, closedPositions],
  );

  const seenChartPositionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    seenChartPositionIdsRef.current = new Set();
    setChartVisiblePositionIds(new Set());
  }, [oracleId]);

  useEffect(() => {
    setChartVisiblePositionIds((prev) => {
      const next = new Set(prev);
      let changed = false;

      for (const position of openOraclePositions) {
        const id = positionRowId(position);
        if (!seenChartPositionIdsRef.current.has(id)) {
          seenChartPositionIdsRef.current.add(id);
          next.add(id);
          changed = true;
        }
      }

      for (const id of next) {
        if (!openOraclePositions.some((position) => positionRowId(position) === id)) {
          next.delete(id);
          seenChartPositionIdsRef.current.delete(id);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [openOraclePositions]);

  const toggleChartVisibility = useCallback((positionId: string) => {
    setChartVisiblePositionIds((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) next.delete(positionId);
      else next.add(positionId);
      return next;
    });
  }, []);

  const positionsLoading =
    positionsFilter === "open" ? openPositionsLoading : closedPositionsLoading;

  const handleTradeSuccess = useCallback(
    ({ orderType }: { orderType: "market" | "limit" }) => {
      if (orderType === "limit") {
        setActiveTab("Open Orders");
        void refetchLimitOrders();
      } else {
        setActiveTab("Positions");
        void refetchOpenPositions();
      }
      void refetchClosedPositions();
    },
    [setActiveTab, refetchOpenPositions, refetchClosedPositions, refetchLimitOrders],
  );

  const asset = chartAsset || market?.asset || oracleId.slice(2, 6).toUpperCase();
  const expiry = market?.expiry ?? oracleSummary?.expiry ?? oracleState?.expiry;
  const isOracleExpired =
    expiry != null && expiry > 0 && expiry <= now;
  const inFinalHour = Boolean(
    expiry &&
      expiry > now &&
      isFinalHourBeforeExpiry(expiry, finalWindowMs, now),
  );

  const expiredRefetchDone = useRef(false);
  const settledRefetchDone = useRef(false);
  useEffect(() => {
    expiredRefetchDone.current = false;
    settledRefetchDone.current = false;
  }, [oracleId]);
  useEffect(() => {
    if (!isOracleExpired || expiredRefetchDone.current) return;
    expiredRefetchDone.current = true;
    void refetchOracles();
    void refetchOpenPositions();
    void refetchClosedPositions();
  }, [
    isOracleExpired,
    refetchOracles,
    refetchOpenPositions,
    refetchClosedPositions,
  ]);
  useEffect(() => {
    if (!isOracleSettled || settledRefetchDone.current) return;
    settledRefetchDone.current = true;
    void refetchOpenPositions();
    void refetchClosedPositions();
  }, [isOracleSettled, refetchOpenPositions, refetchClosedPositions]);
  const liquidity = vaultSummary?.snapshot?.nav
    ? scaleQuote(vaultSummary.snapshot.nav)
    : null;
  const tradeStats = useMemo(() => summarizeGlobalTrades(trades), [trades]);

  const rangeLower = rangeBounds?.lower ?? market?.strikeRaw;
  const rangeUpper = rangeBounds?.upper ?? market?.higherStrikeRaw;

  const rangeQuoteLower =
    activeSide === "range" ? rangeBounds?.lower : undefined;
  const rangeQuoteUpper =
    activeSide === "range" ? rangeBounds?.upper : undefined;

  const contractPremium = useLiveContractPremium({
    oracleId,
    expiryMs: expiry,
    strikeRaw:
      activeSide === "range" ? rangeQuoteLower : activeBinaryStrikeRaw || undefined,
    higherStrikeRaw: activeSide === "range" ? rangeQuoteUpper : undefined,
    side: activeSide,
    catalogPremium: market?.lastAskPremium,
  });

  const patchChartWithOracleSpot = useMemo(
    () =>
      shouldPatchOhlcvWithOracleSpot(oracleSummary, oracleState) &&
      !contractPremium.quotePaused,
    [oracleSummary, oracleState, contractPremium.quotePaused],
  );

  const chartSeries = useChartPriceSeries(oracleId, chartAsset, {
    oracleRow: oracleSummary,
    oracleDetail: oracleState,
    patchWithOracleSpot: patchChartWithOracleSpot,
    interval: chartInterval,
  });

  const chartStrikePrice = useMemo(() => {
    if (activeSide === "range") return undefined;
    if (activeBinaryStrikeRaw > 0) return scaleSpot(activeBinaryStrikeRaw);
    return undefined;
  }, [activeSide, activeBinaryStrikeRaw]);

  const chartRangeLower = rangeLower ? scaleSpot(rangeLower) : undefined;
  const chartRangeUpper = rangeUpper ? scaleSpot(rangeUpper) : undefined;

  const chartPositionsOnChart = useMemo(
    () =>
      openOraclePositions.filter((position) =>
        chartVisiblePositionIds.has(positionRowId(position)),
      ),
    [openOraclePositions, chartVisiblePositionIds],
  );

  const chartStrikeLevels = useMemo(() => {
    if (chartPositionsOnChart.length > 0) {
      return buildPositionStrikeChartLevels(
        chartPositionsOnChart.map((position) => ({
          isUp: position.is_up,
          isRange: position.is_range,
          strikeRaw: position.strike,
          higherStrikeRaw: position.higher_strike,
        })),
      );
    }
    return buildStrikeChartLevels({
      activeSide,
      strikePrice: chartStrikePrice,
      rangeLower: chartRangeLower,
      rangeUpper: chartRangeUpper,
    });
  }, [
    chartPositionsOnChart,
    activeSide,
    chartStrikePrice,
    chartRangeLower,
    chartRangeUpper,
  ]);

  const sessionKey = useMemo(
    () => tradeContextKey(oracleId, activeSide),
    [oracleId, activeSide],
  );
  const showMobileChart = mobileWorkspace === "chart";
  const showMobileTrade = mobileWorkspace === "trade";
  const isMdViewport = useMinMdViewport();
  const desktopChartActive = isMdViewport;
  const mobileChartActive = !isMdViewport && showMobileChart;

  const commentsState = useMarketComments(oracleId);
  const { comments, loading: commentsLoading } = commentsState;

  const positionsPanelProps: TradePositionsPanelProps = {
    activeTab,
    setActiveTab,
    commentsLoading,
    commentCount: mergeCommentsWithSimulated(comments).length,
    commentsState,
    tradesLoading,
    tradeStats,
    trades,
    positionsFilter,
    setPositionsFilter,
    address: address ?? null,
    positionsLoading,
    positions: displayPositions,
    stalePositions: positionsFilter === "open" ? staleOraclePositions : [],
    positionCount:
      positionsFilter === "open"
        ? displayPositions.length + staleOraclePositions.length
        : displayPositions.length,
    ordersLoading,
    limitOrders,
    vaultSummary,
    chartVisiblePositionIds,
    onChartVisibilityToggle: toggleChartVisibility,
  };

  return (
    <section className={cn(tradeTerminal, "trade-terminal")}>
      <header className={cn(tradeTerminalHeader, "trade-terminal-header")}>
        <div className={tradeTerminalHeaderTop}>
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <AssetBadge asset={asset} size="md" />
            <div className="min-w-0 flex-1">
              <h1 className={tradeTerminalTitle}>
                <MarketTitle />
              </h1>
              <Link to="/markets" className={tradeTerminalBack}>
                {ui.backToMarkets}
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {market?.id ? (
              <MarketFavoriteButton
                marketId={market.id}
                labeled
                className="shrink-0"
              />
            ) : null}
            <div className={tradeOracleNav} aria-label="Market navigation">
            {prevOracle ? (
              <Link
                to="/predictions/$oracleId"
                params={{ oracleId: prevOracle.oracle_id }}
                className={tradeOracleNavBtn}
                aria-label="Previous market"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span
                className={cn(tradeOracleNavBtn, tradeOracleNavBtnDisabled)}
                aria-hidden
              >
                <ChevronLeft className="h-4 w-4" />
              </span>
            )}
            {nextOracle ? (
              <Link
                to="/predictions/$oracleId"
                params={{ oracleId: nextOracle.oracle_id }}
                className={tradeOracleNavBtn}
                aria-label="Next market"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span
                className={cn(tradeOracleNavBtn, tradeOracleNavBtnDisabled)}
                aria-hidden
              >
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
          </div>
        </div>

        <div className={tradeTerminalHeaderMetrics}>
          <div className={tradeTerminalHeaderMetricsRow}>
            <div className={tradeStatRow}>
              <StatItem
                label={ui.markPrice}
                info={leverxInfo.markPrice}
                value={
                  oracleSpot != null && oracleSpot > 0 ? (
                    <AnimatedAssetPrice value={oracleSpot} />
                  ) : (
                    DATA_PLACEHOLDER
                  )
                }
              />
              <StatItem
                label="Contract price"
                info={leverxInfo.premium}
                value={
                  contractPremium.quotePaused ? (
                    <MarketQuotePausedBadge className="mt-0" />
                  ) : contractPremium.isLoading ? (
                    "…"
                  ) : contractPremium.premiumRaw != null && contractPremium.premiumRaw > 0 ? (
                    <AnimatedPremium value={contractPremium.premiumRaw} />
                  ) : (
                    "…"
                  )
                }
                tone={contractPremium.quotePaused ? "destructive" : undefined}
              />
              <StatItem
                label="Volume (24h)"
                info={leverxInfo.volume24h}
                value={
                  <QuoteAmount
                    amount={tradeStats.volume24h > 0 ? tradeStats.volume24h : null}
                    hideZero
                  />
                }
              />
              <StatItem
                label="Pool size"
                info={leverxInfo.vaultNav}
                value={<QuoteAmount amount={liquidity} hideZero />}
              />
              <StatItem
                label="Closes"
                info={inFinalHour ? leverxInfo.leveragedMintWindow : leverxInfo.autoClose}
                value={expiry ? formatMarketCloses(expiry, now) : DATA_PLACEHOLDER}
                tone={isOracleExpired ? "destructive" : inFinalHour ? "destructive" : undefined}
              />
            </div>
            <LeverageWindowCountdown expiryMs={expiry} className="lg:self-center" />
          </div>
        </div>
      </header>

      <div className={cn(tradeTerminalBody, tradeTerminalMobileBody)}>
        <div className={cn(tradeTerminalWorkspace, "trade-terminal-workspace-desktop")}>
          <TerminalPriceChart
            asset={asset}
            oracleId={oracleId}
            chartStrikePrice={chartStrikePrice}
            chartStrikeLevels={chartStrikeLevels}
            activeSide={activeSide}
            chartRangeLower={chartRangeLower}
            chartRangeUpper={chartRangeUpper}
            layoutActive={desktopChartActive}
            chartSeries={chartSeries}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
            displayMode={chartDisplayMode}
            onDisplayModeChange={setChartDisplayMode}
          />
          <TerminalOrderBook
            oracleId={oracleId}
            market={market}
            activeSide={activeSide}
            onSideChange={handleSideChange}
          />
          <div className={tradeTerminalSidebar}>
            <PredictLeveragePanel
              key={sessionKey}
              oracleId={oracleId}
              side={activeSide}
              onSideChange={handleSideChange}
              expiryMs={expiry}
              oracleSpotUsd={oracleSpot}
              minStrikeRaw={oracleStrikeConfig.minStrikeRaw}
              tickSizeRaw={oracleStrikeConfig.tickSizeRaw}
              onStrikeRawChange={setSelectedStrikeRaw}
              onRangeBoundsChange={handleRangeBoundsChange}
              binaryStrikeRaw={activeBinaryStrikeRaw > 0 ? activeBinaryStrikeRaw : undefined}
              lowerStrikeRaw={rangeLower}
              upperStrikeRaw={rangeUpper}
              lastAskPremium={contractPremium.premiumRaw ?? undefined}
              openPositions={openOraclePositions}
              disabled={isOracleSettled || isOracleExpired}
              onTradeSuccess={handleTradeSuccess}
            />
          </div>
          <TradePositionsPanel {...positionsPanelProps} />
        </div>

        <div
          className={cn(tradeTerminalWorkspace, tradeTerminalMobileChartPanel, "trade-terminal-workspace-mobile")}
          data-active={showMobileChart ? "true" : "false"}
        >
          <TerminalPriceChart
            asset={asset}
            oracleId={oracleId}
            chartStrikePrice={chartStrikePrice}
            chartStrikeLevels={chartStrikeLevels}
            activeSide={activeSide}
            chartRangeLower={chartRangeLower}
            chartRangeUpper={chartRangeUpper}
            layoutActive={mobileChartActive}
            chartSeries={chartSeries}
            interval={chartInterval}
            onIntervalChange={setChartInterval}
            displayMode={chartDisplayMode}
            onDisplayModeChange={setChartDisplayMode}
          />
          <TerminalOrderBook
            oracleId={oracleId}
            market={market}
            activeSide={activeSide}
            onSideChange={handleSideChange}
            compact
          />
        </div>

        <div
          className={cn(tradeTerminalWorkspace, "trade-terminal-workspace-mobile")}
          data-active={showMobileTrade ? "true" : "false"}
        >
          <div className={tradeTerminalSidebar}>
            <PredictLeveragePanel
              key={sessionKey}
              oracleId={oracleId}
              side={activeSide}
              onSideChange={handleSideChange}
              expiryMs={expiry}
              oracleSpotUsd={oracleSpot}
              minStrikeRaw={oracleStrikeConfig.minStrikeRaw}
              tickSizeRaw={oracleStrikeConfig.tickSizeRaw}
              onStrikeRawChange={setSelectedStrikeRaw}
              onRangeBoundsChange={handleRangeBoundsChange}
              binaryStrikeRaw={activeBinaryStrikeRaw > 0 ? activeBinaryStrikeRaw : undefined}
              lowerStrikeRaw={rangeLower}
              upperStrikeRaw={rangeUpper}
              lastAskPremium={contractPremium.premiumRaw ?? undefined}
              openPositions={openOraclePositions}
              disabled={isOracleSettled || isOracleExpired}
              onTradeSuccess={handleTradeSuccess}
            />
          </div>
          <TradePositionsPanel {...positionsPanelProps} />
        </div>
      </div>

      {dockMounted
        ? createPortal(
            <nav className={tradeMobileDock} aria-label="Trade workspace">
              <div className={tradeMobileDockTabs} role="tablist">
                {MOBILE_WORKSPACE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={mobileWorkspace === tab}
                    className={cn(
                      tradeMobileDockTab,
                      mobileWorkspace === tab && tradeMobileDockTabActive,
                    )}
                    onClick={() => setMobileWorkspace(tab)}
                  >
                    {tab === "trade" ? "Trade" : "Chart"}
                  </button>
                ))}
              </div>
            </nav>,
            document.body,
          )
        : null}
    </section>
  );
}
