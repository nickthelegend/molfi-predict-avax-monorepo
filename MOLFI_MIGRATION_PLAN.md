<div align="center">

# Molfi — Migration & Architecture Plan
### Private prediction markets on Stellar · `molfi.fun`

</div>

> Forked from the Predifi app architecture (React/Vite + Supabase + off-chain CLOB).
> This document is the agreed shape **before** we touch app code. Privacy is the headline
> feature; the CLOB prediction market is the substrate it runs on.

---

## 0. TL;DR

We are turning an EVM/Solana prediction-market app into a **Stellar/Soroban private prediction market**:

- **molfi-predict-landing** — Next.js marketing site (already branded `molfi`). Minimal change.
- **molfi-predict-app** — React/Vite trading app. Rip out `wagmi`/`viem`/`ethers`/Alchemy Account Kit/Dynamic-Labs (incl. Solana). Wire in **Stellar Wallets Kit** + `@stellar/stellar-sdk` + `@molfi/predict-sdk`.
- **molfi-predict-sdk** — `@molfi/predict-sdk`. Canonical CLOB order construction, signing, and **client-side ZK proof generation**.
- **molfi-contracts** *(new, Soroban/Rust)* — Market + CLOB settlement + **Groth16 verifier** + **Privacy Pool**.

**The hook:** positions are confidential. You can prove "I hold a valid YES position in market X and I'm exiting `n` shares" without revealing your full position or identity, using a Privacy-Pools-style commitment tree + on-chain Groth16 verification. Deposits/withdrawals are visible; in-pool trading is private.

---

## 1. Repository roles

| Repo | Stack | Role | Migration load |
|------|-------|------|----------------|
| `molfi-predict-landing` | Next.js 15, Tailwind | Marketing, waitlist, docs entry | **Low** — already `molfi`; refresh copy to "private prediction markets on Stellar" |
| `molfi-predict-app` | React 18 + Vite + shadcn/ui + Supabase | The trading dApp | **High** — full web3 layer swap |
| `molfi-predict-sdk` | TypeScript lib | Order signing + proof gen, shared by app/bots/3rd-parties | **New** — scaffolded |
| `molfi-contracts` | Rust + soroban-sdk | On-chain markets, settlement, ZK verifier, privacy pool | **New** — to scaffold |

---

## 2. Target architecture

```
                       molfi-predict-landing (Next.js)
                                   │  "Launch app"
                                   ▼
┌──────────────────────────── molfi-predict-app (React/Vite) ───────────────────────────┐
│  Stellar Wallets Kit  ──connect/sign──►  @molfi/predict-sdk                            │
│  (Freighter, xBull, …)                   • buildOrder / canonicalize                   │
│                                          • signOrder (ed25519 over canonical hash)     │
│                                          • generateExitProof (WASM, client-side)       │
│  React Query · shadcn/ui · Supabase (off-chain user/vault/notify data, edge fns)       │
└───────────────┬───────────────────────────────────────────────┬───────────────────────┘
                │ signed orders (REST/WS)                         │ signed Soroban txs / auth entries
                ▼                                                 ▼
        Matching API (off-chain CLOB)                      Stellar RPC (testnet → mainnet)
        • orderbook, matching, risk                               │
        • batches fills for settlement ──────────────────────────►│
                                                                  ▼
                              ┌────────────── molfi-contracts (Soroban) ──────────────┐
                              │  Market        — lifecycle, outcomes, resolution      │
                              │  CLOBSettlement — verify matched-order sigs, settle    │
                              │  Verifier      — Groth16 (BN254/BLS12-381) ONLY        │ ← narrow audit surface
                              │  PrivacyPool   — commitment Merkle tree, nullifiers    │
                              │  Policy        — compliance/ASP allow-deny, limits     │
                              └────────────────────────────────────────────────────────┘
```

Design rule from the ZK skill: **verifier / policy / application are separate contracts.** The verifier does cryptography only; policy does risk/compliance; the market/pool does state transitions after both pass.

