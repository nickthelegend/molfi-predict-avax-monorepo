/**
 * Molfi backend client — the MongoDB-backed market engine (price feed +
 * auto-rolling 30-minute BTC/XLM markets + settlement). See molfi-backend/.
 */
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

const BASE =
  (import.meta.env.VITE_MOLFI_BACKEND_URL as string | undefined) ?? "http://localhost:4000";

export interface BackendMarket {
  _id: string;
  symbol: string;
  icon?: string;
  cadenceMins?: number;
  category: string;
  question: string;
  strike: number;
  side: string;
  openPrice: number;
  createdAt: number;
  closeTs: number;
  status: "open" | "resolved";
  outcome: "yes" | "no" | null;
  settlePrice: number | null;
  yesPrice: number;
  spot: number | null;
  oi?: number;
  bets?: number;
}

export interface PricePoint {
  ts: number;
  price: number;
}

export async function fetchBackendMarkets(
  status: "open" | "closed" = "open",
): Promise<BackendMarket[]> {
  const qs = status === "closed" ? "?status=closed" : "";
  const r = await fetch(`${BASE}/api/markets${qs}`);
  if (!r.ok) throw new Error(`molfi-backend ${r.status}`);
  return r.json();
}

export async function fetchBackendMarket(id: string): Promise<BackendMarket> {
  const r = await fetch(`${BASE}/api/markets/${encodeURIComponent(id)}`);
  if (!r.ok) throw new Error(`molfi-backend ${r.status}`);
  return r.json();
}

export async function fetchBackendPrices(symbol: string, limit = 240): Promise<PricePoint[]> {
  const r = await fetch(`${BASE}/api/prices/${encodeURIComponent(symbol)}?limit=${limit}`);
  if (!r.ok) return [];
  return r.json();
}

export interface OrderLevel {
  price: number;
  size: number;
}
export interface OrderBook {
  yes: { bids: OrderLevel[]; asks: OrderLevel[] };
}

export async function fetchBackendOrderbook(id: string): Promise<OrderBook | null> {
  const r = await fetch(`${BASE}/api/markets/${encodeURIComponent(id)}/orderbook`);
  if (!r.ok) return null;
  return r.json();
}

export interface BackendPosition {
  _id: string;
  marketId: string;
  symbol: string;
  question: string;
  address: string;
  side: "yes" | "no";
  amount: number;
  entryPrice: number;
  entryYes?: number;
  fee?: number;
  status: "open" | "settled";
  won?: boolean;
  payout?: number;
  pnl?: number;
  createdAt?: number;
  settledAt?: number;
}

export async function placeBet(input: {
  marketId: string;
  side: "yes" | "no";
  amount: number;
  address: string;
}): Promise<BackendPosition> {
  const r = await fetch(`${BASE}/api/bet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `bet failed (${r.status})`);
  }
  return r.json();
}

export async function fetchPositions(address: string): Promise<BackendPosition[]> {
  const r = await fetch(`${BASE}/api/positions/${encodeURIComponent(address)}`);
  if (!r.ok) return [];
  return r.json();
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

export async function fetchLeaderboard(): Promise<LeaderboardRow[]> {
  const r = await fetch(`${BASE}/api/leaderboard`);
  if (!r.ok) return [];
  return r.json();
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
  totalShares?: number;
  feeVolume?: number;
  onchain?: boolean;
}

export async function fetchVaults(): Promise<Vault[]> {
  const r = await fetch(`${BASE}/api/vaults`);
  if (!r.ok) return [];
  return r.json();
}

export interface VaultHistoryPoint {
  ts: number;
  tvl: number;
  fees: number;
}

export async function fetchVaultHistory(): Promise<VaultHistoryPoint[]> {
  const r = await fetch(`${BASE}/api/vaults/history`);
  if (!r.ok) return [];
  return r.json();
}

export interface VaultActivity {
  type: "deposit" | "fee";
  address: string;
  amount: number;
  symbol?: string;
  ts: number;
}

export async function fetchVaultActivity(): Promise<VaultActivity[]> {
  const r = await fetch(`${BASE}/api/vaults/activity`);
  if (!r.ok) return [];
  return r.json();
}

export interface VaultPosition {
  deposited: number;
  sharePct: number;
  earned: number;
}

export async function fetchVaultPosition(address: string): Promise<VaultPosition> {
  const r = await fetch(`${BASE}/api/vaults/position/${encodeURIComponent(address)}`);
  if (!r.ok) return { deposited: 0, sharePct: 0, earned: 0 };
  return r.json();
}

export async function vaultDeposit(address: string, amount: number): Promise<void> {
  const r = await fetch(`${BASE}/api/vaults/deposit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, amount }),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.error || `deposit failed (${r.status})`);
  }
}

