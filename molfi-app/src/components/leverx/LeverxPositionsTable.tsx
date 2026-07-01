import { useMemo, type ReactNode } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { AssetBadge } from "@/components/AssetBadge";
import { PositionActionsTrigger } from "@/components/leverx/PositionActionsModal";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePredictOracleRows } from "@/hooks/usePredictOracles";
import { useIndexerProtocol } from "@/hooks/useIndexer";
import { leverxInfo } from "@/lib/leverx/info-copy";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { assetLabelForOracleId } from "@/lib/predict/oracles";
import {
  closedClosingPremiumCents,
  closedEntryPremiumCents,
  closedPositionPnlBreakdown,
  entryPremiumPerUnitRaw,
  formatHealthBps,
  formatPnlPct,
  positionBorrowUsd,
  positionLeverageMultiplier,
  positionMarginUsd,
  positionMintCostUsd,
  positionRowId,
  realizedPnlPct,
  realizedPnlUsd,
  walletRepaidPrincipalUsd,
  type PositionMarkToMarket,
} from "@/lib/leverx/position-metrics";
import { PositionTradeLink } from "@/components/leverx/MarketTradeLink";
import { positionShowsManageAction } from "@/lib/leverx/position-quantity";
import { premiumRawToCents } from "@/lib/leverx/trade-math";
import {
  AnimatedPnl,
  AnimatedPremiumCents,
  AnimatedQuantity,
} from "@/components/ui/animated-numbers";
import { predictSideFromBinary, type PredictSide } from "@/lib/predict/instruments";
import { ui } from "@/lib/copy";
import { formatLiquidationThresholdPct, resolveLiquidationBps } from "@/lib/leverx/protocol";
import { formatStrikeUsdFromRaw } from "@/lib/leverx/strike-selection";
import { TableExpiryCountdown } from "@/components/leverx/TableExpiryCountdown";
import { cn } from "@/lib/utils";
import { labelCaps, pillIconBtn, pillToggleIdle } from "@/lib/leverx/tw";

interface Props {
  positions: readonly LeveragedPosition[];
  markToMarket: Map<string, PositionMarkToMarket>;
  isRefreshing?: boolean;
  owner?: string;
  compact?: boolean;
  showHeader?: boolean;
  /** Hide Health (est.) and Expiry columns — used for closed positions. */
  hideLiveMetrics?: boolean;
  className?: string;
  /** Resets table pagination when changed (e.g. open vs closed filter). */
  paginationKey?: string | number;
  pageSize?: number;
  /** When set, shows an eye toggle per open row to show/hide strike lines on the trade chart. */
  chartVisibleIds?: ReadonlySet<string>;
  onChartVisibilityToggle?: (positionId: string) => void;
}

interface PositionRow {
  id: string;
  position: LeveragedPosition;
  asset: string;
  side: PredictSide;
  strikeLabel: string;
  mtm: PositionMarkToMarket | undefined;
}

function formatStrike(position: LeveragedPosition): string {
  if (position.is_range && position.higher_strike > 0) {
    return `${formatStrikeUsdFromRaw(position.strike)}–${formatStrikeUsdFromRaw(position.higher_strike)}`;
  }
  if (position.strike > 0) {
    return formatStrikeUsdFromRaw(position.strike);
  }
  return "—";
}

function buildRows(
  positions: readonly LeveragedPosition[],
  markToMarket: Map<string, PositionMarkToMarket>,
  oracles: readonly { oracle_id: string; underlying_asset?: string; }[],
): PositionRow[] {
  return positions.map((position) => ({
    id: positionRowId(position),
    position,
    asset: assetLabelForOracleId(position.oracle_id, oracles),
    side: predictSideFromBinary({
      isUp: position.is_up,
      isRange: position.is_range,
    }),
    strikeLabel: formatStrike(position),
    mtm: markToMarket.get(positionRowId(position)),
  }));
}

