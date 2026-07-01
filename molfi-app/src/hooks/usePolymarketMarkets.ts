import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPolymarketMarkets } from "@/lib/polymarket/client";
import { polymarketToRow } from "@/lib/polymarket/adapter";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

/** Live Polymarket reference markets for a category, mapped to catalog rows. */
export function usePolymarketMarkets(opts: {
  tagId?: number;
  categoryId: string;
  enabled?: boolean;
  limit?: number;
}) {
  const { tagId, categoryId, enabled = true, limit = 24 } = opts;

  const query = useQuery({
    queryKey: ["polymarket", tagId ?? "all", limit],
    queryFn: ({ signal }) => fetchPolymarketMarkets({ tagId, limit, signal }),
    enabled,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });

  const markets = useMemo<LeverxMarketRow[]>(
    () => (query.data ?? []).map((m) => polymarketToRow(m, categoryId)),
    [query.data, categoryId],
  );

  return { markets, loading: query.isLoading, error: query.isError };
}
