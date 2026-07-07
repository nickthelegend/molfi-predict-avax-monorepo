// Unit tests for the SDK's PURE helpers — no network, no chain.
// Runs against the built ESM in ../dist (build first: `npm test` does this).
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  TESTNET,
  toBaseUnits,
  fromBaseUnits,
  OUTCOME_YES,
  OUTCOME_NO,
  generateWallet,
  walletFromSecret,
  buildOrder,
  canonicalize,
  canonicalOrderBytes,
  signClobOrder,
  PrivateKeyOrderSigner,
} from "../dist/index.js";

test("config: TESTNET points at Fuji with 7-decimal mUSDC", () => {
  assert.equal(TESTNET.chainId, 43113);
  assert.equal(TESTNET.decimals, 7);
  assert.match(TESTNET.rpcUrl, /avax-test\.network/);
  assert.equal(TESTNET.contracts.mUSDC, "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C");
  assert.ok(TESTNET.feeds["BTC/USD"]);
});

test("outcome constants", () => {
  assert.equal(OUTCOME_YES, 0);
  assert.equal(OUTCOME_NO, 1);
});

test("toBaseUnits: 7-decimal conversion + truncation", () => {
  assert.equal(toBaseUnits(1), 10_000_000n);
  assert.equal(toBaseUnits(1.5), 15_000_000n);
  assert.equal(toBaseUnits("100"), 1_000_000_000n);
  assert.equal(toBaseUnits(0), 0n);
  // more precision than 7 decimals is truncated, not rounded
  assert.equal(toBaseUnits("0.12345678"), 1_234_567n);
});

test("toBaseUnits: rejects garbage", () => {
  assert.throws(() => toBaseUnits("abc"));
  assert.throws(() => toBaseUnits(""));
});

test("fromBaseUnits: inverse of toBaseUnits", () => {
  assert.equal(fromBaseUnits(10_000_000n), 1);
  assert.equal(fromBaseUnits(15_000_000n), 1.5);
  assert.equal(fromBaseUnits(1_234_567n), 0.1234567);
  for (const v of [0, 1, 2.5, 100, 999.99]) {
    assert.equal(fromBaseUnits(toBaseUnits(v)), v);
  }
});

test("wallet: generateWallet mints a valid 0x EVM keypair", () => {
  const w = generateWallet();
  assert.match(w.address, /^0x[0-9a-fA-F]{40}$/);
  assert.equal(w.publicKey, w.address);
  assert.match(w.privateKey, /^0x[0-9a-fA-F]{64}$/);
  // round-trips through walletFromSecret
  const w2 = walletFromSecret(w.secret);
  assert.equal(w2.address, w.address);
});

test("order: buildOrder fills defaults + validates bounds", () => {
  const o = buildOrder({ market: "0xabc", side: "BUY", outcome: "YES", price: 0.5, size: 10, maker: "0xmaker" });
  assert.ok(o.expiry > Date.now());
  assert.ok(o.nonce && o.nonce.length > 0);
  assert.throws(() => buildOrder({ market: "0xabc", side: "BUY", outcome: "YES", price: 1.5, size: 10 }));
  assert.throws(() => buildOrder({ market: "0xabc", side: "BUY", outcome: "YES", price: 0.5, size: 0 }));
});

test("order: canonicalize is deterministic", () => {
  const full = {
    market: "0xabc", maker: "0xmaker", side: "BUY", outcome: "YES",
    price: 0.5, size: 10, expiry: 1_800_000_000_000, nonce: "deadbeef",
  };
  const a = canonicalize(full);
  const b = canonicalize({ ...full });
  assert.equal(a, b);
  assert.match(a, /0\.500000/);
});

test("clob: canonicalOrderBytes packs to 104 bytes big-endian", () => {
  const market = new Uint8Array(32).fill(1);
  const maker = new Uint8Array(32).fill(2);
  const bytes = canonicalOrderBytes(
    { market, outcome: "NO", price: 0.5, size: 1000n, nonce: 7n, expiry: 1234n },
    maker,
  );
  assert.equal(bytes.length, 104);
  // outcome NO => u32 BE = 1 at offset 64
  const dv = new DataView(bytes.buffer);
  assert.equal(dv.getUint32(64, false), 1);
  // price 0.5 => 500000 micro-units at offset 68
  assert.equal(dv.getUint32(68, false), 500000);
});

test("clob: canonicalOrderBytes rejects bad inputs", () => {
  const ok = new Uint8Array(32);
  assert.throws(() => canonicalOrderBytes({ market: new Uint8Array(31), outcome: "YES", price: 0.5, size: 1n, nonce: 0n, expiry: 0n }, ok));
  assert.throws(() => canonicalOrderBytes({ market: ok, outcome: "YES", price: 2, size: 1n, nonce: 0n, expiry: 0n }, ok));
});

test("clob: PrivateKeyOrderSigner signs canonical bytes (EVM secp256k1)", async () => {
  const w = generateWallet();
  const signer = new PrivateKeyOrderSigner(w.privateKey);
  const maker = await signer.publicKey();
  assert.equal(maker.length, 32);
  const signed = await signClobOrder(
    { market: new Uint8Array(32).fill(9), outcome: "YES", price: 0.42, size: 5n, nonce: 1n, expiry: 2n },
    signer,
  );
  // 65-byte ECDSA signature (r,s,v)
  assert.equal(signed.signature.length, 65);
  assert.equal(signed.makerPubkey.length, 32);
});
