/**
 * BN254 Groth16 ZK layer for Molfi's confidential betting.
 *
 * Uses the compiled confidential_bet circuit
 * (molfi-circuits/build/confidential_bet/) via snarkjs. Public signals order is
 * `[root, nullifierHash, outcome, recipient]` — mirrors
 * molfi-predict-sdk/demo/agent-confidential-bet.mjs. Proofs are returned in the
 * Solidity-calldata shape the on-chain BN254 verifier expects (a:[2],
 * b:[2][2] with G2 coords swapped, c:[2]).
 */
import { groth16 } from "snarkjs";
import { randomBytes, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const HERE = fileURLToPath(new URL(".", import.meta.url));
const CIRCUIT_DIR =
  process.env.MOLFI_CONF_CIRCUIT ||
  `${HERE}../molfi-circuits/build/confidential_bet`;
export const WASM = `${CIRCUIT_DIR}/confidential_bet_js/confidential_bet.wasm`;
export const ZKEY = `${CIRCUIT_DIR}/final.zkey`;

export const CONF_DENOM = 100; // fixed uniform denomination (mUSDC) — hides the amount
export const CONF_PAYOUT = 200; // PAYOUT_MULT(2) × denom on a winning claim

/** True if the compiled circuit artifacts are present (proofs can be generated). */
export function circuitAvailable() {
  return existsSync(WASM) && existsSync(ZKEY);
}

/** A random BN254 field element (< 2^248, safely below the field modulus) as a decimal string. */
export function confField() {
  return BigInt("0x" + randomBytes(31).toString("hex")).toString();
}

/**
 * snarkjs G1/G2 → Solidity calldata shape. G2 coordinates are swapped relative
 * to the EVM verifier (mirrors the SDK demo's toSol()).
 */
export function toSolProof(p) {
  return {
    a: [p.pi_a[0], p.pi_a[1]],
    b: [
      [p.pi_b[0][1], p.pi_b[0][0]],
      [p.pi_b[1][1], p.pi_b[1][0]],
    ],
    c: [p.pi_c[0], p.pi_c[1]],
  };
}

/**
 * Build a confidential note for `side` ("YES" | "NO"). The commitment is a
 * binding hash of the note that reveals nothing about the chosen outcome.
 */
export function prepareCommit(side) {
  const s = String(side || "YES").toUpperCase();
  const outcome = s === "NO" ? 1 : 0;
  const note = { secret: confField(), nullifier: confField(), outcome, recipient: confField() };
  const commitment = createHash("sha256")
    .update([note.secret, note.nullifier, String(note.outcome), note.recipient].join("|"))
    .digest("hex");
  return { note, commitment, denom: CONF_DENOM, side: outcome === 0 ? "YES" : "NO" };
}

/**
 * Generate a BN254 Groth16 proof for a confidential note. Returns the proof in
 * Solidity-calldata shape plus the public signals `[root, nullifierHash,
 * outcome, recipient]`.
 */
export async function proveNote(note, recipient) {
  // The recipient public signal MUST equal uint256(uint160(claimer)) — that's what
  // ConfidentialBet.claim injects and the verifier checks. Bind it to the claiming
  // address (0x…); fall back to the note's field only if none is supplied.
  const recipientField =
    recipient != null && String(recipient).startsWith("0x")
      ? BigInt(recipient).toString()
      : String(note.recipient);
  const input = {
    secret: String(note.secret),
    nullifier: String(note.nullifier),
    outcome: String(note.outcome),
    recipient: recipientField,
    pathElements: ["1", "2", "3", "4", "5", "6", "7", "8"],
    pathIndices: ["0", "1", "0", "1", "0", "0", "1", "0"],
  };
  const { proof, publicSignals } = await groth16.fullProve(input, WASM, ZKEY);
  return {
    proof: toSolProof(proof),
    root: publicSignals[0],
    nullifierHash: publicSignals[1],
    outcome: publicSignals[2],
    recipientField: publicSignals[3],
    publicSignals,
  };
}
