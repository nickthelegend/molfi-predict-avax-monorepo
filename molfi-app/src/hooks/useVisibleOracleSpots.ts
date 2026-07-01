import { useMemo } from "react";
import { useOracleSpotMap } from "@/hooks/useOracleSpotMap";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

export function uniqueOracleIds(markets: readonly LeverxMarketRow[]): string[] {
  return [...new Set(markets.map((m) => m.oracleId).filter(Boolean))];
}

export function withOracleSpots(
  markets: readonly LeverxMarketRow[],
  spotByOracle?: ReadonlyMap<string, number>,
): LeverxMarketRow[] {
  if (!spotByOracle?.size) return [...markets];
  return markets.map((m) => {
    const spot = spotByOracle.get(m.oracleId);
    if (spot == null) return m;
    return {
      ...m,
      spotPrice: spot,
    };
  });
}

/** Fetch predict `/oracles/:id/prices/latest` only for oracles on the current markets page. */
export function useVisibleOracleSpots(markets: readonly LeverxMarketRow[]) {
  const oracleIds = useMemo(() => uniqueOracleIds(markets), [markets]);
  const { data: spotMap, isLoading, isFetching } = useOracleSpotMap(oracleIds);

  const enrichedMarkets = useMemo(
    () => withOracleSpots(markets, spotMap),
    [markets, spotMap],
  );

  return {
    markets: enrichedMarkets,
    isLoading: oracleIds.length > 0 && isLoading && !spotMap,
    isFetching,
  };
}
