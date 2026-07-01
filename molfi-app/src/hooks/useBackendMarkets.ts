import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBackendMarkets, backendMarketToRow } from "@/lib/molfi-backend";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

/** Auto-rolling 15/30-minute crypto markets from the Molfi backend (MongoDB). */
export function useBackendMarkets(status: "open" | "closed" = "open") {
  const query = useQuery({
    queryKey: ["molfi-backend-markets", status],
    queryFn: () => fetchBackendMarkets(status),
    refetchInterval: 15_000,
    retry: 1,
  });

  const markets = useMemo<LeverxMarketRow[]>(
    () => (query.data ?? []).map(backendMarketToRow),
    [query.data],
  );

  return { markets, loading: query.isLoading, error: query.isError };
}
