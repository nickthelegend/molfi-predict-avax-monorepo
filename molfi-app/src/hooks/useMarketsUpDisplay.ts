import { useMemo } from "react";
import { useMarketPremiumSparklines } from "@/hooks/useMarketPremiumSparklines";
import { useVisibleMarketAsks } from "@/hooks/useVisibleMarketAsks";
import { useVisibleOracleSpots } from "@/hooks/useVisibleOracleSpots";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { gridUpDisplayRow } from "@/lib/leverx/predict-oracle-markets";

/** UP "above …" catalog rows with live spot and on-chain asks (grid + list). */
export function useMarketsUpDisplay(sourceMarkets: readonly LeverxMarketRow[]) {
  const sourceById = useMemo(
    () => new Map(sourceMarkets.map((market) => [market.id, market])),
    [sourceMarkets],
  );

  const { markets: withSpots } = useVisibleOracleSpots(sourceMarkets);
  const displayRows = useMemo(() => withSpots.map(gridUpDisplayRow), [withSpots]);
  const { markets: displayMarkets, isLoading: premiumLoading } =
    useVisibleMarketAsks(displayRows);
  const { seriesByMarketId } = useMarketPremiumSparklines(displayMarkets);

  return {
    sourceById,
    displayMarkets,
    premiumLoading,
    seriesByMarketId,
  };
}
