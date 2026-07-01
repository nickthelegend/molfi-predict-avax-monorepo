import type { Order } from "./types.js";

/**
 * Build a normalized CLOB order, filling in defaults (expiry, nonce).
 * Pure & deterministic except for the caller-supplied/auto nonce + expiry,
 * which can be passed in for reproducibility (e.g. tests, replays).
 */
export function buildOrder(input: Order): Order {
  if (input.price < 0 || input.price > 1) {
    throw new Error(`price must be a probability in [0,1], got ${input.price}`);
  }
  if (input.size <= 0) {
    throw new Error(`size must be > 0, got ${input.size}`);
  }
  return {
    ...input,
    expiry: input.expiry ?? Date.now() + 5 * 60_000,
    nonce: input.nonce ?? randomNonce(),
  };
}

/**
 * Canonical serialization of an order for hashing/signing.
 * Field order is fixed so the same order always produces the same bytes
 * across the SDK, the matching API, and the on-chain verifier.
 */
export function canonicalize(order: Required<Order>): string {
  return [
    order.market,
    order.maker,
    order.side,
    order.outcome,
    order.price.toFixed(6),
    order.size.toString(),
    order.expiry.toString(),
    order.nonce,
  ].join("|");
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
