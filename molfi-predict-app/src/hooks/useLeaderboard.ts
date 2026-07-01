import { useState, useEffect, useCallback } from 'react';
import { molfiApi, type LeaderboardEntry } from '@/services/molfi-api';

interface UseLeaderboardParams {
  sortBy?: 'pnl' | 'roi' | 'winRate';
  limit?: number;
  autoLoad?: boolean;
}

interface UseLeaderboardResult {
  traders: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard(params?: UseLeaderboardParams): UseLeaderboardResult {
  const [traders, setTraders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const sortBy = params?.sortBy ?? 'pnl';
  const limit = params?.limit ?? 50;
  const autoLoad = params?.autoLoad !== false;

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await molfiApi.getLeaderboard({ sortBy, limit });
      if (response.success) {
        setTraders(response.leaderboard);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leaderboard'));
      console.error('Error fetching leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, limit]);

  useEffect(() => {
    if (autoLoad) {
      fetchLeaderboard();
    }
  }, [autoLoad, fetchLeaderboard]);

  return { traders, isLoading, error, refresh: fetchLeaderboard };
}
