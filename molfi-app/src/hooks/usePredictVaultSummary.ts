import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import { fetchVaultSummary } from "@/lib/predict/client";

export const PREDICT_VAULT_QUERY_KEY = ["predict-vault-summary", appConfig.predictId] as const;

export function usePredictVaultSummary() {
  return useQuery({
    queryKey: PREDICT_VAULT_QUERY_KEY,
    queryFn: fetchVaultSummary,
    enabled: appConfig.usePredictServer,
    staleTime: 60_000,
    retry: 1,
  });
}
