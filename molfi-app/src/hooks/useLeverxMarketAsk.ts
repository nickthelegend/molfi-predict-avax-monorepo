import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { appConfig } from "@/lib/config";
import type { MarketKeyArgs } from "@/lib/leverx/market-keys";
import {
  DEV_INSPECT_QUOTE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
  DEV_INSPECT_HOT_POLL_INTERVAL_MS,
} from "@/lib/leverx/constants";
import { fetchPredictMarketAsk } from "@/lib/leverx/quotes";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";

function quoteCfg(
  packageId: string | undefined,
  predictId?: string,
  predictPackageId?: string,
) {
  if (!packageId) return null;
  return {
    packageId,
    predictId: predictId ?? appConfig.predictId,
    predictPackageId: predictPackageId ?? appConfig.predictPackageId,
  };
}

export function leverxMarketAskQueryKey(key: MarketKeyArgs) {
  return [
    "leverx-market-ask",
    key.oracleId,
    key.expiryMs,
    key.strike,
    key.higherStrike,
    key.isUp,
    key.isRange,
  ] as const;
}

/** Live per-contract ask for a market (no margin / account required). */
export function useLeverxMarketAsk(key?: MarketKeyArgs) {
  const { client } = useWallet();
  const { cfg: fullCfg } = useLeverxProtocolConfig();
  const cfg = useMemo(
    () =>
      fullCfg
        ? quoteCfg(fullCfg.packageId, fullCfg.predictId, fullCfg.predictPackageId)
        : null,
    [fullCfg],
  );

  return useQuery({
    queryKey: key ? leverxMarketAskQueryKey(key) : ["leverx-market-ask", "idle"],
    queryFn: async () => {
      if (!cfg || !key) return null;
      return fetchPredictMarketAsk({ client, cfg, key });
    },
    enabled: Boolean(cfg && key),
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    refetchInterval: (query) => {
      if (!cfg || !key) return false;
      if (query.state.data != null && query.state.data > 0n) {
        return DEV_INSPECT_QUOTE_REFETCH_MS;
      }
      return DEV_INSPECT_HOT_POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}
