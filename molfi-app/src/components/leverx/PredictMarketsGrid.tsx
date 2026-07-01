import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketGridSkeleton } from "@/components/ui/market-skeleton";
import { AssetBadge } from "@/components/AssetBadge";
import { MarketFavoriteButton } from "@/components/leverx/MarketFavoriteButton";
import { MarketPremiumQuote } from "@/components/leverx/MarketPremiumQuote";
import { MarketSideActions } from "@/components/leverx/MarketSideActions";
import { SentimentBar } from "@/components/leverx/SentimentBar";
import { useMarketsUpDisplay } from "@/hooks/useMarketsUpDisplay";
import {
  MARKETS_GRID_PAGE_SIZE,
  MarketCatalogPagination,
  paginateSlice,
} from "@/components/leverx/MarketCatalogPagination";
import type { ReactNode } from "react";
import { AnimatedCompactUsd, AnimatedMarketPremium } from "@/components/ui/animated-numbers";
import { MarketTradeLink } from "@/components/leverx/MarketTradeLink";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import { ui } from "@/lib/copy";
import {
  landingCtaSecondary,
  marketCard,
  marketCardActions,
  marketCardBody,
  marketCardHeader,
  marketCardInteractive,
  marketCardMeta,
  marketCardOverlay,
  marketCardPrice,
  marketCardPriceValue,
  marketsGrid,
  pageState,
} from "@/lib/leverx/tw";
import { formatAutoClose } from "@/lib/leverx/placeholders";
import { MarketLeverageBadges } from "@/components/leverx/MarketLeverageBadges";
import { useNow } from "@/hooks/useNow";
import { cn } from "@/lib/utils";

interface Props {
  markets: LeverxMarketRow[];
  liquidityLabel?: ReactNode;
  offline?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function PredictMarketsGrid({
  markets,
  liquidityLabel = "_",
  offline,
  emptyTitle = ui.emptyMarkets,
  emptyDescription = ui.emptyMarketsHint,
}: Props) {
  const [page, setPage] = useState(1);

  const marketIdsKey = useMemo(
    () => markets.map((market) => market.id).join(","),
    [markets],
  );

  useEffect(() => {
    setPage(1);
  }, [marketIdsKey]);

  const { items: pageMarkets, page: currentPage, totalPages, totalItems } = useMemo(
    () => paginateSlice(markets, page, MARKETS_GRID_PAGE_SIZE),
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
          action={
            <Link to="/guide" className={cn(landingCtaSecondary, "text-sm")}>
              Learn how markets work
            </Link>
          }
        />
      </div>
    );
  }

  if (markets.length === 0 && offline) {
    return <MarketGridSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <div className={marketsGrid}>
        {displayMarkets.map((display) => {
          const source = sourceById.get(display.id) ?? display;

          return (
            <article key={display.id} className={marketCard}>
              <MarketTradeLink
                market={display}
                side="up"
                className={marketCardOverlay}
                aria-hidden
                tabIndex={-1}
              />
              <div className={marketCardBody}>
                <div className={marketCardHeader}>
                  <AssetBadge asset={display.asset} iconUrl={display.iconUrl} size="sm" />
                  <MarketTradeLink
                    market={display}
                    side="up"
                    className={cn(marketCardInteractive, "min-w-0 flex-1 no-underline")}
                  >
                    <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors hover:text-accent">
                      <MarketTitle title={display.question} />
                    </p>
                    <MarketLeverageBadges
                      expiryMs={display.expiry}
                      now={now}
                      quotePaused={display.quotePaused}
                    />
                  </MarketTradeLink>
                  <MarketTradeLink
                    market={display}
                    side="up"
                    className={cn(marketCardInteractive, marketCardPrice, "no-underline")}
                  >
                    <div className={marketCardPriceValue}>
                      <AnimatedMarketPremium
                        premium={display.lastAskPremium}
                        quotePaused={display.quotePaused}
                        loading={
                          premiumLoading &&
                          !display.quotePaused &&
                          (display.lastAskPremium == null || display.lastAskPremium <= 0)
                        }
                      />
                    </div>
                  </MarketTradeLink>
                </div>

                <SentimentBar yesPct={display.lastAskPremium} compact />

                <div className={marketCardActions}>
                  <MarketSideActions market={source} stretch className="w-full" />
                </div>

                <div className={marketCardMeta}>
                  <span>
                    {source.volume > 0 ? (
                      <>
                        <AnimatedCompactUsd value={source.volume} /> Vol
                      </>
                    ) : (
                      <span className="text-muted-foreground/70">No bets yet</span>
                    )}
                  </span>
                  <div className={cn(marketCardInteractive, "flex items-center gap-2")}>
                    <span>{display.expiry ? formatAutoClose(display.expiry) : "—"}</span>
                    <MarketFavoriteButton
                      marketId={source.id}
                      size="sm"
                      className="h-7 w-7 min-w-7 p-0"
                      iconClassName="h-3 w-3"
                    />
                  </div>
                </div>
              </div>

              <MarketPremiumQuote
                variant="band"
                footer
                series={seriesByMarketId.get(display.id) ?? []}
                lastAskPremium={display.lastAskPremium}
                premiumLoading={premiumLoading}
                quotePaused={display.quotePaused}
              />
            </article>
          );
        })}
      </div>
      <MarketCatalogPagination
        page={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={MARKETS_GRID_PAGE_SIZE}
        onPageChange={setPage}
      />
    </div>
  );
}