/** Backend market ids look like `BTC-60400-1751...` / `XLM-0.177-1751...`. */
export function isBackendMarketId(id: string): boolean {
  return /^(BTC|ETH|SOL|XLM|DOGE|AVAX|LINK)-/.test(id);
}

/** A market that exists ON-CHAIN (32-byte hex id) and can be bet on via the
 * predict-escrow contract with a connected wallet. */
export interface OnChainMarketRef {
  marketId: string;
  symbol: string;
  question: string;
  closeTs: number;
  resolved: boolean;
  oracle?: string;
  icon?: string;
  cadenceMins?: number;
  strike?: number;
  spot?: number | null;
  yesPrice?: number;
  oi?: number;
  bets?: number;
  outcome?: number | null;
}

export async function fetchOnChainMarket(id: string): Promise<OnChainMarketRef | null> {
  const r = await fetch(`${BASE}/api/onchain/markets/${encodeURIComponent(id)}`);
  if (!r.ok) return null;
  return r.json();
}

export interface ZkProof {
  proof: { a: string; b: string; c: string };
  publicInputs: string[];
  domain: string;
}

/** Fresh BLS12-381 Groth16 proof for a ZK-gated bet (verified on-chain). */
export async function fetchZkProof(): Promise<ZkProof> {
  const r = await fetch(`${BASE}/api/zk/proof`);
  if (!r.ok) throw new Error("ZK proof service unavailable");
  return r.json();
}

// ── Confidential betting (hidden side via commitment notes + on-chain ZK claim) ──
export interface ConfNote {
  secret: string;
  nullifier: string;
  outcome: number; // 0 YES, 1 NO
  recipient: string;
}
export interface ConfPrepareCommit {
  note: ConfNote;
  commitment: string; // hex — escrowed on-chain, reveals nothing about the side
  denom: number; // fixed mUSDC denomination
  side: "YES" | "NO";
}
export interface ConfPrepareClaim {
  resolved: boolean;
  won?: boolean;
  winningOutcome?: number;
  payout?: number;
  proof?: { a: string; b: string; c: string };
  root?: string;
  nullifierHash?: string;
  recipientField?: string;
}