---

## 3. EVM/Solana → Stellar mapping

| Today (Predifi) | Tomorrow (Molfi) | Notes |
|-----------------|------------------|-------|
| `wagmi` + `viem` | `@stellar/stellar-sdk` | tx build/submit, RPC |
| `ethers` (12 files) | `@stellar/stellar-sdk` + SDK helpers | centralize in SDK, not scattered |
| Alchemy Account Kit (`@account-kit/*`) | Stellar passkey smart wallets *(optional, stretch)* | start with key wallets |
| Dynamic Labs (`@dynamic-labs/*`, incl. **Solana**) | **Stellar Wallets Kit** | Freighter/xBull/Albedo/Lobstr/Hana unified API |
| EIP-712 order signing (`useEIP712Signature`) | ed25519 sign over canonical order hash | now lives in `@molfi/predict-sdk` |
| Solidity ^0.8.25 + OpenZeppelin UUPS | Rust + `soroban-sdk` + OZ Stellar contracts | upgradeable via Soroban WASM upgrade |
| Stork Oracle | Stellar oracle (Reflector / Charli3) or admin resolution for hackathon | resolution source for market settlement |
| GMX SDK (`@gmx-io/sdk`) | **remove** | perps integration is out of scope for v1 |
| Optimism / BSC chains | Stellar testnet → mainnet | single network |

**Solana removal is trivial:** the only chain-level coupling is the `@dynamic-labs/solana` dependency in `package.json`. The other `"Solana"` strings (`useArbitrage.ts`, `Dashboard.tsx`, `config/gmx.ts`) are just **market topics** ("Solana to flip BNB?") and are fine to keep as prediction content.

---

## 4. Privacy layer — the hook

Pattern: **Privacy Pools** (Buterin/Soleimani et al.), adapted to predictions. Reference PoC: Nethermind `stellar-private-payments` (Circom + Groth16 + Soroban; research-only, not audited).

**Flow:**
1. **Deposit (public):** trader deposits collateral (USDC classic asset) into `PrivacyPool`, which inserts a commitment `C = Poseidon(secret, nullifier, amount, market)` into a Merkle tree. The deposit is visible; the link to future positions is not.
2. **Trade (private):** orders carry a commitment to the position, not the identity. Matching happens off-chain on the CLOB; the SDK signs canonical orders.
3. **Exit / settle (private):** to withdraw winnings, the trader generates a **Groth16 proof** *client-side in WASM* proving:
   - knowledge of `(secret, nullifier)` for a commitment in the tree (Merkle membership),
   - the position resolved in-the-money for the market's outcome,
   - the nullifier is unspent,
   without revealing which deposit it was. `Verifier` checks the proof; `PrivacyPool` burns the nullifier and pays out.
4. **Compliance:** `Policy` holds an ASP (Association Set Provider) allow/deny root so the pool can stay compliant (the Privacy Pools thesis) — membership proofs gate deposits.

**Capability gate (from ZK skill — must verify at deploy):**
- BN254 → CAP-0074, Poseidon/Poseidon2 → CAP-0075 (landed via Protocol 25 "X-Ray"; cheaper in Protocol 26 "Yardstick").
- BLS12-381 → CAP-0059.
- Pin `soroban-sdk` to a release exposing the chosen curve's host functions; confirm testnet protocol version before relying on it.
- Every proof statement **binds a nonce/market/action** for anti-replay; nullifiers persist as replay guards.

**Circuit tooling decision (to confirm):** Circom+Groth16 (closest to the Nethermind PoC, fastest to copy) vs Noir/UltraHonk (cheaper post-P26, friendlier DSL). Default recommendation: **Circom + Groth16** to reuse the PoC, with the Groth16 verifier example as the contract base.

---

## 5. `@molfi/predict-sdk` (scaffolded)

Already created: `buildOrder`, `canonicalize`, `MolfiClient.signOrder/submitOrder`, types, `Signer` interface.

