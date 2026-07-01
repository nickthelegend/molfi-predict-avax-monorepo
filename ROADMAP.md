# Molfi Roadmap

> Private prediction markets on Stellar · `molfi.fun`
> Companion to [`MOLFI_MIGRATION_PLAN.md`](MOLFI_MIGRATION_PLAN.md). High-level phases here; granular tasks in [`TODO.md`](TODO.md).

## Vision
A Polymarket-style CLOB prediction market on Stellar/Soroban where **positions are confidential** — prove a valid, in-the-money position and exit without revealing identity or full holdings (Privacy-Pools pattern + on-chain Groth16 verification).

## Status at a glance
20 contract tests passing (`cargo test`); all 5 contracts build to WASM
(soroban-sdk **v25**, `wasm32v1-none`); **all 5 contracts deployed to Stellar
testnet** with a **real Groth16 proof verified on-chain** and a confidential
deposit→withdraw flow run end-to-end (real tx IDs in the top-level
[`README.md`](README.md)); oracle settlement works; the app builds on Stellar
Wallets Kit.

## Phases

### ✅ Phase 0 — Workspace
Cloned landing, copied app → `molfi-predict-app`, scaffolded `@molfi/predict-sdk`, wrote migration plan.

### ✅ Phase 1 — De-EVM the app
`molfi-predict-app` is a Stellar app: Dynamic Labs + Solana removed, **Stellar Wallets Kit** wired through a single reactive `useWallet`, EVM-only infra stubbed, shell rebranded. Builds green. *(Residual `wagmi`/`viem`/`ethers`/`@gmx-io` removal is Phase 2 cleanup.)*

### ✅ Phase 2 — On-chain core *(contracts done; deploy pending)*
- `molfi-contracts` workspace: `verifier`, `privacy-pool`, `market`, `clob-settlement`, `policy` — security-hardened, WASM-built.
- **Settlement wired**: `deposit` (account model) → `settle` (ed25519 + nonce guards + escrow + positions) → `redeem` (market + verifier cross-calls + payout). E2e test bets, settles, and pays the winner.
- ⏳ Pending: testnet deploy; SDK `WalletsKitSigner`/`buildSettlementTx`; remove residual EVM deps + GMX UI.

### ✅ Phase 2.5 — Oracle resolution (BTC & price markets)
- SEP-40 / **Reflector-compatible** oracle interface in `market`.
- `create_price_market` + permissionless `resolve_from_oracle` (price vs threshold + staleness), alongside admin and ZK resolution paths.
- E2e tests: BTC ≥ $100k settles from the oracle and pays the winner; NO case; stale-price rejection.

### ✅ Phase 3 — Privacy layer (the hook) *(real proof routed end-to-end)*
- ✅ `verifier` (Groth16 / BLS12-381), `privacy-pool` (commitment tree + nullifiers + `register_root`), `policy` (ASP membership).
- ✅ **Real circom + snarkjs (BLS12-381) pipeline** in `molfi-circuits/`: `solvency` (balance ≥ threshold, hidden) and `withdraw` (Poseidon Merkle membership + nullifier).
- ✅ **Real proofs verify on-chain** on `molfi-verifier` (`real_proof.rs`): solvency + membership accepted, tampered rejected.
- ✅ **`privacy-pool.withdraw` gated by a real proof end-to-end** (`confidential_withdraw_with_real_proof`): deposit → operator checkpoints root → withdraw unlocked by genuine proof → nullifier burned → double-spend rejected.
- ✅ Bumped soroban-sdk **v25** (BN254 host fns now available for a future BN254 verifier).
- ⏳ Pending: on-chain Poseidon tree to retire off-chain `register_root` (needs Poseidon host fn / CAP-0075, not yet shipped); cryptographic recipient/amount binding; SDK `generateExitProof`; app confidential deposit→exit flow.

### Phase 4 — Demo polish
- Negative-path tests (tampered proof ✅, stale nonce ✅, double-spend nullifier ✅) — expand coverage.
- Landing + app + 90s demo. Mainnet checklist via `deploy-stellar-mainnet` skill.

## Repos
| Repo | Role | Status |
|------|------|--------|
| `molfi-predict-landing` | Marketing site (Next.js) | copy refresh pending |
| `molfi-predict-app` | Trading dApp (React/Vite) | P1 ✅; SDK wiring pending |
| `molfi-predict-sdk` | Order signing + proof gen (TS) | scaffolded; signer/proof wiring pending |
| `molfi-contracts` | Soroban contracts (Rust) | P2/2.5 ✅, P3 proofs ✅ |
| `molfi-circuits` | Circom + Groth16 (BLS12-381) | `solvency`, `withdraw` ✅ |
