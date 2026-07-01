import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import { fetchTradingQuoteBalance } from "@/lib/leverx/quotes";
import {
  DEV_INSPECT_BALANCE_REFETCH_MS,
  DEV_INSPECT_QUOTE_STALE_MS,
} from "@/lib/leverx/constants";
import { QUOTE_UNIT } from "@/lib/predict/constants";
import { scaleQuoteAtoms } from "@/lib/predict/scaling";

/** Reject devInspect garbage — balances above this are treated as failed reads. */
const MAX_TRADING_BALANCE_ATOMS = 1_000_000n * QUOTE_UNIT;

/**
 * On-chain balance of the proxy's single trading account (key-agnostic).
 *
 * This is the one spendable, fully-withdrawable pool that funds every position. Read via
 * devInspect of `user_proxy::withdrawable_trading_quote` since custody balances are not indexed.
 */
export function useTradingAccountBalance(accountId: string | undefined) {
  const { client } = useWallet();
  const { cfg } = useLeverxProtocolConfig();
  const enabled = Boolean(cfg?.packageId && accountId);

  const query = useQuery({
    queryKey: ["trading-account-balance", accountId, cfg?.packageId],
    queryFn: async (): Promise<bigint> => {
      let atoms = await fetchTradingQuoteBalance({
        client,
        leverxPackageId: cfg!.packageId,
        accountId: accountId!,
      });
      if (atoms > MAX_TRADING_BALANCE_ATOMS) atoms = 0n;
      return atoms;
    },
    enabled,
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    refetchInterval: DEV_INSPECT_BALANCE_REFETCH_MS,
    retry: 1,
  });

  const atoms = query.data ?? 0n;
  const isLoading = enabled && !query.isFetched && (query.isLoading || query.isFetching);

  return {
    atoms,
    usd: scaleQuoteAtoms(atoms),
    isLoading,
    isFetched: query.isFetched,
    refetch: () => void query.refetch(),
  };
}
