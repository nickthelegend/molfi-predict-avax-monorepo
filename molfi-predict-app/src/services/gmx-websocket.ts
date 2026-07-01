/**
 * Real-time price service using GMX's official REST API
 * Polls GMX's /prices/tickers endpoint for authentic oracle prices
 * Docs: https://docs.gmx.io/docs/api/rest
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getGmxTickers, subscribeToGmxPrices } from './gmx-api';
import type { GmxPosition } from '@/types/molfi-wallet';

// Symbol mapping from our format to GMX format
const SYMBOL_TO_GMX: Record<string, string> = {
  'BTC/USD': 'BTC',
  'ETH/USD': 'ETH',
  'SOL/USD': 'SOL',
};

// Fallback prices when API is unavailable
const FALLBACK_PRICES: Record<string, number> = {
  'BTC/USD': 78591.00,
  'ETH/USD': 3245.50,
  'SOL/USD': 142.75,
};

interface UseRealtimePricesResult {
  prices: Record<string, number>;
  isConnected: boolean;
  lastUpdate: number | null;
}

// Hook for real-time price updates using GMX API
export function useRealtimePrices(symbols: string[] = ['BTC/USD', 'ETH/USD', 'SOL/USD']): UseRealtimePricesResult {
  const [prices, setPrices] = useState<Record<string, number>>(() => ({ ...FALLBACK_PRICES }));
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Fetch initial prices
  const fetchInitialPrices = useCallback(async () => {
    try {
      const tickers = await getGmxTickers();
      const newPrices: Record<string, number> = { ...FALLBACK_PRICES };
      
      for (const [ourSymbol, gmxSymbol] of Object.entries(SYMBOL_TO_GMX)) {
        const ticker = tickers.find(t => t.tokenSymbol === gmxSymbol);
        if (ticker) {
          // GMX prices are in 30 decimals
          const minPrice = parseFloat(ticker.minPrice) / 1e30;
          const maxPrice = parseFloat(ticker.maxPrice) / 1e30;
          newPrices[ourSymbol] = (minPrice + maxPrice) / 2;
        }
      }
      
      setPrices(newPrices);
      setLastUpdate(Date.now());
      setIsConnected(true);
    } catch {
      // Use fallback prices
      setIsConnected(false);
    }
  }, []);

  // Subscribe to real-time updates
  const subscribe = useCallback(() => {
    const gmxSymbols = symbols
      .map(s => SYMBOL_TO_GMX[s])
      .filter(Boolean);
    
    const cleanup = subscribeToGmxPrices(
      gmxSymbols,
      (newPrices) => {
        setPrices(prev => ({ ...prev, ...newPrices }));
        setLastUpdate(Date.now());
        setIsConnected(true);
      },
      undefined, // onError callback (optional)
      3000 // 3 second polling (reduced from 1s to avoid rate limiting)
    );
    
    cleanupRef.current = cleanup;
  }, [symbols]);

  useEffect(() => {
    fetchInitialPrices();
    subscribe();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [fetchInitialPrices, subscribe]);

  return { prices, isConnected, lastUpdate };
}

// Hook to calculate real-time PnL based on live prices
export function useRealtimePnl(positions: GmxPosition[]) {
  const { prices, isConnected } = useRealtimePrices();
  const [pnlData, setPnlData] = useState<{
    positions: GmxPosition[];
    totalPnl: number;
    totalPnlPercent: number;
  }>({
    positions: [],
    totalPnl: 0,
    totalPnlPercent: 0,
  });

  useEffect(() => {
    if (!positions.length) {
      setPnlData({ positions: [], totalPnl: 0, totalPnlPercent: 0 });
      return;
    }

    // Calculate updated PnL for each position
    const updatedPositions = positions.map(pos => {
      const currentPrice = prices[pos.marketSymbol] || pos.currentPrice;
      
      // Recalculate PnL with live price
      const priceDiff = currentPrice - pos.entryPrice;
      const positionMultiplier = pos.side === 'long' ? 1 : -1;
      const unrealizedPnl = (priceDiff / pos.entryPrice) * pos.size * positionMultiplier;
      const unrealizedPnlPercent = pos.collateral > 0 ? (unrealizedPnl / pos.collateral) * 100 : 0;

      return {
        ...pos,
        currentPrice,
        unrealizedPnl,
        unrealizedPnlPercent,
      };
    });

    // Calculate totals
    const totalPnl = updatedPositions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
    const totalCollateral = updatedPositions.reduce((sum, p) => sum + p.collateral, 0);
    const totalPnlPercent = totalCollateral > 0 ? (totalPnl / totalCollateral) * 100 : 0;

    setPnlData({
      positions: updatedPositions,
      totalPnl,
      totalPnlPercent,
    });
  }, [positions, prices]);

  return {
    ...pnlData,
    isConnected,
  };
}

// Hook for subscribing to leaderboard changes via Supabase realtime
export function useLeaderboardWebSocket(
  competitionId: string,
  onUpdate: (data: any) => void
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!competitionId) return;

    // Import dynamically to avoid circular deps
    import('@/integrations/supabase/client').then(({ supabase }) => {
      const channel = supabase
        .channel(`leaderboard-live-${competitionId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'arena_performance',
            filter: `competition_id=eq.${competitionId}`,
          },
          (payload) => {
            onUpdate(payload);
            queryClient.invalidateQueries({ 
              queryKey: ['arena', 'leaderboard', competitionId] 
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [competitionId, onUpdate, queryClient]);
}

// Connection status indicator component data
export function useConnectionStatus() {
  const { isConnected, lastUpdate } = useRealtimePrices();
  
  return {
    isConnected,
    lastUpdate,
    status: isConnected ? 'connected' : 'disconnected',
    label: isConnected ? 'Live' : 'Delayed',
  };
}
