/**
 * Contract-aligned CLOB order signing.
 *
 * Produces the EXACT byte layout the `clob-settlement` Soroban contract verifies
 * with ed25519 (`canonical_order_bytes`):
 *
 *   market(32) ‖ maker_pubkey(32) ‖ outcome(u32 BE) ‖ price(u32 BE)
 *            ‖ size(i128 BE, 16) ‖ nonce(u64 BE) ‖ expiry(u64 BE)   = 104 bytes
 *
 * A Stellar account key IS an ed25519 key, so `StellarKeypairSigner` signs these
 * bytes directly and the contract's `ed25519_verify(maker_pubkey, msg, sig)`
 * accepts them — no separate signing scheme needed.
 */
import { Keypair } from "@stellar/stellar-sdk";

const PRICE_ONE = 1_000_000; // micro-units; price is a probability in [0,1]

export interface ClobOrder {
  /** 32-byte market identifier (matches the on-chain market id). */
  market: Uint8Array;
  outcome: "YES" | "NO";
  /** Probability in [0,1]; serialized as micro-units (price * 1e6). */
  price: number;
  /** Outcome shares. */
  size: bigint;
  nonce: bigint;
  /** Unix seconds. */
  expiry: bigint;
}

export interface SignedClobOrder {
  order: ClobOrder;
  /** 32-byte ed25519 public key of the maker. */
  makerPubkey: Uint8Array;
  /** 64-byte ed25519 signature over the canonical bytes. */
  signature: Uint8Array;
}

/** Signs raw bytes with an ed25519 key and reports its public key. */
export interface OrderSigner {
  publicKey(): Uint8Array | Promise<Uint8Array>;
  sign(message: Uint8Array): Uint8Array | Promise<Uint8Array>;
}

/** ed25519 signer backed by a Stellar `Keypair`. */
export class StellarKeypairSigner implements OrderSigner {
  constructor(private readonly keypair: Keypair) {}
  publicKey(): Uint8Array {
    return new Uint8Array(this.keypair.rawPublicKey());
  }
  sign(message: Uint8Array): Uint8Array {
    return new Uint8Array(this.keypair.sign(Buffer.from(message)));
  }
}

/** Canonical order bytes — must byte-match `clob-settlement::canonical_order_bytes`. */
export function canonicalOrderBytes(order: ClobOrder, makerPubkey: Uint8Array): Uint8Array {
  if (order.market.length !== 32) throw new Error("market must be 32 bytes");
  if (makerPubkey.length !== 32) throw new Error("makerPubkey must be 32 bytes");
  if (order.price < 0 || order.price > 1) throw new Error("price must be in [0,1]");

  const buf = new Uint8Array(104);
  const dv = new DataView(buf.buffer);
  let o = 0;
  buf.set(order.market, o);
  o += 32;
  buf.set(makerPubkey, o);
  o += 32;
  dv.setUint32(o, order.outcome === "YES" ? 0 : 1, false);
  o += 4;
  dv.setUint32(o, Math.round(order.price * PRICE_ONE), false);
  o += 4;
  writeBigUintBE(buf, o, order.size, 16); // i128 (non-negative size)
  o += 16;
  dv.setBigUint64(o, order.nonce, false);
  o += 8;
  dv.setBigUint64(o, order.expiry, false);
  o += 8;
  return buf;
}

/** Build canonical bytes and ed25519-sign them with `signer`. */
export async function signClobOrder(
  order: ClobOrder,
  signer: OrderSigner,
): Promise<SignedClobOrder> {
  const makerPubkey = await signer.publicKey();
  const message = canonicalOrderBytes(order, makerPubkey);
  const signature = await signer.sign(message);
  return { order, makerPubkey, signature };
}

function writeBigUintBE(buf: Uint8Array, offset: number, value: bigint, bytes: number): void {
  if (value < 0n) throw new Error("value must be non-negative");
  let v = value;
  for (let i = offset + bytes - 1; i >= offset; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  if (v !== 0n) throw new Error(`value exceeds ${bytes} bytes`);
}
