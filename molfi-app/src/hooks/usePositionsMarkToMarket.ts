import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useIndexerProtocol } from "@/hooks/useIndexer";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import {
  DEV_INSPECT_QUOTE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
} from "@/lib/leverx/constants";
import { resolveLiquidationBps } from "@/lib/leverx/protocol";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { positionKeyFromArgs } from "@/lib/leverx/market-keys";
import {
  computePositionMarkToMarket,
  isActiveOpenPosition,
  positionRowId,
  type PositionMarkToMarket,
} from "@/lib/leverx/position-metrics";
import { fetchPositionLedgerHealthInputs, fetchRedeemQuote } from "@/lib/leverx/quotes";
import { coerceQuoteAtoms } from "@/lib/predict/scaling";

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

export function usePositionsMarkToMarket(positions: readonly LeveragedPosition[]) {
  const { client } = useWallet();
  const { cfg } = useLeverxProtocolConfig();
  const { data: protocol } = useIndexerProtocol();
  const liquidationBps = resolveLiquidationBps(protocol);

  const openPositions = useMemo(
    () => positions.filter(isActiveOpenPosition),
    [positions],
  );

  const quoteQueries = useQueries({
    queries: openPositions.map((position) => ({
      queryKey: [
        "position-redeem-quote",
        position.position_key,
        position.open_quantity,
        cfg?.packageId,
      ],
      queryFn: async () => {
        if (!cfg) return null;
        return fetchRedeemQuote({
          client,
          cfg,
          key: positionToMarketKey(position),
          quantity: BigInt(coerceQuoteAtoms(position.open_quantity)),
        });
      },
      enabled: Boolean(cfg?.registryId && coerceQuoteAtoms(position.open_quantity) > 0),
      staleTime: DEV_INSPECT_QUOTE_STALE_MS,
      refetchInterval: DEV_INSPECT_QUOTE_REFETCH_MS,
      refetchIntervalInBackground: false,
      placeholderData: (previous) => previous,
      retry: 1,
    })),
  });

  const ledgerQueries = useQueries({
    queries: openPositions.map((position) => ({
      queryKey: [
        "position-ledger-health",
        position.position_key,
        position.account_id,
        cfg?.packageId,
        cfg?.predictPackageId,
      ],
      queryFn: async () => {
        if (!cfg) return null;
        return fetchPositionLedgerHealthInputs({
          client,
          leverxPackageId: cfg.packageId,
          predictPackageId: cfg.predictPackageId,
          accountId: position.account_id,
          key: positionToMarketKey(position),
        });
      },
      enabled: Boolean(
        cfg?.packageId &&
          cfg?.predictPackageId &&
          position.account_id &&
          coerceQuoteAtoms(position.open_quantity) > 0,
      ),
      staleTime: DEV_INSPECT_QUOTE_STALE_MS,
      refetchInterval: DEV_INSPECT_QUOTE_REFETCH_MS,
      refetchIntervalInBackground: false,
      placeholderData: (previous) => previous,
      retry: 1,
    })),
  });

  const quoteSignature = quoteQueries
    .map((q) => `${q.dataUpdatedAt}:${q.isLoading}:${q.fetchStatus}`)
    .join("|");

  const ledgerSignature = ledgerQueries
    .map((q) => `${q.dataUpdatedAt}:${q.isLoading}:${q.fetchStatus}`)
    .join("|");

  const quoteSnapshot = useMemo(
    () =>
      openPositions.map((position, index) => ({
        positionKey: position.position_key,
        data: quoteQueries[index]?.data ?? null,
        isLoading: quoteQueries[index]?.isPending ?? false,
      })),
    [openPositions, quoteSignature],
  );

  const ledgerSnapshot = useMemo(
    () =>
      openPositions.map((position, index) => ({
        positionKey: position.position_key,
        data: ledgerQueries[index]?.data ?? null,
        isLoading: ledgerQueries[index]?.isPending ?? false,
      })),
    [openPositions, ledgerSignature],
  );

  const byPositionId = useMemo(() => {
    const map = new Map<string, PositionMarkToMarket>();
    openPositions.forEach((position, index) => {
      const snapshot = quoteSnapshot[index];
      const ledgerRow = ledgerSnapshot[index];
      const ledgerQuery = ledgerQueries[index];
      const ledgerReady = Boolean(ledgerQuery?.isSuccess && ledgerRow?.data != null);
      map.set(
        positionRowId(position),
        computePositionMarkToMarket(
          position,
          snapshot?.data ?? null,
          Boolean(snapshot?.isLoading || ledgerRow?.isLoading),
          liquidationBps,
          ledgerRow?.data ?? null,
          ledgerReady,
        ),
      );
    });
    return map;
  }, [openPositions, quoteSnapshot, ledgerSnapshot, ledgerQueries, liquidationBps]);

  const isRefreshing =
    quoteQueries.some((q) => q.isFetching && q.isPending) ||
    ledgerQueries.some((q) => q.isFetching && q.isPending);

  return { byPositionId, isRefreshing };
}

export function positionMarketKeyLabel(position: LeveragedPosition): string {
  return positionKeyFromArgs(positionToMarketKey(position));
}
