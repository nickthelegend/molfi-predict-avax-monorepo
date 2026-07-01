import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { appConfig } from "@/lib/config";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { leverxMarketAskQueryKey } from "@/hooks/useLeverxMarketAsk";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import { marketRowToKey } from "@/lib/leverx/market-keys";
import {
  DEV_INSPECT_QUOTE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
} from "@/lib/leverx/constants";
import { fetchPredictMarketAsk } from "@/lib/leverx/quotes";

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

export type VisibleMarketQuoteState = {
  asks: ReadonlyMap<string, number>;
  paused: ReadonlySet<string>;
};

export function withLiveMarketAsks(
  markets: readonly LeverxMarketRow[],
  quoteState?: VisibleMarketQuoteState,
): LeverxMarketRow[] {
  if (!quoteState) return [...markets];

  return markets.map((m) => {
    const live = quoteState.asks.get(m.id);
    const fetchFailed = quoteState.paused.has(m.id);
    const premium = live ?? m.lastAskPremium ?? null;
    const quotePaused = fetchFailed && (premium == null || premium <= 0);
    return {
      ...m,
      lastAskPremium: premium,
      quotePaused,
    };
  });
}

/** Live per-contract ask (devInspect) for markets on the current page — no catalog fallback when paused. */
export function useVisibleMarketAsks(markets: readonly LeverxMarketRow[]) {
  const { client } = useWallet();
  const queryClient = useQueryClient();
  const { cfg: fullCfg } = useLeverxProtocolConfig();
  const cfg = useMemo(
    () =>
      fullCfg
        ? quoteCfg(fullCfg.packageId, fullCfg.predictId, fullCfg.predictPackageId)
        : null,
    [fullCfg],
  );

  const marketKeys = useMemo(() => {
    const entries: Array<{ marketId: string; key: NonNullable<ReturnType<typeof marketRowToKey>> }> =
      [];
    for (const m of markets) {
      const key = marketRowToKey(m);
      if (key) entries.push({ marketId: m.id, key });
    }
    return entries;
  }, [markets]);

  const batchKey = marketKeys
    .map((entry) => entry.marketId)
    .sort()
    .join(",");

  const query = useQuery({
    queryKey: ["leverx-visible-market-asks", batchKey],
    queryFn: async (): Promise<VisibleMarketQuoteState> => {
      if (!cfg) return { asks: new Map(), paused: new Set() };

      const asks = new Map<string, number>();
      const paused = new Set<string>();

      await Promise.all(
        marketKeys.map(async ({ marketId, key }) => {
          try {
            const ask = await queryClient.fetchQuery({
              queryKey: leverxMarketAskQueryKey(key),
              queryFn: () => fetchPredictMarketAsk({ client, cfg, key }),
              staleTime: DEV_INSPECT_QUOTE_STALE_MS,
            });
            if (ask == null || ask <= 0n) {
              paused.add(marketId);
              return;
            }
            asks.set(marketId, Number(ask));
          } catch {
            paused.add(marketId);
          }
        }),
      );

      return { asks, paused };
    },
    enabled: Boolean(cfg && marketKeys.length > 0),
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    refetchInterval: DEV_INSPECT_QUOTE_REFETCH_MS,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: 1,
  });

  const enrichedMarkets = useMemo(
    () => withLiveMarketAsks(markets, query.data),
    [markets, query.data],
  );

  return {
    markets: enrichedMarkets,
    isLoading: marketKeys.length > 0 && query.isPending && !query.data,
    isFetching: query.isFetching,
  };
}
