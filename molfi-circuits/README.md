# molfi-circuits

Circom circuits + BLS12-381 Groth16 tooling for Molfi's zero-knowledge layer.
Proofs generated here are verified **on-chain** by the `molfi-verifier` Soroban
contract — see the passing `real_proof.rs` integration test.

## Circuits

| Circuit | Statement | Public signals |
|---------|-----------|----------------|
| `withdraw.circom` | Privacy-pool exit: knowledge of `(secret, nullifier)` for a commitment in a depth-8 Poseidon Merkle tree, revealing only `nullifierHash` | outputs `[root, nullifierHash]`, inputs `[recipient, amount]` |
| `solvency.circom` | "I hold ≥ `threshold` collateral" — proven **without revealing the balance** | `[domain, threshold]` |
| `mul.circom` | Knowledge of `a,b` with `a·b = c` — minimal encoding canary | `[domain, c]` |

All three produce **real Groth16 proofs that verify on-chain** on `molfi-verifier`
(see `molfi-contracts/integration-tests/tests/real_proof.rs`).

`solvency`/`mul` put `domain` first (binds the verifier's anti-replay tag).
`withdraw` computes `root`/`nullifierHash` as **circuit outputs** — so the witness
needs no field-specific JS hashing — and circom emits outputs before inputs, so
its public-signal order is `[root, nullifierHash, recipient, amount]`. The
verifier is order-agnostic: the test feeds the signals in circom's order and the
IC mapping lines up.

## Toolchain
- **circom 2** (BLS12-381 via `-p bls12381`) — binary in `bin/circom`
- **snarkjs 0.7** — Groth16 setup/prove/verify
- **circomlib** — comparators (range checks)

## Pipeline

```bash
npm install
# compile + powers-of-tau + setup + prove + off-chain verify
bash scripts/build.sh solvency 14
# convert snarkjs JSON -> Soroban byte fixture (Rust)
node scripts/to_soroban.mjs solvency \
  ../molfi-contracts/integration-tests/tests/groth16_solvency_fixture.rs
```

Then `cargo test -p molfi-integration-tests --test real_proof` verifies the
real proof on the `molfi-verifier` contract.

## Soroban byte encoding (validated)
`scripts/to_soroban.mjs` emits the encoding the verifier's `from_bytes` expects,
**confirmed correct** by the on-chain test:
- **G1Affine** = `x(48 BE) ‖ y(48 BE)` = 96 bytes
- **G2Affine** = `Fp2(x) ‖ Fp2(y)` = 192 bytes, where **Fp2 = `c1(48 BE) ‖ c0(48 BE)`** (`G2_ORDER=c1c0`)
- **Fr** (public signals) = 32-byte BE

## Notes / next steps
- The `withdraw` circuit demonstrates a **real Merkle-membership + nullifier
  proof verifying on-chain** — the privacy-pool exit statement. It uses circomlib
  Poseidon; over BLS12-381 the constants are valid field elements and the hash is
  deterministic (SNARK soundness holds), but it is **not** a Poseidon
  parameterized for BLS12-381 — for production use BN254 host functions
  (CAP-0074/0075, soroban-sdk v25) or a field-correct Poseidon.
- **Routing the membership proof through `privacy-pool.withdraw` on-chain**
  requires the pool's Merkle tree to use the *same* hash as the circuit. The pool
  currently hashes with SHA-256 (v22 has no Poseidon host fn). Unification path:
  bump to soroban-sdk v25 + on-chain Poseidon (CAP-0075) and a BN254 verifier, OR
  swap the circuit to in-circuit SHA-256. Tracked in the workspace `TODO.md`.
- The `solvency` range proof is a real, secure ZK statement over the BLS12-381
  scalar field with a JS-computable witness.
- `build/` artifacts (ptau, zkey, wasm) are generated; only the `.circom`
  sources, scripts, and committed fixtures are needed to reproduce. Note the
  shared `pot_final.ptau` must be **power ≥ 14** for `withdraw` (~2.5k constraints).
