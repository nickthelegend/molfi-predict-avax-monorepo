import { useState, useEffect, useCallback, useRef } from "react";
import { molfiApi, type MolfiMarket, type ListMarketsResponse } from "@/services/molfi-api";

interface UseMarketsFeedParams {
  category?: string;
  venue?: string;
  status?: 'active' | 'resolved' | 'expired';
  search?: string;
  limit?: number;
}

interface UseMarketsFeedResult {
  markets: MolfiMarket[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
}

/**
 * Hook for fetching markets with server-side filtering and offset-based pagination.
 * Passes category, venue, and search to the API so filtering happens server-side.
 */
export function useMarketsFeed(params: UseMarketsFeedParams): UseMarketsFeedResult {
  const [markets, setMarkets] = useState<MolfiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  // nextOffset tracks the offset for the NEXT fetch
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = params.limit || 40;

  // Stable ref for current params to avoid stale closures
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Track current fetch to prevent race conditions
  const fetchIdRef = useRef(0);

  const fetchMarkets = useCallback(async (fetchOffset: number, append: boolean) => {
    const fetchId = ++fetchIdRef.current;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const p = paramsRef.current;

      // Map category/venue for API compatibility
      const apiVenue = p.venue && p.venue !== 'all' && p.venue !== 'MOLFI_NATIVE'
        ? p.venue.toLowerCase() as 'limitless' | 'polymarket' | 'molfi'
        : p.venue === 'MOLFI_NATIVE' ? 'molfi' as const : undefined;

      const apiCategory = p.category && p.category !== 'all' && p.category !== 'for_you'
        ? p.category
        : undefined;

      const apiParams: Record<string, any> = {
        venue: apiVenue,
        category: apiCategory,
        status: p.status || 'active',
        limit,
        offset: fetchOffset,
      };

      // Pass search query to the API if available
      if (p.search && p.search.trim()) {
        apiParams.q = p.search.trim();
      }

      const response: ListMarketsResponse = await molfiApi.listAggregatedMarkets(apiParams);

      // Guard against stale responses
      if (fetchId !== fetchIdRef.current) return;

      const fetchedMarkets = response.markets || [];
      const batchSize = fetchedMarkets.length;
      const serverTotal = response.total || 0;

      if (append) {
        setMarkets(prev => {
          // Deduplicate by market ID
          const existingIds = new Set(prev.map(m => m.id));
          const newOnly = fetchedMarkets.filter(m => !existingIds.has(m.id));
          if (newOnly.length > 0) {
            return [...prev, ...newOnly];
          }
          return prev;
        });
      } else {
        setMarkets(fetchedMarkets);
      }

      // Set the next offset for subsequent fetches
      const newNextOffset = fetchOffset + batchSize;
      setNextOffset(newNextOffset);
      setTotal(serverTotal);

      // Determine hasMore: check if we got a full batch AND haven't exceeded total
      const noMoreByBatch = batchSize < limit;
      const noMoreByTotal = serverTotal > 0 && newNextOffset >= serverTotal;
      setHasMore(!noMoreByBatch && !noMoreByTotal);
    } catch (err: any) {
      if (fetchId !== fetchIdRef.current) return;
      setError(err.message || "Failed to fetch markets");
      console.error("Failed to fetch markets:", err);
    } finally {
      if (fetchId !== fetchIdRef.current) return;
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [limit]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchMarkets(nextOffset, true);
    }
  }, [hasMore, isLoadingMore, isLoading, nextOffset, fetchMarkets]);

  const refresh = useCallback(() => {
    setNextOffset(0);
    setHasMore(true);
    setMarkets([]);
    fetchMarkets(0, false);
  }, [fetchMarkets]);

  // Re-fetch when filter params change — reset pagination state
  const filterKey = `${params.category}|${params.venue}|${params.status}|${params.search}`;
  useEffect(() => {
    setNextOffset(0);
    setHasMore(true);
    setTotal(0);
    setMarkets([]);
    fetchMarkets(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  return {
    markets,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}
