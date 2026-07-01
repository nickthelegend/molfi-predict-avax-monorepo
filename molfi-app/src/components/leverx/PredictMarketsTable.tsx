import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, BarChart3, ChevronsUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketTableSkeleton } from "@/components/ui/market-skeleton";
import { AssetBadge } from "@/components/AssetBadge";
import { MarketFavoriteButton } from "@/components/leverx/MarketFavoriteButton";
import { MarketPremiumQuote } from "@/components/leverx/MarketPremiumQuote";
import { MarketSideActions } from "@/components/leverx/MarketSideActions";
import { MarketTradeLink } from "@/components/leverx/MarketTradeLink";
import { useMarketsUpDisplay } from "@/hooks/useMarketsUpDisplay";
import {
  MARKETS_TABLE_PAGE_SIZE,
  MarketCatalogPagination,
  paginateSlice,
} from "@/components/leverx/MarketCatalogPagination";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import {
  marketSortToKeyDir,
  toggleMarketTableSort,
  type MarketSortId,
  type MarketSortKey,
} from "@/lib/leverx/market-sort";
import { AnimatedCompactUsd } from "@/components/ui/animated-numbers";
import { formatAutoClose } from "@/lib/leverx/placeholders";
import { ui } from "@/lib/copy";
import {
  marketsMarketCell,
  marketsMarketLink,
  marketsRow,
  marketsTable,
  marketsTableDesktop,
  marketsTableMobileCard,
  marketsTableMobileCardHeader,
  marketsTableMobileCardStats,
  marketsTableMobileStack,
  marketsTableMobileStatLabel,
  marketsTableMobileStatValue,
  marketsTableScroll,
  marketsTableShell,
  marketsTd,
  marketsTdHideLg,
  marketsTdHideMd,
  marketsTdHideSm,
  marketsTdMarket,
  marketsTdMono,
  marketsTdMuted,
  marketsTdTrade,
  marketsTh,
  marketsThBtn,
  marketsThBtnRight,
  marketsThHideLg,
  marketsThHideMd,
  marketsThHideSm,
  marketsThMarket,
  marketsThSortActive,
  marketsThTrade,
  marketsTradeActions,
  pageState,
} from "@/lib/leverx/tw";
import { MarketLeverageBadges } from "@/components/leverx/MarketLeverageBadges";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

type SortKey = MarketSortKey;
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  active,
  direction,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  direction: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      className={cn(marketsThBtn, align === "right" && marketsThBtnRight)}
      onClick={onClick}
    >
      <span>{label}</span>
      <span className={cn("inline-flex items-center", active && marketsThSortActive)}>
        {active ? (
          direction === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </button>
  );
}

