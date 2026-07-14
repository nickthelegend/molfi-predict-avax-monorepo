/**
 * molfi-predict-sdk — the modular SDK for Molfi on Avalanche Fuji.
 *
 * Two layers, one package:
 *  • Agent layer (`MolfiAgent`, `MolfiChain`, wallet, data) — generate a
 *    wallet, self-faucet, read live markets/odds, and place REAL on-chain
 *    (mUSDC-escrowed, optionally ZK-gated) bets. This is what lets an AI agent
 *    trade autonomously. See SKILL.md.
 *  • CLOB layer (`signClobOrder`, `buildOrder`, `MolfiClient`) — canonical
 *    order signing for the off-chain limit order book.
 */

// ── Agent / on-chain layer ───────────────────────────────────────────────────
export { MolfiAgent } from "./agent.js";
export type { OnboardResult } from "./agent.js";
export { MolfiChain } from "./chain.js";
export type { Groth16Proof, ChainOptions } from "./chain.js";
export { generateWallet, walletFromSecret } from "./wallet.js";
export type { MolfiWallet } from "./wallet.js";
export {
  TESTNET,
  toBaseUnits,
  fromBaseUnits,
  OUTCOME_YES,
  OUTCOME_NO,
} from "./config.js";
export type { MolfiConfig, MolfiContracts } from "./config.js";
export {
  fetchMarkets,
  fetchMarket,
  fetchOrderBook,
  fetchPrices,
  fetchLeaderboard,
  fetchVaults,
  fetchOnChainMarkets,
} from "./data.js";
export type {
  BackendMarket,
  OrderBook,
  OrderLevel,
  PricePoint,
  LeaderboardRow,
  Vault,
  OnChainMarketRef,
} from "./data.js";

// ── CLOB order-signing layer ─────────────────────────────────────────────────
export {
  canonicalOrderBytes,
  signClobOrder,
  PrivateKeyOrderSigner,
} from "./clob.js";
export type { ClobOrder, SignedClobOrder, OrderSigner } from "./clob.js";

export { buildOrder, canonicalize } from "./order.js";
export type {
  Network,
  Side,
  Outcome,
  Order,
  SignedOrder,
  SubmitReceipt,
  Signer,
} from "./types.js";

import { canonicalize, buildOrder } from "./order.js";
import type {
  Network,
  Order,
  SignedOrder,
  Signer,
  SubmitReceipt,
} from "./types.js";

export interface MolfiClientConfig {
  apiUrl: string;
  network: Network;
}

export class MolfiClient {
  constructor(private readonly config: MolfiClientConfig) {}

  /** Sign a (built) order with a Stellar signer over its canonical hash. */
  async signOrder(order: Order, signer: Signer): Promise<SignedOrder> {
    const maker = order.maker ?? (await signer.publicKey());
    const full = { ...buildOrder({ ...order, maker }) } as Required<Order>;
    const payload = new TextEncoder().encode(canonicalize(full));
    const hash = await sha256Hex(payload);
    const signature = await signer.sign(payload);
    return { order: full, hash, signature, signer: maker };
  }

  /** Submit a signed order to the Molfi matching API. */
  async submitOrder(signed: SignedOrder): Promise<SubmitReceipt> {
    const res = await fetch(`${this.config.apiUrl}/v1/orders`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(signed),
    });
    if (!res.ok) {
      return { orderId: "", status: "rejected", reason: `HTTP ${res.status}` };
    }
    return (await res.json()) as SubmitReceipt;
  }
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer-backed view so the type is unambiguously
  // BufferSource (TS 5.7+ distinguishes ArrayBuffer from SharedArrayBuffer).
  const view = new Uint8Array(bytes);
  const digest = await crypto.subtle.digest("SHA-256", view.buffer);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
