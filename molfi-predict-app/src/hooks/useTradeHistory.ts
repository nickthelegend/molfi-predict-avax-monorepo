import { useState, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { apiService } from "@/services/api";
import type { Trade } from "@/types/market";
import type { WebSocketEvent } from "@/services/websocket";

interface UseTradeHistoryResult {
  trades: Trade[];
  isLoading: boolean;
  error: Error | null;
}

export const useTradeHistory = (marketId: string, limit: number = 50): UseTradeHistoryResult => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { service } = useWebSocket();

  useEffect(() => {
    if (!marketId) return;

    const fetchInitialTrades = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getTradeHistory(marketId, limit);
        setTrades(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch trade history"));
        console.error("Error fetching trade history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialTrades();

    const handler = (event: WebSocketEvent) => {
      if (event.type === "trade") {
        const trade = event.data as Trade;
        if (trade.marketId === marketId) {
          setTrades((prev) => [trade, ...prev].slice(0, limit));
        }
      }
    };

    service.on('trades', handler);
    return () => { service.off('trades', handler); };
  }, [marketId, limit, service]);

  return { trades, isLoading, error };
};
