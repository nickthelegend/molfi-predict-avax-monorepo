import { useState, useEffect } from "react";
import { molfiApi, type MolfiMarket } from "@/services/molfi-api";

export function useLocalMarkets() {
  const [markets, setMarkets] = useState<MolfiMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const res = await molfiApi.listAggregatedMarkets({ limit: 100 });
        setMarkets(res.markets || []);
      } catch (err: any) {
        setError(err.message);
        console.error("Failed to fetch markets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarkets();
  }, []);

  return { markets, loading, error };
}
