import { useCallback, useEffect, useState } from "react";
import { listMarkets, type OnChainMarket } from "@/services/soroban";
import type { MolfiMarket } from "@/services/molfi-api";

/**
 * Markets feed backed by the live `market` Soroban contract (the "premium",
 * real on-chain venue). Mirrors the `useMarketsFeed` interface so MarketsPlus
 * can use it as a drop-in — but every market here is genuine on-chain state.
 */
export interface StellarFeedResult {
  markets: MolfiMarket[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  loadMore: () => void;
  refresh: () => void;
}

function categoryFor(q: string): string {
  const s = q.toLowerCase();
  if (/btc|bitcoin|eth|ethereum|sol|solana|crypto|xrp|doge/.test(s)) return "crypto";
  if (/rain|weather|temp/.test(s)) return "science";
  if (/turnout|election|vote|president/.test(s)) return "elections";
  return "molfi";
}

function toMolfiMarket(m: OnChainMarket): MolfiMarket {
  const resolved = m.status === 2;
  // Resolved: YES=1.0 / NO=0.0 (or inverse). Trading: unknown → 0.50 midpoint.
  const yes = resolved ? (m.outcome === 0 ? 1 : 0) : 0.5;
  const now = new Date().toISOString();
  const expires = new Date(m.closeTs * 1000).toISOString();
  return {
    id: m.id,
    venue: "molfi",
    title: m.question,
    category: categoryFor(m.question),
    status: resolved ? "resolved" : "active",
    yes_price: yes,
    no_price: 1 - yes,
    volume_24h: 0,
    volume_total: 0,
    liquidity: 0,
    open_interest: 0,
    num_traders: 0,
    trending_score: 0,
    volume_velocity: 0,
    created_at: now,
    updated_at: now,
    synced_at: now,
    group_id: null,
    outcome_type: "binary",
    outcomes: null,
    venue_market_id: m.id,
    market_url: `/m/${m.id}`,
    expires_at: expires,
    accepting_orders: !resolved,
    min_order_size: 1,
    tick_size: 0.5,
  } as MolfiMarket;
}

export function useStellarMarketsFeed(_options?: unknown): StellarFeedResult {
  const [markets, setMarkets] = useState<MolfiMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const onchain = await listMarkets();
      setMarkets(onchain.map(toMolfiMarket));
    } catch (e: any) {
      setError(e?.message ?? "failed to load on-chain markets");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    markets,
    isLoading,
    isLoadingMore: false,
    error,
    hasMore: false,
    total: markets.length,
    loadMore: () => {},
    refresh: load,
  };
}
