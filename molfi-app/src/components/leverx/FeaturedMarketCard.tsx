import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { AssetBadge } from "@/components/AssetBadge";
import { FeaturedCommentsFeed } from "@/components/leverx/FeaturedCommentsFeed";
import { FeaturedMarketSpotChart } from "@/components/leverx/FeaturedMarketSpotChart";
import { LivePriceChart } from "@/components/LivePriceChart";
import { fetchBackendPrices } from "@/lib/molfi-backend";
import { MarketTradeLink } from "@/components/leverx/MarketTradeLink";
import { AnimatedAssetPrice, AnimatedCompactUsd } from "@/components/ui/animated-numbers";
import { useVisibleMarketAsks } from "@/hooks/useVisibleMarketAsks";
import { usePayoutMultiplier } from "@/hooks/usePayoutMultiplier";
import { useNow } from "@/hooks/useNow";
import { formatAutoClose } from "@/lib/leverx/placeholders";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import { formatAssetPriceUsd, formatStrikeUsdFromRaw } from "@/lib/leverx/format-asset-price";
import {
  featuredDownRow,
  featuredRangeRow,
  formatFeaturedCountdown,
} from "@/lib/leverx/featured-market-utils";
import { isRangeTradingEnabled } from "@/lib/predict/instruments";
import { cn } from "@/lib/utils";

interface Props {
  market: LeverxMarketRow;
  sourceMarket: LeverxMarketRow;
  className?: string;
}

