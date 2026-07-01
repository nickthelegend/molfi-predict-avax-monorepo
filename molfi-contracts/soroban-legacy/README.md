# molfi-contracts

Soroban (Rust) smart contracts for **Molfi** — a private prediction market on Stellar.

Architecture follows the **verifier / policy / application** split recommended by
Stellar's ZK guidance: cryptography, compliance, and state-transition logic live
in separate, independently-auditable contracts.

| Contract | Crate | Responsibility |
|----------|-------|----------------|
| `verifier` | `molfi-verifier` | Groth16 (BLS12-381) proof verification **only**. Admin-set VK, proofs bound to a domain tag for anti-replay. |
| `privacy-pool` | `molfi-privacy-pool` | Confidential positions: append-only commitment Merkle tree + nullifier set. Public deposit, private (proof-gated) withdraw. |
| `market` | `molfi-market` | Binary market lifecycle `Trading → Resolving → Resolved`. Three resolution paths: admin `resolve`, ZK `resolve_with_proof`, and **`resolve_from_oracle`** (SEP-40 / Reflector price feed). |
| `clob-settlement` | `molfi-clob-settlement` | Account-model settlement: `deposit` → `settle` (ed25519 order sigs + nonce guards + escrow + positions) → `redeem` (market + verifier cross-calls + payout). |
| `policy` | `molfi-policy` | ASP allow-list root + deposit limits (compliant privacy, kept out of the verifier). |

## How a bet settles (end to end)

```
deposit ─▶ settle ─▶ market resolves ─▶ redeem ─▶ winner paid
                       (admin │ ZK proof │ oracle)
```

Traders fund their settlement balance (`deposit`, own auth). A relayer submits a
matched, ed25519-signed YES/NO pair to `settle`, which escrows collateral and
records positions. The market resolves — for price markets (e.g. "BTC ≥ $100k")
**anyone** can call `resolve_from_oracle`, which reads a SEP-40 oracle and applies
the threshold + staleness rule. The winner calls `redeem`, which cross-calls
`market` for the outcome and `verifier` for a ZK proof, then pays the pot. See
`integration-tests/tests/e2e.rs` (`bet_on_market_settle_and_win`,
`btc_market_resolves_via_oracle_and_pays_winner`).

## ZK proofs: real, verified on-chain

The `verifier` accepts **genuine Groth16 (BLS12-381) proofs** produced by
`molfi-circuits/` — `real_proof.rs` verifies a solvency proof and a Merkle
membership + nullifier proof on the actual contract, and rejects a tampered
input. Encoding: G1 `x‖y`, **G2 `c1‖c0`** (each Fp 48-byte BE), Fr 32-byte BE.
The integration tests use a `MockVerifier`/`MockOracle` for the economic flows so
they run without artifacts; swapping in the real verifier + proof is a drop-in.

## Security posture (baked in)

- **Reinitialization blocked** — admin set in `__constructor`; no re-init path.
- **Explicit auth** — every privileged entrypoint calls `require_auth`.
- **Anti-replay** — verifier binds a domain tag; pool burns nullifiers; settlement consumes per-order nonces.
- **Checked arithmetic** — `checked_add`/`checked_mul`/`checked_div`, `overflow-checks = true`.
- **Typed storage keys** — `DataKey` enums, no key collisions.
- **Pinned dependencies** — collateral token + verifier addresses fixed at construction (no arbitrary-contract-call surface).
- **TTL management** — instance/persistent TTL extended on writes.
- **Events** — emitted on every auditable state transition.

See the Soroban security checklist and recommended tooling (Scout, OpenZeppelin
detectors, Certora Sunbeam, Komet) before any mainnet deploy.

## Confidential withdrawal (real proof, end to end)

`privacy-pool.withdraw` is gated by a **real Groth16 membership + nullifier
proof** verified on-chain. Flow:

1. `deposit` — escrow collateral + log the commitment.
2. `register_root` — the operator maintains the Poseidon commitment tree
   off-chain and checkpoints each new Merkle root on-chain (see note below).
3. `withdraw(proof, public_signals, to, amount)` — the pool checks the root is
   checkpointed and the `nullifierHash` unused, **verifies the proof via the
   verifier**, burns the nullifier, and releases collateral.

Test: `integration-tests/tests/confidential_withdraw_with_real_proof` runs this
with the **real** verifier + a genuine proof from `molfi-circuits/withdraw` and
rejects a double-spend.

## Cryptography notes

- **SDK:** pinned to **soroban-sdk v25** (BLS12-381 + BN254 host functions). The
  verifier uses **BLS12-381** (CAP-0059) and verifies real proofs (see
  `real_proof.rs`). A **BN254** variant (CAP-0074, native to Circom/snarkjs) can
  drop in behind the same interface — BN254 host fns are present in v25.
- **Hashing / the off-chain tree:** there is **no Poseidon host function** in the
  released SDK yet (CAP-0075 not shipped), so the pool's Poseidon commitment tree
  is maintained off-chain and its roots are checkpointed via `register_root`
  (standard pattern for ZK pools without a native hash). When on-chain Poseidon
  lands, the tree can be rebuilt on-chain and `register_root` retired. (The
  legacy on-chain SHA-256 tree from `deposit` remains as a public commitment log.)
- Always verify CAP status + `soroban-sdk` support for your target network.

## Build & test

```bash
# Unit + integration tests (native, fast) — 20 tests
cargo test --workspace

# Optimized WASM for deploy (soroban-sdk v25 → wasm32v1-none target)
stellar contract build           # uses the correct target automatically
# or manually:
rustup target add wasm32v1-none
cargo build --release --target wasm32v1-none

# Static analysis
cargo install cargo-scout-audit && cargo scout-audit
```

## Deploy order (testnet)

1. `verifier` (with the circuit's verifying key)
2. `policy` (ASP root + limits)
3. `market` (admin)
4. `clob-settlement` (admin, relayer, collateral SAC)
5. `privacy-pool` (admin, verifier id, collateral SAC)

Record contract IDs into `molfi-predict-app/.env` (`VITE_*_CONTRACT_ID`).
