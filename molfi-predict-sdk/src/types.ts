/** Core CLOB types for Molfi prediction markets. */

export type Network = "testnet" | "mainnet" | "futurenet";

export type Side = "BUY" | "SELL";
export type Outcome = "YES" | "NO";

/** A CLOB order before signing. Prices are probabilities in [0, 1]. */
export interface Order {
  /** Market identifier (Soroban contract / market id). */
  market: string;
  side: Side;
  outcome: Outcome;
  /** Probability price, 0..1. */
  price: number;
  /** Number of outcome shares. */
  size: number;
  /** Stellar account (G...) placing the order. Filled in at sign time if omitted. */
  maker?: string;
  /** Unix ms; defaults to now at build time. */
  expiry?: number;
  /** Anti-replay nonce; defaults to a random value at build time. */
  nonce?: string;
}

/** An order plus its canonical hash and a Stellar signature. */
export interface SignedOrder {
  order: Required<Order>;
  /** Canonical, deterministic hash of the order payload. */
  hash: string;
  /** Base64 ed25519 signature over `hash`. */
  signature: string;
  /** Public key (G...) that produced `signature`. */
  signer: string;
}

export interface SubmitReceipt {
  orderId: string;
  status: "accepted" | "rejected" | "queued";
  reason?: string;
}

/** Anything that can sign a 32-byte hash and report its Stellar public key. */
export interface Signer {
  publicKey(): string | Promise<string>;
  /** Sign raw bytes, returning a base64 signature. */
  sign(payload: Uint8Array): Promise<string> | string;
}
