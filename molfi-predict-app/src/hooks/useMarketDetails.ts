import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { Market, MarketStats } from "@/types/market";

interface UseMarketDetailsResult {
  market: Market | null;
  stats: MarketStats | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useMarketDetails = (marketId: string): UseMarketDetailsResult => {
  const [market, setMarket] = useState<Market | null>(null);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarketDetails = async () => {
    if (!marketId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [marketData, statsData] = await Promise.all([
        apiService.getMarketById(marketId),
        apiService.getMarketStats(marketId),
      ]);

      setMarket(marketData as unknown as Market | null);
      setStats(statsData as unknown as MarketStats | null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch market details"));
      console.error("Error fetching market details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchMarketDetails();
  };

  useEffect(() => {
    fetchMarketDetails();
  }, [marketId]);

  return { market, stats, isLoading, error, refresh };
};
