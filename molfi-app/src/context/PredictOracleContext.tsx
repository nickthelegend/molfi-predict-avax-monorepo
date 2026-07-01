import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import {
  getPredictOracleRows,
  predictOraclesQueryKey,
} from "@/lib/predict/oracle-cache";
import {
  resolveOracleNeighbors,
  type OracleNeighborOptions,
} from "@/lib/predict/oracle-navigation";
import { sortOracleRows } from "@/lib/predict/other-oracles";
import type { PredictOracleSummary } from "@/lib/predict/types";

type PredictOracleContextValue = {
  oracles: PredictOracleSummary[];
  data: PredictOracleSummary[];
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetched: boolean;
  error: Error | null;
  refetch: () => void;
  getNeighbors: (
    oracleId: string,
    options?: OracleNeighborOptions,
  ) => ReturnType<typeof resolveOracleNeighbors>;
};

const PredictOracleContext = createContext<PredictOracleContextValue | null>(null);

export function PredictOracleProvider({ children }: { children: ReactNode }) {
  // Oracle catalog UI always follows configured DeepBook Predict id (matches predict-server API).
  const predictId = appConfig.predictId;

  const query = useQuery({
    queryKey: predictOraclesQueryKey(predictId),
    queryFn: () => getPredictOracleRows(predictId),
    staleTime: 300_000,
    retry: 2,
  });

  const oracles = useMemo(() => sortOracleRows(query.data ?? []), [query.data]);

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  const getNeighbors = useCallback(
    (oracleId: string, options?: OracleNeighborOptions) =>
      resolveOracleNeighbors(oracles, oracleId, options),
    [oracles],
  );

  const value = useMemo(
    (): PredictOracleContextValue => ({
      oracles,
      data: oracles,
      isLoading: query.isLoading,
      isPending: query.isPending,
      isError: query.isError,
      isSuccess: query.isSuccess,
      isFetched: query.isFetched,
      error: query.error,
      refetch,
      getNeighbors,
    }),
    [
      oracles,
      query.isLoading,
      query.isPending,
      query.isError,
      query.isSuccess,
      query.isFetched,
      query.error,
      refetch,
      getNeighbors,
    ],
  );

  return (
    <PredictOracleContext.Provider value={value}>
      {children}
    </PredictOracleContext.Provider>
  );
}

export function usePredictOracles() {
  const ctx = useContext(PredictOracleContext);
  if (!ctx) {
    throw new Error("usePredictOracles must be used within PredictOracleProvider");
  }
  return ctx;
}