/** Generate a hidden commitment note for a confidential bet on `side`. */
export async function fetchConfidentialNote(side: "YES" | "NO"): Promise<ConfPrepareCommit> {
  const r = await fetch(`${BASE}/api/confidential/prepare-commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ side }),
  });
  if (!r.ok) throw new Error("Confidential service unavailable");
  return r.json();
}

/** Build the on-chain ZK claim proof for a confidential note on a resolved market. */
export async function fetchConfidentialClaim(
  note: ConfNote,
  marketId: string,
): Promise<ConfPrepareClaim> {
  const r = await fetch(`${BASE}/api/confidential/prepare-claim`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ note, marketId }),
  });
  if (!r.ok) throw new Error("Confidential proof service unavailable");
  return r.json();
}

// ── Market chat (text / emoji / GIF / image; images pinned to IPFS via Pinata) ──
export type ApiCommentType = "text" | "gif" | "image";
export interface ApiReply {
  id: string;
  address: string;
  type: ApiCommentType;
  text: string;
  path: string;
  likes: string[];
  ts: number;
}
export interface ApiComment extends Omit<ApiReply, "likes"> {
  likes: string[];
  replies: ApiReply[];
}
type CommentInput = { type: ApiCommentType; text?: string; path?: string };

async function jsonOrThrow(r: Response, fallback: string) {
  if (!r.ok) throw new Error(((await r.json().catch(() => ({}))) as { error?: string }).error || fallback);
  return r.json();
}

export async function fetchMarketComments(marketId: string, limit = 20): Promise<ApiComment[]> {
  const r = await fetch(`${BASE}/api/markets/${encodeURIComponent(marketId)}/comments?limit=${limit}`);
  if (!r.ok) return [];
  return r.json();
}
export async function postMarketComment(marketId: string, address: string, payload: CommentInput) {
  return jsonOrThrow(
    await fetch(`${BASE}/api/markets/${encodeURIComponent(marketId)}/comments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, ...payload }),
    }),
    "Failed to post comment",
  );
}
export async function likeComment(commentId: string, address: string, liked: boolean) {
  return jsonOrThrow(
    await fetch(`${BASE}/api/comments/${commentId}/like`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, liked }),
    }),
    "Failed to update like",
  );
}
export async function replyToComment(commentId: string, address: string, payload: CommentInput) {
  return jsonOrThrow(
    await fetch(`${BASE}/api/comments/${commentId}/reply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, ...payload }),
    }),
    "Failed to post reply",
  );
}
export async function deleteMarketComment(commentId: string, address: string) {
  return jsonOrThrow(
    await fetch(`${BASE}/api/comments/${commentId}?address=${encodeURIComponent(address)}`, { method: "DELETE" }),
    "Failed to delete comment",
  );
}
export async function deleteMarketReply(commentId: string, replyId: string, address: string) {
  return jsonOrThrow(
    await fetch(
      `${BASE}/api/comments/${commentId}/replies/${replyId}?address=${encodeURIComponent(address)}`,
      { method: "DELETE" },
    ),
    "Failed to delete reply",
  );
}
/** Upload an image to IPFS via the backend's Pinata proxy; returns the gateway URL. */
export async function uploadCommentImage(
  dataUrl: string,
  filename?: string,
): Promise<{ cid: string; url: string }> {
  return jsonOrThrow(
    await fetch(`${BASE}/api/pinata/upload`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl, filename }),
    }),
    "Image upload failed",
  );
}

export interface OnChainTrade {
  kind: "bet" | "redeem";
  market: string;
  outcome: number | null;
  amount: number;
  ts: number;
  txHash: string | null;
}

/** A wallet's real on-chain bets/redeems (with tx hashes), optionally per market. */
export async function fetchOnChainPositions(
  address: string,
  market?: string,
): Promise<OnChainTrade[]> {
  const qs = market ? `?market=${encodeURIComponent(market)}` : "";
  const r = await fetch(`${BASE}/api/onchain/positions/${encodeURIComponent(address)}${qs}`);
  if (!r.ok) return [];
  return r.json();
}

export async function fetchOnChainMarkets(
  status: "open" | "closed" = "open",
): Promise<OnChainMarketRef[]> {
  const qs = status === "closed" ? "?status=closed" : "";
  const r = await fetch(`${BASE}/api/onchain/markets${qs}`);
  if (!r.ok) return [];
  return r.json();
}

/** Map an on-chain (predict-escrow + Reflector) market into the rich grid row. */
export function onChainMarketToRow(m: OnChainMarketRef): LeverxMarketRow {
  return {
    id: m.marketId,
    oracleId: m.marketId,
    asset: m.symbol,
    strike: m.strike ?? 0,
    strikeRaw: 0,
    higherStrikeRaw: 0,
    expiry: m.closeTs,
    isUp: true,
    isRange: false,
    lastAskPremium: m.yesPrice != null ? m.yesPrice * 100 : null,
    quotePaused: false,
    volume: m.oi ?? 0,
    status: m.resolved ? "resolved" : "active",
    question: m.question,
    iconUrl: m.icon,
    category: "crypto",
    source: "stellar",
    onchainStatus: m.resolved ? 2 : 0,
    onchainOutcome: 2,
  };
}

/** Map a backend market into the rich grid's row shape. */
export function backendMarketToRow(m: BackendMarket): LeverxMarketRow {
  return {
    id: m._id,
    oracleId: m._id,
    asset: m.symbol,
    strike: 0,
    strikeRaw: 0,
    higherStrikeRaw: 0,
    expiry: m.closeTs,
    isUp: true,
    isRange: false,
    lastAskPremium: m.yesPrice != null ? m.yesPrice * 100 : null,
    quotePaused: false,
    volume: m.oi ?? 0,
    status: m.status === "resolved" ? "resolved" : "active",
    question: m.question,
    iconUrl: m.icon,
    category: "crypto",
    source: "stellar",
    onchainStatus: m.status === "resolved" ? 2 : 0,
    onchainOutcome: m.outcome === "yes" ? 0 : m.outcome === "no" ? 1 : 2,
  };
}
