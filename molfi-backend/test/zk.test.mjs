// BN254 confidential-proof tests — exercise the REAL snarkjs proof generation
// against the compiled confidential_bet circuit. These are the honest proof the
// ZK layer was ported to BN254 (mirrors the SDK demo). Slower (proof-gen), so
// kept in their own file; skipped cleanly if the circuit artifacts are absent.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as zk from "../zk.js";
import { bootApp, mockChain } from "./helpers.mjs";

const have = zk.circuitAvailable();

test("zk.proveNote produces a Solidity-shaped BN254 proof + [root,nullifier,outcome,recipient]", { skip: !have && "circuit artifacts not built" }, async () => {
  const note = { secret: zk.confField(), nullifier: zk.confField(), outcome: 0, recipient: zk.confField() };
  const p = await zk.proveNote(note);
  // proof shape: a[2], b[2][2], c[2]
  assert.equal(p.proof.a.length, 2);
  assert.equal(p.proof.b.length, 2);
  assert.equal(p.proof.b[0].length, 2);
  assert.equal(p.proof.c.length, 2);
  // public signals: [root, nullifierHash, outcome, recipient]
  assert.equal(p.publicSignals.length, 4);
  assert.equal(String(p.outcome), "0");
  assert.match(String(p.root), /^\d+$/);
  assert.match(String(p.nullifierHash), /^\d+$/);
});

test("GET /api/zk/proof returns a fresh BN254 proof", { skip: !have && "circuit artifacts not built" }, async () => {
  const h = await bootApp();
  try {
    const { status, body } = await h.get("/api/zk/proof");
    assert.equal(status, 200);
    assert.equal(body.proof.a.length, 2);
    assert.equal(body.publicInputs.length, 4);
  } finally {
    await h.close();
  }
});

test("confidential/prepare-claim WON path generates a real proof for the winning side", { skip: !have && "circuit artifacts not built" }, async () => {
  // Winner = 0 (YES); the note also backs 0 → won, so a proof is generated.
  const h = await bootApp({
    chain: mockChain({ isResolved: async () => true, winningOutcome: async () => 0 }),
  });
  try {
    const note = { secret: zk.confField(), nullifier: zk.confField(), outcome: 0, recipient: zk.confField() };
    const { status, body } = await h.post("/api/confidential/prepare-claim", {
      note,
      marketId: "0xfeed",
      recipient: "0x1111111111111111111111111111111111111111",
    });
    assert.equal(status, 200);
    assert.equal(body.resolved, true);
    assert.equal(body.won, true);
    assert.equal(body.winningOutcome, 0);
    assert.equal(body.payout, zk.CONF_PAYOUT);
    assert.equal(body.proof.a.length, 2);
    assert.match(String(body.root), /^\d+$/);
    assert.match(String(body.nullifierHash), /^\d+$/);
  } finally {
    await h.close();
  }
});