function MarketMobileCard({
  display,
  source,
  liquidityLabel,
  premiumSeries,
  premiumLoading,
  now,
}: {
  display: LeverxMarketRow;
  source: LeverxMarketRow;
  liquidityLabel: ReactNode;
  premiumSeries: readonly number[];
  premiumLoading?: boolean;
  now: number;
}) {
  return (
    <article className={marketsTableMobileCard}>
      <div className={marketsTableMobileCardHeader}>
        <MarketFavoriteButton marketId={source.id} />
        <AssetBadge asset={display.asset} iconUrl={display.iconUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <MarketTradeLink
            market={display}
            side="up"
            className={cn(marketsMarketLink, "font-medium")}
          >
            <MarketTitle title={display.question} />
          </MarketTradeLink>
          <MarketLeverageBadges
            expiryMs={display.expiry}
            now={now}
            quotePaused={display.quotePaused}
          />
        </div>
        <MarketPremiumQuote
          series={premiumSeries}
          lastAskPremium={display.lastAskPremium}
          premiumLoading={premiumLoading}
          quotePaused={display.quotePaused}
          compact
        />
      </div>

      <dl className={marketsTableMobileCardStats}>
        <div>
          <dt className={marketsTableMobileStatLabel}>Volume</dt>
          <dd className={cn(marketsTableMobileStatValue, "font-mono tabular-nums")}>
            <AnimatedCompactUsd value={source.volume > 0 ? source.volume : null} />
          </dd>
        </div>
        <div>
          <dt className={marketsTableMobileStatLabel}>Liquidity</dt>
          <dd className={cn(marketsTableMobileStatValue, "font-mono tabular-nums")}>
            {liquidityLabel}
          </dd>
        </div>
        <div>
          <dt className={marketsTableMobileStatLabel}>Auto close</dt>
          <dd className={cn(marketsTableMobileStatValue, "text-muted-foreground")}>
            {display.expiry ? formatAutoClose(display.expiry) : "—"}
          </dd>
        </div>
      </dl>

      <MarketSideActions market={source} stretch />
    </article>
  );
}

interface Props {
  markets: LeverxMarketRow[];
  sort: MarketSortId;
  onSortChange: (sort: MarketSortId) => void;
  liquidityLabel?: ReactNode;
  offline?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function PredictMarketsTable({
  markets,
  sort,
  onSortChange,
  liquidityLabel = "_",
  offline,
  emptyTitle = ui.emptyMarkets,
  emptyDescription = ui.emptyMarketsHint,
}: Props) {
  const { key: sortKey, dir: sortDir } = marketSortToKeyDir(sort);
  const [page, setPage] = useState(1);
  const marketIdsKey = useMemo(
    () => markets.map((market) => market.id).join(","),
    [markets],
  );

  useEffect(() => {
    setPage(1);
  }, [marketIdsKey, sort]);

  const toggleSort = (key: SortKey) => {
    onSortChange(toggleMarketTableSort(sort, key));
  };

  const { items: pageMarkets, page: currentPage, totalPages, totalItems } = useMemo(
    () => paginateSlice(markets, page, MARKETS_TABLE_PAGE_SIZE),
    [markets, page],
  );

  const { sourceById, displayMarkets, premiumLoading, seriesByMarketId } =
    useMarketsUpDisplay(pageMarkets);
  const now = useNow(1000);

  if (markets.length === 0 && !offline) {
    return (
      <div className={pageState}>
        <EmptyState
          icon={BarChart3}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    );
  }

  if (markets.length === 0 && offline) {
    return <MarketTableSkeleton />;
  }

  return (
    <div className={marketsTableShell}>
      <div className={marketsTableMobileStack}>
        {displayMarkets.map((display) => {
          const source = sourceById.get(display.id) ?? display;
          return (
            <MarketMobileCard
              key={display.id}
              display={display}
              source={source}
              liquidityLabel={liquidityLabel}
              premiumSeries={seriesByMarketId.get(display.id) ?? []}
              premiumLoading={premiumLoading}
              now={now}
            />
          );
        })}
      </div>

      <div className={cn(marketsTableScroll, marketsTableDesktop)}>
        <table className={marketsTable}>
          <thead>
            <tr>
              <th className={cn(marketsTh, marketsThMarket)}>Market</th>
              <th className={marketsTh}>
                <SortHeader
                  label="Asset price"
                  active={sortKey === "price"}
                  direction={sortDir}
                  onClick={() => toggleSort("price")}
                />
              </th>
              <th className={cn(marketsTh, marketsThHideMd)}>
                <SortHeader
                  label="Volume"
                  active={sortKey === "volume"}
                  direction={sortDir}
                  onClick={() => toggleSort("volume")}
                />
              </th>
              <th className={cn(marketsTh, marketsThHideLg)}>
                <SortHeader
                  label="Liquidity"
                  active={sortKey === "liquidity"}
                  direction={sortDir}
                  onClick={() => toggleSort("liquidity")}
                />
              </th>
              <th className={cn(marketsTh, marketsThHideSm)}>
                <SortHeader
                  label="Auto close"
                  active={sortKey === "expiry"}
                  direction={sortDir}
                  onClick={() => toggleSort("expiry")}
                />
              </th>
              <th className={cn(marketsTh, marketsThTrade)} aria-label="Trade actions" />
            </tr>
          </thead>
          <tbody>
            {displayMarkets.map((display) => {
              const source = sourceById.get(display.id) ?? display;

              return (
                <tr key={display.id} className={marketsRow}>
                  <td className={cn(marketsTd, marketsTdMarket)}>
                    <div className={marketsMarketCell}>
                      <MarketFavoriteButton marketId={source.id} />
                      <AssetBadge asset={display.asset} iconUrl={display.iconUrl} size="sm" />
                      <div className="min-w-0 flex-1">
                        <MarketTradeLink
                          market={display}
                          side="up"
                          className={cn(marketsMarketLink, "font-medium")}
                        >
                          <MarketTitle title={display.question} />
                        </MarketTradeLink>
                        <MarketLeverageBadges
                          expiryMs={display.expiry}
                          now={now}
                          quotePaused={display.quotePaused}
                        />
                      </div>
                    </div>
                  </td>
                  <td className={marketsTd}>
                    <MarketPremiumQuote
                      series={seriesByMarketId.get(display.id) ?? []}
                      lastAskPremium={display.lastAskPremium}
                      premiumLoading={premiumLoading}
                      quotePaused={display.quotePaused}
                      compact
                    />
                  </td>
                  <td className={cn(marketsTd, marketsTdMono, marketsTdHideMd)}>
                    <AnimatedCompactUsd value={source.volume > 0 ? source.volume : null} />
                  </td>
                  <td className={cn(marketsTd, marketsTdMono, marketsTdHideLg)}>
                    {liquidityLabel}
                  </td>
                  <td className={cn(marketsTd, marketsTdMuted, marketsTdHideSm)}>
                    {display.expiry ? formatAutoClose(display.expiry) : "—"}
                  </td>
                  <td className={cn(marketsTd, marketsTdTrade)}>
                    <div className={marketsTradeActions}>
                      <MarketSideActions market={source} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <MarketCatalogPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={MARKETS_TABLE_PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
