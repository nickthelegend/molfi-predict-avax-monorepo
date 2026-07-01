import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchOnChainMarkets, onChainMarketToRow } from "@/lib/molfi-backend";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

/**
 * The real on-chain crypto markets — created + settled by the backend keeper on
 * the predict-escrow contract via the live Reflector oracle. These are the
 * markets the Crypto tab shows; betting on them escrows real mUSDC.
 */
export function useOnChainMarkets(status: "open" | "closed" = "open") {
  const query = useQuery({
    queryKey: ["onchain-markets-grid", status],
    queryFn: () => fetchOnChainMarkets(status),
    refetchInterval: 15_000,
    retry: 1,
  });

  const markets = useMemo<LeverxMarketRow[]>(
    () => (query.data ?? []).map(onChainMarketToRow),
    [query.data],
  );

  return { markets, loading: query.isLoading, error: query.isError };
}
