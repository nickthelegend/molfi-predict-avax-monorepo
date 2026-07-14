/**
 * Read the Molfi market-engine REST API — the live index of auto-rolling
 * markets, prices, the indicative CLOB order book, positions, leaderboard and
 * vault stats. Pure fetch; works in Node and the browser.
 */
import { TESTNET, type MolfiConfig } from "./config.js";

export interface BackendMarket {
  _id: string;
  symbol: string;
  icon?: string;
  cadenceMins?: number;
  category: string;
  question: string;
  strike: number;
  openPrice: number;
  createdAt: number;
  closeTs: number;
  status: "open" | "resolved";
  outcome: "yes" | "no" | null;
  settlePrice: number | null;
  /** Implied YES probability in [0,1]. */
  yesPrice: number;
  spot: number | null;
  oi?: number;
  bets?: number;
}

export interface OrderLevel {
  price: number;
  size: number;
}
export interface OrderBook {
  yes: { bids: OrderLevel[]; asks: OrderLevel[] };
}

export interface PricePoint {
  ts: number;
  price: number;
}

export interface LeaderboardRow {
  rank: number;
  address: string;
  pnl: number;
  wins: number;
  trades: number;
  volume: number;
  winRate: number;
}

export interface Vault {
  _id: string;
  name: string;
  asset: string;
  tvl: number;
  feesEarned: number;
  depositors: number;
  apr: number;
  sharePrice?: number;
  fees24h?: number;
}

async function get<T>(config: MolfiConfig, path: string, fallback: T): Promise<T> {
  const url = `${config.backendUrl}${path}`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`[molfi-sdk] GET ${url} -> HTTP ${r.status} ${r.statusText}; using fallback`);
      return fallback;
    }
    return (await r.json()) as T;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[molfi-sdk] GET ${url} failed (${msg}); using fallback`);
    return fallback;
  }
}

export const fetchMarkets = (config = TESTNET, status: "open" | "closed" = "open") =>
  get<BackendMarket[]>(config, `/api/markets${status === "closed" ? "?status=closed" : ""}`, []);

export const fetchMarket = (id: string, config = TESTNET) =>
  get<BackendMarket | null>(config, `/api/markets/${encodeURIComponent(id)}`, null);

export const fetchOrderBook = (id: string, config = TESTNET) =>
  get<OrderBook | null>(config, `/api/markets/${encodeURIComponent(id)}/orderbook`, null);

export const fetchPrices = (symbol: string, limit = 120, config = TESTNET) =>
  get<PricePoint[]>(config, `/api/prices/${encodeURIComponent(symbol)}?limit=${limit}`, []);

export const fetchLeaderboard = (config = TESTNET) =>
  get<LeaderboardRow[]>(config, `/api/leaderboard`, []);

export const fetchVaults = (config = TESTNET) => get<Vault[]>(config, `/api/vaults`, []);

/** On-chain market ids (32-byte hex) bridged from the backend, ready to bet on. */
export interface OnChainMarketRef {
  marketId: string;
  question: string;
  closeTs: number;
  resolved: boolean;
}
export const fetchOnChainMarkets = (config = TESTNET) =>
  get<OnChainMarketRef[]>(config, `/api/onchain/markets`, []);
