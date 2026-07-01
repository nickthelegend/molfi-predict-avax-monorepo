import { useState, useEffect } from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { apiService } from "@/services/api";
import type { Position, Transaction, PortfolioSummary, UserAnalytics } from "@/types/portfolio";
import type { WebSocketEvent } from "@/services/websocket";

interface UsePortfolioResult {
  positions: Position[];
  transactions: Transaction[];
  summary: PortfolioSummary | null;
  analytics: UserAnalytics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const usePortfolio = (userAddress?: string): UsePortfolioResult => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { service } = useWebSocket();

  const fetchPortfolio = async () => {
    if (!userAddress) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [positionsData, transactionsData, summaryData, analyticsData] = await Promise.all([
        apiService.getPositions(userAddress),
        apiService.getTransactions(userAddress),
        apiService.getPortfolioSummary(userAddress),
        apiService.getUserAnalytics(userAddress),
      ]);

      setPositions(positionsData as unknown as Position[]);
      setTransactions(transactionsData as unknown as Transaction[]);
      setSummary(summaryData as unknown as PortfolioSummary);
      setAnalytics(analyticsData as unknown as UserAnalytics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch portfolio"));
      console.error("Error fetching portfolio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchPortfolio();
  };

  useEffect(() => {
    fetchPortfolio();

    if (!userAddress) return;

    const handler = (event: WebSocketEvent) => {
      if (event.type === "position_update") {
        const update = event as any;
        if (update.userAddress === userAddress) {
          fetchPortfolio();
        }
      }
    };

    service.on('positions', handler);
    return () => { service.off('positions', handler); };
  }, [userAddress, service]);

  return { positions, transactions, summary, analytics, isLoading, error, refresh };
};
