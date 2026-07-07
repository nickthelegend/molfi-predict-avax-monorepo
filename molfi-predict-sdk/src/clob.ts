/**
 * Contract-aligned CLOB order signing.
 *
 * Produces a canonical byte layout for a Molfi limit order:
 *
 *   market(32) ‖ maker_pubkey(32) ‖ outcome(u32 BE) ‖ price(u32 BE)
 *            ‖ size(i128 BE, 16) ‖ nonce(u64 BE) ‖ expiry(u64 BE)   = 104 bytes
 *
 * On Avalanche the maker is an EVM account, so `PrivateKeyOrderSigner` signs the
 * keccak256 of these bytes with the account's secp256k1 key (EVM-recoverable).
 * `canonicalOrderBytes` stays pure and chain-agnostic.
 */
import { keccak256, hexToBytes } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import type { Hex } from "viem";

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
  /** 32-byte maker identity (the low 32 bytes of the EVM address, zero-padded). */
  makerPubkey: Uint8Array;
  /** ECDSA signature bytes over keccak256(canonical bytes). */
  signature: Uint8Array;
}

/** Signs raw bytes and reports the 32-byte maker identity. */
export interface OrderSigner {
  publicKey(): Uint8Array | Promise<Uint8Array>;
  sign(message: Uint8Array): Uint8Array | Promise<Uint8Array>;
}

/** Pad a 20-byte EVM address into the 32-byte maker slot (left-zero-padded). */
function addressToMakerBytes(address: Hex): Uint8Array {
  const raw = hexToBytes(address); // 20 bytes
  const out = new Uint8Array(32);
  out.set(raw, 12);
  return out;
}

/** ECDSA signer backed by a viem local (private-key) account. */
export class PrivateKeyOrderSigner implements OrderSigner {
  private readonly account: PrivateKeyAccount;
  constructor(privateKey: Hex) {
    this.account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : (`0x${privateKey}` as Hex));
  }
  publicKey(): Uint8Array {
    return addressToMakerBytes(this.account.address);
  }
  async sign(message: Uint8Array): Promise<Uint8Array> {
    const digest = keccak256(message);
    const sig = await this.account.sign({ hash: digest });
    return hexToBytes(sig);
  }
}

/** Canonical order bytes — 104-byte big-endian packed layout. */
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

/** Build canonical bytes and sign them with `signer`. */
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
