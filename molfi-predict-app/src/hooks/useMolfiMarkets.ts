import { useState, useEffect, useCallback, useRef } from "react";
import { molfiApi, type MolfiMarket, type ListMarketsResponse } from "@/services/molfi-api";

interface UseMolfiMarketsParams {
  venue?: 'limitless' | 'polymarket' | 'molfi';
  category?: string;
  status?: 'active' | 'resolved' | 'expired';
  limit?: number;
  offset?: number;
  autoLoad?: boolean;
}

interface UseMolfiMarketsResult {
  markets: MolfiMarket[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    total: number;
    hasMore: boolean;
    offset: number;
  };
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useMolfiMarkets = (params?: UseMolfiMarketsParams): UseMolfiMarketsResult => {
  const [markets, setMarkets] = useState<MolfiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const limit = params?.limit || 50;
  const autoLoad = params?.autoLoad !== false;

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetchMarkets = useCallback(async (currentOffset: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const p = paramsRef.current;
      // Use aggregated endpoint (multi-venue) by default; filter by venue if specified
      const response: ListMarketsResponse = await molfiApi.listAggregatedMarkets({
        venue: p?.venue,
        category: p?.category,
        status: p?.status,
        limit,
        offset: currentOffset,
      });

      if (append) {
        setMarkets(prev => [...prev, ...response.markets]);
      } else {
        setMarkets(response.markets);
      }

      setTotal(response.total);
      setOffset(currentOffset);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch markets"));
      console.error("Error fetching Molfi markets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const hasMore = offset + limit < total;

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchMarkets(offset + limit, true);
    }
  }, [hasMore, isLoading, offset, limit, fetchMarkets]);

  const refresh = useCallback(async () => {
    await fetchMarkets(0, false);
  }, [fetchMarkets]);

  useEffect(() => {
    if (autoLoad) {
      fetchMarkets(0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, params?.venue, params?.category, params?.status]);

  return {
    markets,
    isLoading,
    error,
    pagination: { total, hasMore, offset },
    loadMore,
    refresh,
  };
};
