import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import { fetchVaultPerformance } from "@/lib/predict/client";

export function usePredictVaultPerformance(range = "ALL") {
  return useQuery({
    queryKey: ["predict-vault-performance", appConfig.predictId, range],
    queryFn: () => fetchVaultPerformance(range),
    enabled: appConfig.usePredictServer,
    staleTime: 120_000,
    retry: 1,
  });
}
