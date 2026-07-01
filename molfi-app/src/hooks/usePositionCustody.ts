import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import { DEV_INSPECT_QUOTE_STALE_MS } from "@/lib/leverx/constants";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { positionKeyFromArgs } from "@/lib/leverx/market-keys";
import {
  fetchKeyQuoteBalance,
  fetchManagerQuoteBalance,
} from "@/lib/leverx/quotes";

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

/** On-chain custody for a position: key-locked quote and Predict manager balance. */
export function usePositionCustody(
  position: LeveragedPosition | null | undefined,
  enabled = true,
) {
  const { client } = useWallet();
  const { cfg } = useLeverxProtocolConfig();
  const key = position ? positionToMarketKey(position) : null;
  const marketKey = key ? positionKeyFromArgs(key) : null;

  const keyBalanceQuery = useQuery({
    queryKey: [
      "proxy-key-balance",
      position?.account_id,
      marketKey,
      cfg?.packageId,
      cfg?.predictPackageId,
    ],
    queryFn: () =>
      fetchKeyQuoteBalance({
        client,
        leverxPackageId: cfg!.packageId,
        predictPackageId: cfg!.predictPackageId,
        accountId: position!.account_id,
        key: key!,
      }),
    enabled: Boolean(
      enabled && cfg && position?.account_id && key,
    ),
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    retry: 1,
  });

  const managerBalanceQuery = useQuery({
    queryKey: [
      "manager-quote-balance",
      position?.predict_manager_id,
      cfg?.packageId,
      cfg?.quoteType,
    ],
    queryFn: () =>
      fetchManagerQuoteBalance({
        client,
        packageId: cfg!.packageId,
        quoteType: cfg!.quoteType,
        predictManagerId: position!.predict_manager_id!,
      }),
    enabled: Boolean(
      enabled && cfg && position?.predict_manager_id,
    ),
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    retry: 1,
  });

  const isLoading =
    (keyBalanceQuery.isPending && keyBalanceQuery.fetchStatus !== "idle") ||
    (managerBalanceQuery.isPending && managerBalanceQuery.fetchStatus !== "idle");

  return {
    keyQuoteBalance: keyBalanceQuery.data ?? null,
    managerQuoteBalance: managerBalanceQuery.data ?? null,
    isLoading,
    refetch: () =>
      Promise.all([keyBalanceQuery.refetch(), managerBalanceQuery.refetch()]),
  };
}
