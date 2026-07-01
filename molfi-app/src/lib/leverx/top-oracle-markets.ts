import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { sortMarketRows } from "@/lib/leverx/market-sort";

export const TOP_ORACLE_MARKET_COUNT = 4;

/** One representative row per oracle — highest volume live markets first. */
export function pickTopOracleMarkets(
  markets: readonly LeverxMarketRow[],
  limit = TOP_ORACLE_MARKET_COUNT,
): LeverxMarketRow[] {
  const sorted = sortMarketRows(markets, "volume-desc");
  const seen = new Set<string>();
  const result: LeverxMarketRow[] = [];

  for (const market of sorted) {
    if (seen.has(market.oracleId)) continue;
    seen.add(market.oracleId);
    result.push(market);
    if (result.length >= limit) break;
  }

  return result;
}
