import { useState, useCallback, useRef } from "react";
import { molfiApi, type MolfiMarket, type ListMarketsResponse } from "@/services/molfi-api";

interface UseMolfiSearchParams {
  status?: 'active' | 'resolved' | 'expired';
  venue?: 'limitless' | 'polymarket' | 'molfi';
  category?: string;
  limit?: number;
}

interface UseMolfiSearchResult {
  results: MolfiMarket[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

/**
 * Search hook that uses the aggregated markets endpoint with client-side title filtering.
 * The v2 API doesn't have a dedicated search endpoint, so we fetch and filter.
 */
export const useMolfiSearch = (params?: UseMolfiSearchParams): UseMolfiSearchResult => {
  const [results, setResults] = useState<MolfiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentParams = paramsRef.current;
      // Fetch a larger set and filter client-side by title/description
      const response: ListMarketsResponse = await molfiApi.listAggregatedMarkets({
        venue: currentParams?.venue,
        category: currentParams?.category,
        status: currentParams?.status,
        limit: 200,
        offset: 0,
      });

      const q = query.toLowerCase();
      const filtered = response.markets.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
      );

      const limited = currentParams?.limit ? filtered.slice(0, currentParams.limit) : filtered;
      setResults(limited);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Search failed"));
      console.error("Error searching markets:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, clear };
};
