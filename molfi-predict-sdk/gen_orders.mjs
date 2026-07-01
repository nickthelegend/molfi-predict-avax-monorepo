// Generate two ed25519-signed CLOB orders (maker/taker) for the on-chain settle
// demo. Produces the exact canonical bytes clob-settlement verifies.
// Usage: node gen_orders.mjs <aliceSecret> <bobSecret> <marketHex> <outDir>
import { Keypair } from "@stellar/stellar-sdk";
import fs from "fs";

const [, , aliceSec, bobSec, marketHex, outDir] = process.argv;

function writeBigBE(buf, offset, value, bytes) {
  let v = BigInt(value);
  for (let i = offset + bytes - 1; i >= offset; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
}

// market(32) ‖ pubkey(32) ‖ outcome(u32) ‖ price(u32) ‖ size(i128,16) ‖ nonce(u64) ‖ expiry(u64)
function order(secret, outcome, price, size, nonce, expiry) {
  const kp = Keypair.fromSecret(secret);
  const pk = kp.rawPublicKey(); // 32 bytes
  const buf = Buffer.alloc(104);
  let o = 0;
  Buffer.from(marketHex, "hex").copy(buf, o); o += 32;
  pk.copy(buf, o); o += 32;
  buf.writeUInt32BE(outcome, o); o += 4;
  buf.writeUInt32BE(price, o); o += 4;
  writeBigBE(buf, o, size, 16); o += 16;
  buf.writeBigUInt64BE(BigInt(nonce), o); o += 8;
  buf.writeBigUInt64BE(BigInt(expiry), o); o += 8;
  const sig = kp.sign(buf); // 64 bytes
  return {
    maker_pubkey: pk.toString("hex"),
    maker_addr: kp.publicKey(),
    market: marketHex,
    outcome,
    price,
    size: String(size), // i128 → string
    nonce: Number(nonce), // u64 → number
    expiry: Number(expiry), // u64 → number
    signature: sig.toString("hex"),
  };
}

const EXPIRY = "1893456000"; // year 2030
const alice = order(aliceSec, 0, 600000, 100, 1, EXPIRY); // YES @ 0.60
const bob = order(bobSec, 1, 400000, 100, 2, EXPIRY); // NO  @ 0.40

fs.writeFileSync(`${outDir}/alice_order.json`, JSON.stringify(alice));
fs.writeFileSync(`${outDir}/bob_order.json`, JSON.stringify(bob));
console.log("alice:", alice.maker_addr, "YES@0.60  bob:", bob.maker_addr, "NO@0.40");
