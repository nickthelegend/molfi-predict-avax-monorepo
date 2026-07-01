import { usePredictOracles as usePredictOracleContext } from "@/context/PredictOracleContext";
import type { OracleNeighborOptions } from "@/lib/predict/oracle-navigation";

/** Predict-server oracle catalog — loaded once via PredictOracleProvider. */
export function usePredictOracleRows() {
  const ctx = usePredictOracleContext();
  return {
    data: ctx.oracles,
    isLoading: ctx.isLoading,
    isError: ctx.isError,
    isFetched: ctx.isFetched,
    error: ctx.error,
    refetch: ctx.refetch,
  };
}

export function useOracleNeighbors(oracleId: string, options?: OracleNeighborOptions) {
  const ctx = usePredictOracleContext();
  return ctx.getNeighbors(oracleId, options);
}
