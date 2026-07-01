import { useQuery } from "@tanstack/react-query";
import { appConfig } from "@/lib/config";
import { fetchPredictQuoteAssets } from "@/lib/predict/client";
import { normalizeQuoteAssetList } from "@/lib/predict/quote-assets";

export const PREDICT_QUOTE_ASSETS_QUERY_KEY = [
  "predict-quote-assets",
  appConfig.predictId,
] as const;

export function usePredictQuoteAssets() {
  return useQuery({
    queryKey: PREDICT_QUOTE_ASSETS_QUERY_KEY,
    queryFn: async () => normalizeQuoteAssetList(await fetchPredictQuoteAssets()),
    enabled: appConfig.usePredictServer,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