export function FeaturedMarketCard({
  market,
  sourceMarket,
  className,
}: Props) {
  const now = useNow(1000);
  const downRow = useMemo(() => featuredDownRow(market), [market]);
  const rangeRow = useMemo(() => featuredRangeRow(market), [market]);
  const rangeEnabled = isRangeTradingEnabled() && rangeRow != null;
  const askRows = useMemo(() => {
    const rows = [market, downRow];
    if (rangeRow) rows.push(rangeRow);
    return rows;
  }, [market, downRow, rangeRow]);
  const { markets: quoted } = useVisibleMarketAsks(askRows);
  const upQuote = quoted[0] ?? market;
  const downQuote = quoted[1] ?? downRow;
  const rangeQuote = rangeRow ? (quoted[2] ?? rangeRow) : null;

  const spot = market.spotPrice ?? sourceMarket.spotPrice ?? null;
  const strikeUsd = market.strikeRaw > 0 ? market.strikeRaw / 1e9 : 0;
  const spotDelta =
    spot != null && strikeUsd > 0 ? spot - strikeUsd : null;
  const remainingMs = market.expiry > 0 ? Math.max(0, market.expiry - now) : 0;
  const countdown = remainingMs > 0 ? formatFeaturedCountdown(remainingMs) : null;

  const upMultiplier = usePayoutMultiplier(upQuote.lastAskPremium);
  const downMultiplier = usePayoutMultiplier(downQuote.lastAskPremium);
  const rangeMultiplier = usePayoutMultiplier(rangeQuote?.lastAskPremium);

  return (
    <article className={cn("featured-market-card", className)}>
      <header className="featured-market-header">
        <div className="featured-market-header-main">
          <AssetBadge asset={market.asset} iconUrl={market.iconUrl} size="md" />
          <div className="min-w-0 flex-1">
            <MarketTradeLink
              market={market}
              side="up"
              className="featured-market-title-link"
            >
              <h2 className="featured-market-title">
                <MarketTitle title={market.question} />
              </h2>
            </MarketTradeLink>
            <p className="featured-market-subtitle">
              {market.expiry ? formatAutoClose(market.expiry) : "—"}
            </p>
          </div>
        </div>

        <div className="featured-market-prices">
          <div className="featured-market-price-stat">
            <span className="featured-market-price-label">Strike price</span>
            <span className="featured-market-price-value">
              {strikeUsd > 0 ? formatStrikeUsdFromRaw(market.strikeRaw) : "—"}
            </span>
          </div>
          <div className="featured-market-price-stat featured-market-price-stat--current">
            <span className="featured-market-price-label">Current price</span>
            <span className="featured-market-price-value featured-market-price-value--spot">
              {spotDelta != null && Math.abs(spotDelta) >= 0.01 ? (
                <span
                  className={cn(
                    "featured-market-price-delta",
                    spotDelta >= 0 ? "is-up" : "is-down",
                  )}
                >
                  {spotDelta >= 0 ? (
                    <TrendingUp className="h-3 w-3" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3 w-3" aria-hidden />
                  )}
                  {spotDelta >= 0 ? "+" : "-"}
                  {formatAssetPriceUsd(Math.abs(spotDelta))}
                </span>
              ) : null}
              <AnimatedAssetPrice value={spot} />
            </span>
          </div>
        </div>

        {countdown ? (
          <p className="featured-market-countdown" role="timer" aria-live="polite">
            Ends in <span>{countdown}</span>
          </p>
        ) : <p className="featured-market-countdown" role="timer" aria-live="polite">
          Ended
        </p>}
      </header>

      <div
        className={cn(
          "featured-market-content",
          rangeEnabled && "featured-market-content--with-range",
        )}
      >
        <div
          className={cn(
            "featured-market-bets",
            rangeEnabled && "featured-market-bets--with-range",
          )}
        >
          <MarketTradeLink
            market={sourceMarket}
            side="up"
            className="featured-market-bet featured-market-bet--up"
          >
            <span className="featured-market-bet-label">UP</span>
            <span className="featured-market-bet-odds">{upMultiplier ?? "—"}</span>
          </MarketTradeLink>
          <MarketTradeLink
            market={sourceMarket}
            side="down"
            className="featured-market-bet featured-market-bet--down"
          >
            <span className="featured-market-bet-label">DOWN</span>
            <span className="featured-market-bet-odds">{downMultiplier ?? "—"}</span>
          </MarketTradeLink>
          {rangeEnabled && rangeRow ? (
            <MarketTradeLink
              market={rangeRow}
              side="range"
              className="featured-market-bet featured-market-bet--range"
            >
              <span className="featured-market-bet-label">RANGE</span>
              <span className="featured-market-bet-odds">{rangeMultiplier ?? "—"}</span>
            </MarketTradeLink>
          ) : null}
        </div>

        <FeaturedCommentsFeed oracleId={market.oracleId} />

        <FeaturedLiveChart market={market} strikeUsd={strikeUsd} />
      </div>

      <footer className="featured-market-footer">
        <span className="featured-market-volume">
          {sourceMarket.volume > 0 ? (
            <>
              <AnimatedCompactUsd value={sourceMarket.volume} /> Vol
            </>
          ) : (
            "No bets yet"
          )}
        </span>
        <span className="featured-market-brand">Molfi</span>
      </footer>
    </article>
  );
}

/** Crypto featured cards get a live backend price sparkline; others keep the spot chart. */
function FeaturedLiveChart({ market, strikeUsd }: { market: LeverxMarketRow; strikeUsd: number }) {
  const sym = (market.asset || "").toUpperCase();
  const isCrypto = ["BTC", "ETH", "SOL", "XLM", "DOGE", "AVAX", "LINK"].includes(sym);
  const { data } = useQuery({
    queryKey: ["featured-prices", sym],
    queryFn: () => fetchBackendPrices(sym, 120),
    enabled: isCrypto,
    refetchInterval: 20_000,
  });

  if (isCrypto && data && data.length > 0) {
    return (
      <div className="featured-market-chart overflow-hidden rounded-lg border border-border bg-background">
        <LivePriceChart points={data} height={170} />
      </div>
    );
  }

  return (
    <FeaturedMarketSpotChart
      oracleId={market.oracleId}
      asset={market.asset}
      strikeUsd={strikeUsd}
      oracleRow={{
        oracle_id: market.oracleId,
        status: market.oracleStatus ?? market.status,
        expiry: market.expiry,
        settled_at: null,
      }}
    />
  );
}
