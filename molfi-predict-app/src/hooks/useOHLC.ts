import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import type { OHLCData, TimeFrame } from "@/types/market";

interface UseOHLCResult {
  data: OHLCData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export const useOHLC = (
  marketId: string,
  timeframe: TimeFrame,
  _from?: number,
  _to?: number
): UseOHLCResult => {
  const [data, setData] = useState<OHLCData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOHLC = async () => {
    if (!marketId) return;

    setIsLoading(true);
    setError(null);

    try {
      const ohlcData = await apiService.getOHLC(marketId, timeframe);
      if (Array.isArray(ohlcData) && ohlcData.length > 0) {
        setData(ohlcData as OHLCData[]);
      } else {
        setData([]); // No data available — chart will show empty state
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch OHLC data"));
      console.error("Error fetching OHLC data:", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refresh = async () => {
    await fetchOHLC();
  };

  useEffect(() => {
    fetchOHLC();
  }, [marketId, timeframe]);

  return { data, isLoading, error, refresh };
};
