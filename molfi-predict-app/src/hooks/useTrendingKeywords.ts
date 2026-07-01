import { useState, useEffect, useCallback } from "react";

// Trending keywords are no longer part of the v2 API.
// This hook provides a stub that returns empty data gracefully.

export interface TrendingKeyword {
  keyword: string;
  score: number;
  marketCount: number;
  totalVolume: number;
  totalComments: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  category: string;
  relatedKeywords: string[];
  markets: { id: string; title: string; volume: number; commentCount: number }[];
}

interface UseTrendingKeywordsResult {
  keywords: TrendingKeyword[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useTrendingKeywords = (_limit: number = 10): UseTrendingKeywordsResult => {
  const [keywords] = useState<TrendingKeyword[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    // No-op: trending keywords endpoint removed in v2
    console.info("Trending keywords not available in API v2");
  }, []);

  return { keywords, isLoading, error, refresh };
};
