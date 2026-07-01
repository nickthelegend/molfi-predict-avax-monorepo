import { useQuery } from "@tanstack/react-query";
import { listMarkets, type OnChainMarket } from "@/lib/stellar/soroban";

/**
 * Live markets read straight from the Molfi `market` Soroban contract on
 * Stellar testnet (enumerate + per-market state via simulation). No indexer.
 */
export function useStellarMarkets() {
  return useQuery<OnChainMarket[]>({
    queryKey: ["stellar", "markets"],
    queryFn: listMarkets,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
}
