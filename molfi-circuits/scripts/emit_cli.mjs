// Emit a circuit's verifying key, proof, and public signals as Soroban-CLI JSON
// (hex BytesN), for `stellar contract deploy/invoke`.
//
// Usage: node scripts/emit_cli.mjs <circuit>
// Writes build/<circuit>/cli/{vk.json, proof.json, public.json}.
import fs from "fs";

const circuit = process.argv[2];
const G2_ORDER = process.env.G2_ORDER || "c1c0";
const B = `build/${circuit}`;
const OUT = `${B}/cli`;
fs.mkdirSync(OUT, { recursive: true });

const vk = JSON.parse(fs.readFileSync(`${B}/vkey.json`));
const proof = JSON.parse(fs.readFileSync(`${B}/proof.json`));
const pub = JSON.parse(fs.readFileSync(`${B}/public.json`));

function hexBE(dec, len) {
  let h = BigInt(dec).toString(16);
  if (h.length % 2) h = "0" + h;
  h = h.padStart(len * 2, "0");
  if (h.length > len * 2) throw new Error(`value too large for ${len} bytes`);
  return h;
}
const g1 = (p) => hexBE(p[0], 48) + hexBE(p[1], 48);
const fp2 = (a) =>
  G2_ORDER === "c1c0" ? hexBE(a[1], 48) + hexBE(a[0], 48) : hexBE(a[0], 48) + hexBE(a[1], 48);
const g2 = (p) => fp2(p[0]) + fp2(p[1]);
const fr = (s) => hexBE(s, 32);

const vkJson = {
  alpha_g1: g1(vk.vk_alpha_1),
  beta_g2: g2(vk.vk_beta_2),
  gamma_g2: g2(vk.vk_gamma_2),
  delta_g2: g2(vk.vk_delta_2),
  ic: vk.IC.map((p) => g1(p)),
};
const proofJson = { a: g1(proof.pi_a), b: g2(proof.pi_b), c: g1(proof.pi_c) };
const publicJson = pub.map((s) => fr(s));

fs.writeFileSync(`${OUT}/vk.json`, JSON.stringify(vkJson));
fs.writeFileSync(`${OUT}/proof.json`, JSON.stringify(proofJson));
fs.writeFileSync(`${OUT}/public.json`, JSON.stringify(publicJson));
console.log(`wrote ${OUT}/{vk,proof,public}.json (ic=${vkJson.ic.length}, public=${publicJson.length})`);
