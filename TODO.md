# Molfi TODO

Granular checklist. Phases mirror [`ROADMAP.md`](ROADMAP.md).

## Phase 0 — Workspace ✅
- [x] Clone landing → `molfi-predict-landing`
- [x] Copy predifi app → `molfi-predict-app`
- [x] Scaffold `@molfi/predict-sdk` (buildOrder, canonicalize, MolfiClient, types)
- [x] Write `MOLFI_MIGRATION_PLAN.md`, `ROADMAP.md`, `TODO.md`

## Phase 1 — De-EVM the app 🔨
**Dependencies**
- [ ] `package.json`: remove `@dynamic-labs/ethereum`, `@dynamic-labs/sdk-react-core`, `@dynamic-labs/solana`
- [ ] `package.json`: add `@creit.tech/stellar-wallets-kit`, `@stellar/stellar-sdk`, `@molfi/predict-sdk`
- [ ] `npm install` (or bun) — confirm lockfile resolves

**Wallet layer**
- [ ] `src/lib/stellar/walletKit.ts` — Wallets Kit singleton (testnet, allowAllModules)
- [ ] Rewrite `src/hooks/useWallet.ts` → Wallets Kit (address `G…`, isConnected, connect, disconnect, signTransaction; compat shims for chain/getSigner)
- [ ] `src/components/WalletButton.tsx` — replace `DynamicWidget` with Stellar connect/disconnect button

**Remove remaining `@dynamic-labs` imports (6 files total)**
- [ ] `src/App.tsx` — drop `DynamicContextProvider` + `EthereumWalletConnectors`
- [ ] `src/hooks/useTransactions.ts` — drop `useDynamicContext` / `isEthereumWallet`
- [ ] `src/hooks/useRouterAccount.ts` — stub to inert Stellar-friendly state (no CREATE2 router)
- [ ] `src/pages/MobileAuthBridge.tsx` — drop `useDynamicContext`

**Signing**
- [ ] `src/hooks/useEIP712Signature.ts` — rewire to `@molfi/predict-sdk` (keep hook shape) or stub

**Rebrand shell**
- [ ] `index.html` — title/meta/OG → Molfi
- [ ] App name + visible "Predifi" strings → "Molfi"
- [ ] `.env.template` — `VITE_STELLAR_NETWORK`, `VITE_STELLAR_RPC_URL`, drop Dynamic/EVM keys

**Gate**
- [ ] App builds green (`npm run build`)
- [ ] Connect a testnet wallet (Freighter) end-to-end in dev

## Phase 2 — On-chain core
- [x] Scaffold `molfi-contracts` workspace (Cargo) + `market`, `clob-settlement`
- [x] Wire settlement flow: `deposit` (account model) → `settle` (ed25519 + nonce guards + escrow + positions) → `redeem` (market outcome cross-call + ZK proof + payout)
- [x] Cross-contract wiring: settlement→market (`winning_outcome`), settlement→verifier, market→verifier (`resolve_with_proof`)
- [x] `cargo test` green: 12 tests (5 unit suites + e2e integration incl. bet→settle→win)
- [x] WASM build for all 5 contracts
- [x] **Deployed all 5 to Stellar testnet** + ran ZK withdrawal & market lifecycle on-chain (IDs + tx hashes in top-level README.md / molfi-contracts/deploy/testnet.env)
- [x] **Full BTC market bet on testnet** (Alice YES vs Bob NO): deposit → settle (real ed25519 orders) → resolve → redeem; Alice won the pot, Bob's claim rejected
- [x] Simplified `clob.redeem` to outcome+position (CLOB is the transparent venue; ZK lives in the pool) — removed the unneeded proof gate
- [x] **Frontend wired to live contracts** — `/demo` page reads market outcome + submits a deposit tx via Stellar Wallets Kit (`src/services/soroban.ts`, `src/config/molfi.ts`, `src/pages/MolfiDemo.tsx`)
- [ ] Wire the remaining trading screens to the contracts; remove residual `wagmi`/`viem`/`ethers`/`@gmx-io` + GMX UI

## Phase 2.5 — Oracle resolution (BTC & price markets) ✅
- [x] SEP-40 (Reflector-compatible) `Asset`/`PriceData` types + `OracleClient` in `market`
- [x] `create_price_market` + permissionless `resolve_from_oracle` (price vs threshold, staleness guard)
- [x] Kept admin `resolve` + ZK `resolve_with_proof` paths
- [x] Integration tests: BTC≥100k oracle settlement pays winner, NO case, stale-price rejection
- [ ] Point at real Reflector testnet oracle address on deploy

## Phase 3 — Privacy layer (the hook)
- [x] `verifier` contract — Groth16 over BLS12-381, domain-bound, admin VK
- [x] `privacy-pool` — commitment Merkle tree + nullifier set, verifier cross-call
- [x] `policy` — ASP allow-list root + deposit limits
- [x] **Real Circom circuits + BLS12-381 Groth16 keys** (`molfi-circuits/`): `solvency` (balance≥threshold, balance hidden) + `mul` canary
- [x] **Real proof verifies on `molfi-verifier` on-chain** (replaces mock): `real_proof.rs` — genuine proof accepted, tampered input rejected. G2 encoding = `c1‖c0`.
- [x] snarkjs→Soroban byte converter (`scripts/to_soroban.mjs`)
- [x] **Poseidon Merkle-membership + nullifier circuit** (`withdraw.circom`, depth 8); root/nullifierHash as outputs so no field-specific JS hashing needed
- [x] **Real membership proof verifies on `molfi-verifier`** (`real_proof.rs::real_membership_proof_verifies_on_chain`)
- [x] Bumped soroban-sdk **v22 → v25** (non-breaking; BN254 now available, Poseidon host fn still not shipped)
- [x] **`privacy-pool.withdraw` routes the REAL proof end-to-end** — `register_root` (off-chain Poseidon tree checkpoint) + verify via real verifier + nullifier burn + payout. Test: `e2e.rs::confidential_withdraw_with_real_proof` (deposit→register→withdraw→paid, double-spend rejected).
- [ ] On-chain Poseidon tree (remove the off-chain root-registration trust) — blocked on Poseidon host fn (CAP-0075); BN254 verifier variant can land first since BN254 host fns are in v25
- [x] Bind **amount** in the pool — `withdraw` requires the proof's amount signal == payout; `AmountMismatch` rejects mismatches (tested)
- [ ] Bind **recipient** in the pool (front-running guard) — intrinsically client-side: the prover sets `recipient = H(withdrawal address)`, so this lands with `generateExitProof`
- [x] SDK: contract-aligned CLOB order signing — `signClobOrder` byte-matches `clob-settlement::canonical_order_bytes`; `StellarKeypairSigner` (ed25519)
- [ ] SDK `generateExitProof` (wrap snarkjs/wasm prover) so the app produces proofs client-side
- [ ] App: confidential deposit → private exit flow

## Phase 4 — Demo polish
- [ ] Negative-path tests (tampered proof, stale nonce, double-spend nullifier)
- [ ] Resolution oracle decision (admin v1 vs Reflector/Charli3)
- [ ] Landing copy + app polish + 90s demo
- [ ] Mainnet checklist (`deploy-stellar-mainnet`)

## Open decisions (defaults in plan §8)
- [ ] Circuit stack: Circom+Groth16 *(default)* vs Noir/UltraHonk
- [ ] Collateral: SAC test USDC *(default)* vs mock token
- [ ] Resolution: admin v1 *(default)* vs oracle
- [ ] Matching engine: re-point Predifi CLOB API vs stub — **need to confirm current API**
