import { downsampleSeries } from "@/lib/charts/sparkline-path";
import type { GlobalMarketTrade } from "@/lib/leverx/indexer-client";
import { premiumToCents, tradePremiumRaw, type LeverxMarketRow } from "@/lib/leverx/indexer-markets";

function tradePremiumCents(trade: GlobalMarketTrade): number | null {
  const raw = tradePremiumRaw(trade);
  if (raw == null || raw <= 0) return null;
  return premiumToCents(raw);
}

/** Recent contract premium (¢) for one catalog market from global mint/redeem trades. */
export function buildPremiumSparklineSeries(
  trades: readonly GlobalMarketTrade[],
  marketKey: string,
  fallbackPremium?: number | null,
  maxPoints = 32,
): number[] {
  const values = trades
    .filter((trade) => trade.market_key === marketKey)
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms)
    .map(tradePremiumCents)
    .filter((value): value is number => value != null);

  const series = downsampleSeries(values, maxPoints);
  if (series.length >= 2) return series;

  if (fallbackPremium != null && fallbackPremium > 0) {
    const cents = premiumToCents(fallbackPremium);
    return [cents, cents];
  }

  return series;
}

export function buildPremiumSparklineMap(
  markets: readonly LeverxMarketRow[],
  tradesByOracle: ReadonlyMap<string, readonly GlobalMarketTrade[]>,
): Map<string, number[]> {
  const map = new Map<string, number[]>();
  for (const market of markets) {
    map.set(
      market.id,
      buildPremiumSparklineSeries(
        tradesByOracle.get(market.oracleId) ?? [],
        market.id,
        market.lastAskPremium,
      ),
    );
  }
  return map;
}