function PnlBreakdownRow({ label, value }: { label: string; value: ReactNode; }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function PnlCell({
  position,
  mtm,
  closed,
}: {
  position: LeveragedPosition;
  mtm?: PositionMarkToMarket;
  closed: boolean;
}) {
  if (closed) {
    const pnlUsd = realizedPnlUsd(position);
    if (pnlUsd == null) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }
    const tone =
      pnlUsd > 0 ? "text-success" : pnlUsd < 0 ? "text-destructive" : "text-muted-foreground";
    const breakdown = closedPositionPnlBreakdown(position);
    const pnlContent = (
      <>
        <div className="text-sm font-medium">
          <AnimatedPnl value={pnlUsd} />
        </div>
        <div className="text-[11px] opacity-80">{formatPnlPct(realizedPnlPct(position))}</div>
      </>
    );

    if (!breakdown) {
      return <div className={cn("text-right tabular-nums", tone)}>{pnlContent}</div>;
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group inline-flex items-center justify-end gap-1 rounded-sm text-right tabular-nums transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              tone,
            )}
            aria-label="P&L breakdown"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div>{pnlContent}</div>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-56 p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border px-3 py-2.5">
            <LabelWithInfo
              label="P&L breakdown"
              labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              info={leverxInfo.closedPnlBreakdown}
            />
          </div>
          <div className="px-3 py-1">
            <PnlBreakdownRow
              label="Margin posted"
              value={<QuoteAmount amount={breakdown.marginPostedUsd} hideZero={false} />}
            />
            {breakdown.walletRepaidUsd > 0 ? (
              <PnlBreakdownRow
                label="Wallet repaid"
                value={<QuoteAmount amount={breakdown.walletRepaidUsd} hideZero={false} />}
              />
            ) : null}
            <PnlBreakdownRow
              label="Cash back"
              value={<QuoteAmount amount={breakdown.cashBackUsd} hideZero={false} />}
            />
            <PnlBreakdownRow
              label="Borrow at close"
              value={<QuoteAmount amount={breakdown.borrowRepaidUsd} hideZero={false} />}
            />
            {breakdown.interestPaidUsd > 0 ? (
              <PnlBreakdownRow
                label="Interest at close"
                value={<QuoteAmount amount={breakdown.interestPaidUsd} hideZero={false} />}
              />
            ) : null}
            <PnlBreakdownRow
              label="Net P&L"
              value={
                <span className={tone}>
                  <QuoteAmount amount={breakdown.netPnlUsd} hideZero={false} />
                </span>
              }
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  if (!mtm?.isLive) {
    return <span className="text-sm text-muted-foreground">…</span>;
  }
  const tone =
    mtm.unrealizedPnlUsd > 0
      ? "text-success"
      : mtm.unrealizedPnlUsd < 0
        ? "text-destructive"
        : "text-muted-foreground";
  const borrowedUsd = mtm.borrowedUsd;
  const marginUsd = positionMarginUsd(position);
  const walletRepaidUsd = walletRepaidPrincipalUsd(position);

  const pnlContent = (
    <>
      <div className="text-sm font-medium">
        <AnimatedPnl value={mtm.unrealizedPnlUsd} />
      </div>
      <div className="text-[11px] opacity-80">{formatPnlPct(mtm.unrealizedPnlPct)}</div>
    </>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group inline-flex items-center justify-end gap-1 rounded-sm text-right tabular-nums transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            tone,
          )}
          aria-label="Unrealized P&L breakdown"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div>{pnlContent}</div>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-56 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="border-b border-border px-3 py-2.5">
          <LabelWithInfo
            label="Unrealized P&L"
            labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            info={leverxInfo.unrealizedPnl}
          />
        </div>
        <div className="px-3 py-1">
          <PnlBreakdownRow
            label="Redeem bid"
            value={<QuoteAmount amount={mtm.markValueUsd} hideZero={false} />}
          />
          {mtm.keyQuoteUsd > 0 ? (
            <PnlBreakdownRow
              label="Locked on key"
              value={<QuoteAmount amount={mtm.keyQuoteUsd} hideZero={false} />}
            />
          ) : null}
          {borrowedUsd > 0 ? (
            <PnlBreakdownRow
              label="Vault borrow"
              value={
                <span className="text-destructive">
                  −<QuoteAmount amount={borrowedUsd} hideZero={false} className="inline-flex" />
                </span>
              }
            />
          ) : null}
          <PnlBreakdownRow
            label="Margin posted"
            value={<QuoteAmount amount={marginUsd} hideZero={false} />}
          />
          {walletRepaidUsd > 0 ? (
            <PnlBreakdownRow
              label="Wallet repaid"
              value={<QuoteAmount amount={walletRepaidUsd} hideZero={false} />}
            />
          ) : null}
          <PnlBreakdownRow
            label="Net P&L"
            value={
              <span className={tone}>
                <QuoteAmount amount={mtm.unrealizedPnlUsd} hideZero={false} />
              </span>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HealthCell({
  mtm,
  position,
  closed,
}: {
  mtm?: PositionMarkToMarket;
  position: LeveragedPosition;
  closed: boolean;
}) {
  const { data: protocol } = useIndexerProtocol();
  const liquidationBps = resolveLiquidationBps(protocol);

  if (closed || mtm?.healthBps == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const isLeveraged = mtm?.isLeveraged ?? position.leverage_bps > 10_000;

  if (!isLeveraged) {
    const collateralHint =
      mtm.keyQuoteUsd > 0
        ? `Collateral includes ${mtm.keyQuoteUsd.toFixed(2)} locked on key. `
        : "";
    return (
      <div className="min-w-22">
        <div className="mb-1 flex items-center justify-end gap-1.5 text-sm font-medium tabular-nums">
          <span className="text-success">{formatHealthBps(mtm.healthBps)}</span>
        </div>
        <div
          className="relative h-1.5 overflow-hidden rounded-full bg-muted"
          title={`${collateralHint}No vault borrow on this position.`}
        >
          <div className="absolute inset-y-0 left-0 w-full rounded-full bg-success" />
        </div>
      </div>
    );
  }

  const healthPct = mtm.healthBps / 100;
  const liquidationPct = liquidationBps / 100;
  const barMaxPct = Math.max(healthPct, liquidationPct);
  const fillWidth = (healthPct / barMaxPct) * 100;
  const liquidationWidth = (liquidationPct / barMaxPct) * 100;
  const aboveLiquidationWidth = Math.max(0, fillWidth - liquidationWidth);

  const aboveTone =
    mtm.healthLabel === "healthy"
      ? "bg-success"
      : mtm.healthLabel === "margin_call"
        ? "bg-amber-500"
        : "bg-destructive";

  const belowLiquidationTone = "bg-destructive/35";

  const collateralHint =
    mtm.keyQuoteUsd > 0
      ? `Collateral = redeem bid + ${mtm.keyQuoteUsd.toFixed(2)} locked on key. `
      : "";

  return (
    <div className="min-w-22">
      <div className="mb-1 flex items-center justify-end gap-1.5 text-sm font-medium tabular-nums">
        <span
          className={cn(
            mtm.healthLabel === "healthy" && "text-success",
            mtm.healthLabel === "margin_call" && "text-amber-500",
            mtm.healthLabel === "at_risk" && "text-destructive",
          )}
        >
          {formatHealthBps(mtm.healthBps)}
        </span>
      </div>
      <div
        className="relative h-1.5 overflow-hidden rounded-full bg-muted"
        title={`${collateralHint}Liquidation below ${formatLiquidationThresholdPct(liquidationBps)} health`}
      >
        {healthPct >= liquidationPct ? (
          <>
            <div
              className={cn("absolute inset-y-0 left-0 rounded-l-full", belowLiquidationTone)}
              style={{ width: `${liquidationWidth}%` }}
            />
            {aboveLiquidationWidth > 0 ? (
              <div
                className={cn("absolute inset-y-0 rounded-r-full transition-all", aboveTone)}
                style={{ left: `${liquidationWidth}%`, width: `${aboveLiquidationWidth}%` }}
              />
            ) : null}
          </>
        ) : (
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all", aboveTone)}
            style={{ width: `${fillWidth}%` }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-y-0 z-10 w-px -translate-x-1/2 bg-foreground/55"
          style={{ left: `${Math.min(100, Math.max(0, liquidationWidth))}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

function LiveDot({ active }: { active?: boolean; }) {
  if (!active) return null;
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-success"
      title="Live mark"
    />
  );
}

function openEntryPremiumCents(position: LeveragedPosition): number | null {
  const premium = entryPremiumPerUnitRaw(position);
  return premium != null ? premiumRawToCents(premium) : null;
}

function MarginBorrowCell({ position }: { position: LeveragedPosition; }) {
  const marginUsd = positionMarginUsd(position);
  const borrowUsd = positionBorrowUsd(position);
  const leverage = positionLeverageMultiplier(position);
  const walletRepaidUsd = walletRepaidPrincipalUsd(position);

  return (
    <>
      <div className="font-medium">
        <QuoteAmount amount={marginUsd} />
        <span className="font-normal text-muted-foreground"> margin</span>
      </div>
      <div className="text-[11px] tabular-nums text-muted-foreground">
        {leverage.toFixed(1)}×
        {borrowUsd > 0 ? (
          <>
            {" · "}
            <QuoteAmount amount={borrowUsd} digits={1} className="inline-flex" /> borrow
          </>
        ) : null}
      </div>
      {walletRepaidUsd > 0 ? (
        <div className="text-[11px] tabular-nums text-muted-foreground">
          <QuoteAmount amount={walletRepaidUsd} digits={2} className="inline-flex" /> repaid
        </div>
      ) : null}
    </>
  );
}

function StatusCell({ status }: { status: string; }) {
  const isOpen = status === "open";
  return (
    <span
      className={cn(
        "text-sm capitalize",
        isOpen ? "font-medium text-success" : "text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function ChartVisibilityCell({
  positionId,
  visible,
  onToggle,
}: {
  positionId: string;
  visible: boolean;
  onToggle: (positionId: string) => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        pillIconBtn,
        pillToggleIdle,
        "h-7 w-7 rounded-md p-0",
        visible && "text-foreground",
      )}
      aria-label={visible ? "Hide position on chart" : "Show position on chart"}
      aria-pressed={visible}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(positionId);
      }}
    >
      {visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
    </button>
  );
}

export function LeverxPositionsTable({
  positions,
  markToMarket,
  isRefreshing,
  owner,
  compact,
  showHeader = true,
  hideLiveMetrics = false,
  className,
  paginationKey,
  pageSize,
  chartVisibleIds,
  onChartVisibilityToggle,
}: Props) {
  const { data: oracles = [] } = usePredictOracleRows();
  const rows = useMemo(
    () => buildRows(positions, markToMarket, oracles),
    [positions, markToMarket, oracles],
  );

  const showChartToggle = Boolean(onChartVisibilityToggle && chartVisibleIds);

  const allCols: Column<PositionRow>[] = [
    ...(showChartToggle
      ? [
          {
            key: "chart",
            header: "",
            className: "w-[1px] whitespace-nowrap px-0",
            cell: (r: PositionRow) =>
              r.position.status === "open" ? (
                <ChartVisibilityCell
                  positionId={r.id}
                  visible={chartVisibleIds!.has(r.id)}
                  onToggle={onChartVisibilityToggle!}
                />
              ) : null,
          } satisfies Column<PositionRow>,
        ]
      : []),
    {
      key: "market",
      header: "Market",
      mobileEmphasis: true,
      cell: (r) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AssetBadge asset={r.asset} size="sm" />
            <div className="min-w-0">
              <PositionTradeLink
                position={r.position}
                className="block min-w-0 hover:underline"
              >
                <span className="block truncate text-sm font-medium">
                  <MarketTitle side={r.side} />
                </span>
                <PredictSideLabel
                  side={r.side}
                  colored
                  className="mt-0.5 text-xs font-medium"
                />
              </PositionTradeLink>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      mobileLabel: "Status",
      cell: (r) => <StatusCell status={r.position.status} />,
    },
    {
      key: "strike",
      header: "Strike",
      mobileLabel: "Strike",
      cell: (r) => <span className="font-mono text-sm">{r.strikeLabel}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      mobileLabel: "Qty",
      cell: (r) => (
        <span className="font-mono text-sm tabular-nums">
          {r.position.open_quantity > 0 ? (
            <AnimatedQuantity value={r.position.open_quantity} />
          ) : (
            "—"
          )}
        </span>
      ),
    },
    {
      key: "entry",
      header: (
        <LabelWithInfo
          label="Avg fill"
          labelClassName="text-inherit"
          info={leverxInfo.positionAvgFill}
        />
      ),
      align: "right",
      mobileLabel: "Avg fill",
      cell: (r) => {
        const closed = r.position.status !== "open";
        const entryCents = closed
          ? closedEntryPremiumCents(r.position)
          : openEntryPremiumCents(r.position);
        const mintCostUsd = positionMintCostUsd(r.position);
        return (
          <div className="text-right tabular-nums">
            <span className="font-mono text-sm text-muted-foreground">
              {entryCents != null ? (
                <AnimatedPremiumCents value={entryCents} placeholder="—" />
              ) : (
                "—"
              )}
            </span>
            {mintCostUsd > 0 ? (
              <div className="text-[11px] text-muted-foreground">
                <QuoteAmount amount={mintCostUsd} digits={2} className="inline-flex" /> total
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "mark",
      header: (
        <span className="inline-flex items-center gap-1.5">
          <LabelWithInfo
            label={hideLiveMetrics ? "Exit" : "Now"}
            labelClassName="text-inherit"
            info={leverxInfo.positionNow}
          />
          {!hideLiveMetrics && isRefreshing ? (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
          ) : null}
        </span>
      ),
      mobileLabel: hideLiveMetrics ? "Exit" : "Now",
      align: "right",
      cell: (r) => {
        const closed = r.position.status !== "open";
        if (closed) {
          const closingCents = closedClosingPremiumCents(r.position);
          return (
            <span className="font-mono text-sm tabular-nums text-muted-foreground">
              {closingCents != null ? (
                <AnimatedPremiumCents value={closingCents} placeholder="—" />
              ) : (
                <AnimatedPremiumCents value={0} />
              )}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-sm tabular-nums">
            <LiveDot active={r.mtm?.isLive} />
            {r.mtm?.markBidCents != null ? (
              <AnimatedPremiumCents
                value={r.mtm.markBidCents}
                loading={false}
                loadingPlaceholder="…"
              />
            ) : (
              "…"
            )}
          </span>
        );
      },
    },
    {
      key: "pnl",
      header: (
        <LabelWithInfo
          label="P&L"
          labelClassName="text-inherit"
          info={leverxInfo.positionPnlMargin}
        />
      ),
      align: "right",
      mobileTrailing: true,
      mobileLabel: "P&L (margin)",
      cell: (r) => (
        <PnlCell
          position={r.position}
          mtm={r.mtm}
          closed={r.position.status !== "open"}
        />
      ),
    },
    {
      key: "margin",
      header: (
        <LabelWithInfo
          label="Margin"
          labelClassName="text-inherit"
          info={leverxInfo.positionMarginBorrow}
        />
      ),
      align: "right",
      mobileLabel: "Margin",
      cell: (r) => <MarginBorrowCell position={r.position} />,
    },
    {
      key: "health",
      header: (
        <LabelWithInfo label="Health (est.)" labelClassName="text-inherit" info={leverxInfo.estimatedHealth} />
      ),
      align: "right",
      mobileLabel: "Health (est.)",
      cell: (r) => (
        <HealthCell mtm={r.mtm} position={r.position} closed={r.position.status !== "open"} />
      ),
    },
    {
      key: "expiry",
      header: "Expiry",
      align: "right",
      className: "w-[1px] whitespace-nowrap",
      mobileLabel: "Expiry",
      cell: (r) => <TableExpiryCountdown expiryMs={r.position.expiry_ms} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      mobileFooter: true,
      cell: (r) =>
        positionShowsManageAction(r.position) ? (
          <PositionActionsTrigger position={r.position} />
        ) : null,
    },
  ];

  const cols = hideLiveMetrics
    ? allCols.filter((col) => col.key !== "health" && col.key !== "expiry")
    : allCols;

  return (
    <div className={cn("space-y-2", className)}>
      {showHeader ? (
        <div className="flex items-center justify-between gap-2 border-b border-border px-1 pb-2">
          <LabelWithInfo
            labelClassName={labelCaps}
            label={ui.predictManagerOpenPositions}
            info={leverxInfo.openPositionsTable}
          />
          {isRefreshing ? (
            <span className="text-[11px] text-muted-foreground">Updating marks…</span>
          ) : null}
        </div>
      ) : null}
      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(r) => r.id}
        paginationKey={paginationKey}
        pageSize={pageSize}
      />
    </div>
  );
}
