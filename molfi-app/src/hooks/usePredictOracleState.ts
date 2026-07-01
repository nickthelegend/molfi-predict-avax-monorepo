import { useQuery } from "@tanstack/react-query";
import { fetchOracleState } from "@/lib/predict/client";

interface Options {
  refetchInterval?: number | false;
  enabled?: boolean;
}

export function usePredictOracleState(oracleId: string, options?: Options) {
  return useQuery({
    queryKey: ["predict-oracle-state", oracleId],
    queryFn: () => fetchOracleState(oracleId),
    enabled: Boolean(oracleId) && (options?.enabled ?? true),
    staleTime: 60_000,
    retry: 1,
    refetchInterval: options?.refetchInterval,
    refetchIntervalInBackground: false,
  });
}
