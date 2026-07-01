import { useMemo } from "react";
import { useOnChainMarkets } from "@/hooks/useOnChainMarkets";
import { findCategory } from "@/lib/market-categories";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

/**
 * Markets feed for /markets. Crypto is the live venue — REAL on-chain markets
 * created + settled on the predict-escrow contract via the Reflector oracle
 * (betting escrows real mUSDC). Other categories are coming soon.
 */
export function useMolfiMarkets(args: {
  categoryId: string;
  search?: string;
  status?: "open" | "closed";
}) {
  const cat = findCategory(args.categoryId);
  const onchain = useOnChainMarkets(args.status ?? "open");

  const markets = useMemo<LeverxMarketRow[]>(() => {
    if (cat.comingSoon) return [];
    let rows = onchain.markets;
    const q = (args.search ?? "").trim().toLowerCase();
    if (q) rows = rows.filter((r) => (r.question ?? "").toLowerCase().includes(q));
    return rows;
  }, [cat, onchain.markets, args.search]);

  return {
    markets,
    loading: cat.comingSoon ? false : onchain.loading,
    comingSoon: cat.comingSoon === true,
    offline: false,
    catalogReady: true,
  };
}
