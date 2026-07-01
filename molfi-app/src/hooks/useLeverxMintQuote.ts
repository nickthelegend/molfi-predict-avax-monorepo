import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useIndexerAccounts } from "@/hooks/useIndexer";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import type { MarketKeyArgs } from "@/lib/leverx/market-keys";
import {
  DEV_INSPECT_QUOTE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
  DEV_INSPECT_HOT_POLL_INTERVAL_MS,
} from "@/lib/leverx/constants";
import { fetchMintQuote } from "@/lib/leverx/quotes";
import { leverageToBps, marginUsdToQuoteAtoms } from "@/lib/leverx/trade-math";

export function useLeverxMintQuote(args: {
  key?: MarketKeyArgs;
  marginUsd?: number;
  leverage?: number;
  owner?: string;
  enabled?: boolean;
  /** Size quote quantity against limit premium (resting orders). */
  referencePremiumOverride?: bigint;
}) {
  const { client } = useWallet();
  const { cfg } = useLeverxProtocolConfig();
  const { data: accounts = [] } = useIndexerAccounts(args.owner);
  const accountId = accounts[0]?.account_id;

  const marginAtoms = marginUsdToQuoteAtoms(args.marginUsd ?? 0);
  const leverageBps = leverageToBps(args.leverage ?? 1);

  const query = useQuery({
    queryKey: [
      "leverx-mint-quote",
      args.key?.oracleId,
      args.key?.strike,
      args.key?.higherStrike,
      args.key?.expiryMs,
      args.key?.isUp,
      args.key?.isRange,
      marginAtoms.toString(),
      leverageBps.toString(),
      accountId,
      cfg?.packageId,
      args.referencePremiumOverride?.toString(),
    ],
    queryFn: async () => {
      if (!cfg || !args.key) return null;
      return fetchMintQuote({
        client,
        cfg,
        accountId,
        key: args.key,
        marginQuoteAtoms: marginAtoms,
        leverageBps,
        referencePremiumOverride: args.referencePremiumOverride,
      });
    },
    enabled:
      Boolean(args.enabled ?? true) &&
      Boolean(cfg) &&
      Boolean(args.key) &&
      marginAtoms > 0n &&
      (args.marginUsd ?? 0) > 0,
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    refetchInterval: (query) => {
      const active =
        Boolean(args.enabled ?? true) &&
        Boolean(cfg) &&
        Boolean(args.key) &&
        marginAtoms > 0n &&
        (args.marginUsd ?? 0) > 0;
      if (!active) return false;
      if (query.state.data != null) return DEV_INSPECT_QUOTE_REFETCH_MS;
      return DEV_INSPECT_HOT_POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
    retry: 1,
  });

  return query;
}
