import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import {
  DEV_INSPECT_QUOTE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
} from "@/lib/leverx/constants";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { positionKeyFromArgs } from "@/lib/leverx/market-keys";
import { positionRowId } from "@/lib/leverx/position-metrics";
import type { OnChainQuantityRead } from "@/lib/leverx/position-quantity";
import { fetchManagerOpenQuantity } from "@/lib/leverx/quotes";

export type OnChainPositionQuantityRead = {
  quantity: OnChainQuantityRead;
  isLoading: boolean;
};

function positionToMarketKey(position: LeveragedPosition) {
  return {
    oracleId: position.oracle_id,
    expiryMs: position.expiry_ms,
    strike: position.strike,
    higherStrike: position.higher_strike,
    isUp: position.is_up,
    isRange: position.is_range,
  };
}

/** Live Predict manager contract counts keyed by portfolio row id. */
export function useOnChainPositionQuantities(
  positions: readonly LeveragedPosition[],
) {
  const { client } = useWallet();
  const { cfg } = useLeverxProtocolConfig();

  const verifiable = useMemo(
    () => positions.filter((position) => Boolean(position.predict_manager_id)),
    [positions],
  );

  const queries = useQueries({
    queries: verifiable.map((position) => {
      const key = positionToMarketKey(position);
      const marketKey = positionKeyFromArgs(key);
      return {
        queryKey: [
          "manager-open-qty",
          position.predict_manager_id,
          marketKey,
          cfg?.packageId,
          cfg?.predictPackageId,
        ],
        queryFn: () =>
          fetchManagerOpenQuantity({
            client,
            packageId: cfg!.packageId,
            predictPackageId: cfg!.predictPackageId,
            predictManagerId: position.predict_manager_id!,
            key,
          }),
        enabled: Boolean(cfg?.packageId && cfg?.predictPackageId && position.predict_manager_id),
        staleTime: DEV_INSPECT_QUOTE_STALE_MS,
        refetchInterval: DEV_INSPECT_QUOTE_REFETCH_MS,
        refetchIntervalInBackground: false,
        placeholderData: (previous) => previous,
        retry: 1,
      };
    }),
  });

  const querySignature = queries
    .map((query) => `${query.dataUpdatedAt}:${query.isLoading}:${query.fetchStatus}`)
    .join("|");

  const byPositionId = useMemo(() => {
    const map = new Map<string, OnChainPositionQuantityRead>();
    verifiable.forEach((position, index) => {
      const query = queries[index];
      const isInitialLoad = Boolean(query?.isPending);
      map.set(positionRowId(position), {
        quantity: isInitialLoad ? null : (query?.data ?? null),
        isLoading: isInitialLoad,
      });
    });
    return map;
  }, [verifiable, querySignature]);

  const isVerifying = queries.some((query) => query.isPending);

  return { byPositionId, isVerifying };
}