**Next additions:**
- `StellarKeypairSigner` and `WalletsKitSigner` implementing `Signer` (ed25519).
- `generateExitProof(input)` — wraps the WASM prover (snarkjs/Circom artifacts) for client-side proof gen.
- `buildSettlementTx` / `buildExitTx` — assemble Soroban invocations + auth entries.
- Replace placeholder SHA-256 order hash with **Poseidon** so the same hash is reproducible inside the circuit and on-chain.

---

## 6. `molfi-contracts` (Soroban, to scaffold)

```
molfi-contracts/
├── Cargo.toml                 # workspace
├── contracts/
│   ├── market/                # lifecycle: create, trade-window, resolve, payout-ratio
│   ├── clob-settlement/       # verify maker/taker sigs, move collateral, settle fills
│   ├── verifier/              # Groth16 verify ONLY (BN254 or BLS12-381) — narrow audit
│   ├── privacy-pool/          # commitment Merkle tree + nullifier set + deposit/exit
│   └── policy/                # ASP allow/deny root, position/risk limits
└── ...
```
Fork the [`groth16_verifier` Soroban example](https://github.com/stellar/soroban-examples/tree/main/groth16_verifier) for `verifier`. Use OpenZeppelin Stellar contracts for ownable/upgradeable/pausable scaffolding (`openzeppelin-skills:setup-stellar-contracts`).

---

## 7. Phased roadmap

**Phase 0 — Workspace (DONE)**
- [x] Clone landing, copy app → `molfi-predict-app`, scaffold `molfi-predict-sdk`, write this plan.

**Phase 1 — De-EVM the app**
- [ ] Strip `wagmi`, `viem`, `ethers`, `@account-kit/*`, `@dynamic-labs/*` (incl. solana), `@gmx-io/sdk`, GMX services/pages from `package.json` + `src`.
- [ ] Replace `PredifiWalletContext` → `MolfiWalletContext` backed by **Stellar Wallets Kit**.
- [ ] Rebrand: name, logo, copy, `molfi.fun`, env keys (`VITE_STELLAR_*`).
- [ ] App builds & runs with a connect-wallet flow on testnet. *(Compiles green = gate.)*

**Phase 2 — On-chain core**
- [ ] Scaffold `molfi-contracts`: `market` + `clob-settlement`, deploy to testnet via `stellar` CLI.
- [ ] SDK: `WalletsKitSigner`, `buildSettlementTx`; app places a real (public) order end-to-end.

**Phase 3 — Privacy layer (the hook)**
- [ ] `verifier` (fork Groth16 example) + `privacy-pool` (commitment tree + nullifiers) + `policy`.
- [ ] Circom circuit + WASM prover; SDK `generateExitProof`; Poseidon order/commitment hashing.
- [ ] Confidential deposit → private exit demo flow in the app.

**Phase 4 — Polish for demo**
- [ ] Negative-path tests (tampered proof, stale nonce, double-spend nullifier).
- [ ] Landing page + app + a 90s demo. Deploy checklist via `deploy-stellar-mainnet` skill.

---

## 8. Open questions

1. **Circuit stack:** Circom+Groth16 (reuse Nethermind PoC) vs Noir/UltraHonk (cheaper post-P26)? *Default: Circom+Groth16.*
2. **Collateral asset:** testnet USDC (classic asset / SAC) vs a mock token? *Default: SAC-wrapped test USDC.*
3. **Resolution oracle:** admin-resolved for the hackathon vs Reflector/Charli3 oracle? *Default: admin-resolved v1, oracle as stretch.*
4. **Smart wallets / passkeys:** start with key wallets (Freighter etc.) and add passkey smart accounts later? *Default: yes, key wallets first.*
5. **Matching engine:** reuse Predifi's off-chain CLOB API as-is (just re-point), or stub a minimal matcher? *Need to confirm what API the app currently calls.*
