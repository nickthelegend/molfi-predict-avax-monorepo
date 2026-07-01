import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import {
  fetchManagerPositionsSummary,
  fetchManagerSummary,
} from "@/lib/predict/client";
import { fetchPredictManagerForOwner } from "@/lib/predict/manager";

export function usePredictManagerPortfolio(owner: string | null) {
  const managerQuery = useQuery({
    queryKey: ["predict-manager-id", owner],
    queryFn: () => fetchPredictManagerForOwner(owner!),
    enabled: appConfig.usePredictServer && Boolean(owner),
    staleTime: 120_000,
    retry: 1,
  });

  const managerId = managerQuery.data ?? null;

  const summaryQuery = useQuery({
    queryKey: ["predict-manager-summary", managerId],
    queryFn: () => fetchManagerSummary(managerId!),
    enabled: Boolean(managerId),
    staleTime: 30_000,
    retry: 1,
  });

  const positionsQuery = useQuery({
    queryKey: ["predict-manager-positions", managerId],
    queryFn: () => fetchManagerPositionsSummary(managerId!),
    enabled: Boolean(managerId),
    staleTime: 30_000,
    retry: 1,
  });

  return {
    managerId,
    isLoading: managerQuery.isLoading || summaryQuery.isLoading,
    summary: summaryQuery.data,
    positions: positionsQuery.data ?? [],
    hasManager: Boolean(managerId),
  };
}
