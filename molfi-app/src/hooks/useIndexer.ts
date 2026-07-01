import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIndexerChannelSubscription, useIndexerStream } from "@/context/AppStreamContext";
import { appConfig } from "@/lib/config";
import { indexerKeys } from "@/lib/leverx/indexer-query-keys";
import {
  globalTradesChannel,
  limitOrdersChannel,
  orderbookChannel,
  positionsChannel,
} from "@/lib/leverx/indexer-channels";
import {
  fetchAccount,
  fetchAccounts,
  fetchExecutors,
  fetchGlobalMarketTrades,
  fetchHealth,
  fetchLimitOrders,
  fetchLiquidations,
  fetchMarketCatalog,
  fetchOrderBook,
  fetchPointsLeaderboard,
  fetchPositions,
  fetchProtocolSettings,
  fetchTriggers,
  fetchVaultHistory,
  fetchVaultSummary,
} from "@/lib/leverx/indexer-client";
import { fetchKeeperHealth } from "@/lib/leverx/keeper-client";

export { indexerKeys } from "@/lib/leverx/indexer-query-keys";

const enabled = Boolean(appConfig.leverxIndexerUrl);

/** Indexer market catalog poll interval on the markets list. */
export const MARKET_CATALOG_REFETCH_MS = 12_000;

