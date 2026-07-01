import { useState, useEffect, useCallback } from "react";
import { apiService } from "@/services/api";
import type { Market, MarketFilters, MarketSort, PaginationCursor } from "@/types/market";

interface UseMarketsResult {
  markets: Market[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  total?: number;
}

export const useMarkets = (
  filters?: MarketFilters,
  sort?: MarketSort,
  initialLimit: number = 20
): UseMarketsResult => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState<number | undefined>();
  const [offset, setOffset] = useState(0);

  const fetchMarkets = useCallback(
    async (currentOffset: number = 0, append: boolean = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.getMarkets(filters, sort, {
          limit: initialLimit,
          cursor: undefined,
        });

        // The response is a ListMarketsResponse from v2
        const responseData = response as any;
        const fetchedMarkets = (responseData.markets || []) as Market[];

        if (append) {
          setMarkets((prev) => [...prev, ...fetchedMarkets]);
        } else {
          setMarkets(fetchedMarkets);
        }

        setTotal(responseData.total);
        setHasMore(currentOffset + initialLimit < (responseData.total || 0));
        setOffset(currentOffset);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch markets"));
        console.error("Error fetching markets:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, sort, initialLimit]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchMarkets(offset + initialLimit, true);
  }, [hasMore, isLoading, offset, initialLimit, fetchMarkets]);

  const refresh = useCallback(async () => {
    await fetchMarkets(0, false);
  }, [fetchMarkets]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    markets,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  };
};
