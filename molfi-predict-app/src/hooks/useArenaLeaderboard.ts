import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/db';

export interface LeaderboardEntry {
  id: string;
  registration_id: string;
  wallet_address: string;
  masked_address: string;
  starting_capital: number;
  current_balance: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  roi_percent: number;
  open_positions_count: number;
  trade_count: number;
  status: string;
  rank: number;
  last_trade_at: string | null;
  updated_at: string;
}

export interface UseArenaLeaderboardOptions {
  competitionId: string;
  limit?: number;
}

export function useArenaLeaderboard(options: UseArenaLeaderboardOptions | null) {
  const competitionId = options?.competitionId ?? '';
  const limit = options?.limit ?? 50;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mask wallet address for display
  const maskAddress = (address: string): string => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Fetch initial leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    if (!competitionId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Fetch performance data with registration status
      const { data: perfData, error: perfError } = await supabase
        .from('arena_performance')
        .select(`
          *,
          arena_registrations!inner(status)
        `)
        .eq('competition_id', competitionId)
        .order('roi_percent', { ascending: false })
        .limit(limit);

      if (perfError) throw perfError;

      // Map and rank entries
      const ranked = (perfData || []).map((entry: any, index: number) => ({
        id: entry.id,
        registration_id: entry.registration_id,
        wallet_address: entry.wallet_address,
        masked_address: maskAddress(entry.wallet_address),
        starting_capital: parseFloat(entry.starting_capital),
        current_balance: parseFloat(entry.current_balance),
        realized_pnl: parseFloat(entry.realized_pnl),
        unrealized_pnl: parseFloat(entry.unrealized_pnl),
        total_pnl: parseFloat(entry.total_pnl),
        roi_percent: parseFloat(entry.roi_percent),
        open_positions_count: entry.open_positions_count,
        trade_count: entry.trade_count,
        status: entry.arena_registrations?.status || 'ACTIVE',
        rank: index + 1,
        last_trade_at: entry.last_trade_at,
        updated_at: entry.updated_at,
      }));

      setEntries(ranked);
      setError(null);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [competitionId, limit]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchLeaderboard();

    // Subscribe to performance changes
    const channel = supabase
      .channel(`arena-leaderboard-${competitionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'arena_performance',
          filter: `competition_id=eq.${competitionId}`,
        },
        (payload) => {
          console.log('Leaderboard update:', payload);
          // Refetch to get updated rankings
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [competitionId, fetchLeaderboard]);

  return { entries, loading, error, refetch: fetchLeaderboard };
}