export function useIndexerHealth() {
  return useQuery({
    queryKey: indexerKeys.health,
    queryFn: fetchHealth,
    enabled,
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useKeeperHealth() {
  return useQuery({
    queryKey: ["keeper-health"] as const,
    queryFn: fetchKeeperHealth,
    enabled: Boolean(appConfig.keeperApiUrl),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useIndexerProtocol() {
  return useQuery({
    queryKey: indexerKeys.protocol,
    queryFn: fetchProtocolSettings,
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMarketCatalog(args?: {
  oracleId?: string;
  isRange?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: indexerKeys.catalog(args?.oracleId, args?.isRange),
    queryFn: async () => {
      const { items } = await fetchMarketCatalog({
        oracleId: args?.oracleId,
        isRange: args?.isRange,
        limit: args?.limit ?? 500,
        offset: 0,
      });
      return items;
    },
    enabled,
    staleTime: MARKET_CATALOG_REFETCH_MS / 2,
    refetchInterval: MARKET_CATALOG_REFETCH_MS,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function useIndexerOrderBook(args: {
  oracleId: string;
  expiryMs: number;
  strike: number;
  higherStrike?: number;
  isUp?: boolean;
  isRange?: boolean;
  enabled?: boolean;
}) {
  const higherStrike = args.higherStrike ?? 0;
  const isUp = args.isUp ?? true;
  const isRange = args.isRange ?? false;
  const { isLive } = useIndexerStream();
  const queryEnabled =
    enabled && (args.enabled ?? true) && args.expiryMs > 0 && args.strike > 0;
  const channel = useMemo(
    () =>
      orderbookChannel({
        oracleId: args.oracleId,
        expiryMs: args.expiryMs,
        strike: args.strike,
        higherStrike,
        isUp,
        isRange,
      }),
    [args.oracleId, args.expiryMs, args.strike, higherStrike, isUp, isRange],
  );
  useIndexerChannelSubscription([channel], queryEnabled);

  return useQuery({
    queryKey: indexerKeys.orderBook(
      args.oracleId,
      args.expiryMs,
      args.strike,
      higherStrike,
      isUp,
      isRange,
    ),
    queryFn: () =>
      fetchOrderBook({
        oracleId: args.oracleId,
        expiryMs: args.expiryMs,
        strike: args.strike,
        higherStrike,
        isUp,
        isRange,
      }),
    enabled: queryEnabled,
    staleTime: 10_000,
    refetchInterval: isLive ? false : 15_000,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: 1,
  });
}

export function useIndexerGlobalTrades(oracleId: string) {
  const { isLive } = useIndexerStream();
  const channel = useMemo(() => globalTradesChannel(oracleId), [oracleId]);
  useIndexerChannelSubscription([channel], enabled && Boolean(oracleId));

  return useQuery({
    queryKey: indexerKeys.globalTrades(oracleId),
    queryFn: async () => {
      const { items } = await fetchGlobalMarketTrades(oracleId, { limit: 200 });
      return items;
    },
    enabled: enabled && Boolean(oracleId),
    staleTime: 15_000,
    refetchInterval: isLive ? false : 30_000,
    retry: 1,
  });
}

export function useIndexerPositions(
  owner?: string,
  args?: { status?: string; oracleId?: string },
) {
  const { isLive } = useIndexerStream();
  // WS snapshots are open-only; subscribe whenever we have an owner so closed tabs refresh on close.
  const streamEnabled = enabled && Boolean(owner);
  const channel = useMemo(
    () => (owner ? positionsChannel(owner, args?.oracleId) : ""),
    [owner, args?.oracleId],
  );
  useIndexerChannelSubscription(channel ? [channel] : [], streamEnabled);

  return useQuery({
    queryKey: indexerKeys.positions(owner, args?.status, args?.oracleId),
    queryFn: async () => {
      const status = args?.status ?? "open";
      const { items } = await fetchPositions({
        owner,
        oracleId: args?.oracleId,
        limit: 200,
        // Oracle settlement closes positions as `settled`, not `closed`.
        // Indexer defaults to status=open when omitted; use status=all so exclude_status works.
        ...(status === "closed" ? { status: "all", excludeStatus: "open" } : { status }),
      });
      return items;
    },
    enabled: enabled && Boolean(owner),
    staleTime: 15_000,
    refetchInterval: isLive && streamEnabled ? false : 30_000,
    retry: 1,
  });
}

export function useIndexerLimitOrders(owner?: string, oracleId?: string) {
  const { isLive } = useIndexerStream();
  const channel = useMemo(
    () => (owner ? limitOrdersChannel(owner, oracleId) : ""),
    [owner, oracleId],
  );
  useIndexerChannelSubscription(channel ? [channel] : [], enabled && Boolean(owner));

  return useQuery({
    queryKey: indexerKeys.limitOrders(owner, oracleId),
    queryFn: async () => {
      const { items } = await fetchLimitOrders({
        owner,
        oracleId,
        status: "open",
        limit: 200,
      });
      return items;
    },
    enabled: enabled && Boolean(owner),
    staleTime: 15_000,
    refetchInterval: isLive ? false : 30_000,
    retry: 1,
  });
}

export function useIndexerAccounts(owner?: string) {
  return useQuery({
    queryKey: indexerKeys.accounts(owner),
    queryFn: async () => {
      const { items } = await fetchAccounts({ owner, limit: 20 });
      return items;
    },
    enabled: enabled && Boolean(owner),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useIndexerAccount(accountId?: string) {
  return useQuery({
    queryKey: indexerKeys.account(accountId ?? ""),
    queryFn: () => fetchAccount(accountId!),
    enabled: enabled && Boolean(accountId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useIndexerVaultSummary(vaultId?: string) {
  return useQuery({
    queryKey: indexerKeys.vaultSummary(vaultId ?? ""),
    queryFn: () => fetchVaultSummary(vaultId!),
    enabled: enabled && Boolean(vaultId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useIndexerVaultHistory(vaultId?: string, limit = 200) {
  return useQuery({
    queryKey: indexerKeys.vaultHistory(vaultId ?? ""),
    queryFn: async () => {
      const { items } = await fetchVaultHistory(vaultId!, limit);
      return items;
    },
    enabled: enabled && Boolean(vaultId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useIndexerTriggers(accountId?: string) {
  return useQuery({
    queryKey: indexerKeys.triggers(accountId),
    queryFn: async () => {
      const { items } = await fetchTriggers({ accountId, limit: 100 });
      return items;
    },
    enabled: enabled && Boolean(accountId),
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useIndexerExecutors(accountId?: string) {
  return useQuery({
    queryKey: indexerKeys.executors(accountId),
    queryFn: async () => {
      const { items } = await fetchExecutors({ accountId, limit: 100 });
      return items;
    },
    enabled: enabled && Boolean(accountId),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useIndexerLiquidations(args?: { accountId?: string; owner?: string }) {
  const accountId = args?.accountId;
  const owner = args?.owner;
  return useQuery({
    queryKey: indexerKeys.liquidations(accountId, owner),
    queryFn: async () => {
      const { items } = await fetchLiquidations({ accountId, owner, limit: 50 });
      return items;
    },
    enabled: enabled && Boolean(accountId || owner),
    staleTime: 30_000,
    retry: 1,
  });
}

export function usePointsLeaderboard(limit = 100) {
  return useQuery({
    queryKey: indexerKeys.leaderboard(limit),
    queryFn: async () => {
      const { items } = await fetchPointsLeaderboard({ limit, offset: 0 });
      return items;
    },
    enabled,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
