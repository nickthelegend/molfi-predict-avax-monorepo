# Testing — Molfi (Avalanche Fuji)

Molfi is private, agent-native prediction markets on Avalanche: confidential
stakes (eERC), a hidden bet side proved via ZK (BN254 Groth16), markets
resolved from Chainlink price feeds, and an SDK/agent that trades the whole
flow. This document is the reproducible test matrix for judges — exact
commands, exact expected counts, and what each layer does and doesn't
exercise live.

## Node version — read this first

Use **Node 22**. Node 25 (the default on some machines) breaks the native
`node --test` / build tooling used here.

```bash
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22
```

Run this once per shell before any `npm test` / `npm install` below.

## At a glance

| Package | Runner | Command | Result |
|---|---|---|---|
| `molfi-contracts` | Foundry | `forge test` | **33/33 passing** |
| `molfi-app` | vitest | `npm test` | **55 passing, 4 skipped** (live e2e, opt-in) |
| `molfi-backend` | `node --test` | `npm test` | **18/18 passing** |
| `molfi-predict-sdk` | `node --test` | `npm test` | **11/11 passing** |

Everything above runs offline, deterministically, with no funded wallet and
no external services (Mongo is spun up in-memory for the backend suite).
Live-chain paths are separate, opt-in commands, documented below.

---

## `molfi-contracts` — Foundry (Solidity)

```bash
cd molfi-contracts
forge test
```

**33/33 tests pass**, split across two files:

- **`test/Molfi.t.sol` (6 tests)** — the core happy paths:
  - `test_ChainlinkResolvesYesAndConfidentialClaimPays` — creates a
    Chainlink-fed price market (mocked `AggregatorV3`), resolves it
    permissionlessly, then claims a `ConfidentialBet` payout using a **real
    BN254 Groth16 proof** (checked into the test as calldata exported from
    `molfi-circuits`, not a stub) — proving the hidden side matched the
    Chainlink-resolved winner, 2× payout, nullifier burned.
  - `test_ReplayRejected` — the same proof/nullifier can't claim twice.
  - `test_LoserCannotClaim` — resolving the market to the opposite outcome
    makes the same proof fail verification (the contract injects the
    on-chain winner as a public input, so a losing note's proof can't verify).
  - `test_StaleFeedRejected` — a Chainlink answer older than the market's
    staleness window reverts resolution.
  - `test_MarketEnumeration` — markets are listable and queryable.
  - `test_PredictEscrowPariMutuel` — the public (non-confidential)
    `PredictEscrow` pari-mutuel path: two bettors, Chainlink resolution, a
    winner redeeming pool-minus-2%-fee, and a loser's redeem reverting.

- **`test/MolfiEdgeCases.t.sol` (27 tests)** — edge cases and guards across
  `ConfidentialBet`, `MolfiMarket`, `PredictEscrow`, and `MockUSD`:
  - ZK path: `test_BetZkAcceptsValidProofAndEscrows` (real proof again),
    `test_BetZkRejectsReusedNullifier`,
    `test_BetZkRejectsBadProof_WrongOutcome`,
    `test_BetZkRejectsBadProof_WrongRecipientField`.
  - Fund conservation: `test_MultiBettorPariMutuelExactVaultSplit` (3
    bettors, exact accounting), `test_DoubleRedeemReverts`,
    `test_RedeemBeforeResolutionReverts`.
  - Input guards: `test_BetZeroAmountReverts`,
    `test_BetWithoutApprovalReverts`,
    `test_BetOnNonexistentMarketStillEscrows`.
  - `MockUSD` ERC-20 semantics: approve/allowance/transferFrom, over-allowance
    reverts, infinite-approval never decrementing, insufficient-balance
    reverts (4 tests).
  - `MolfiMarket`/admin guards: non-admin create/resolve reverts, duplicate
    market creation reverts, resolve-before-close / already-resolved /
    missing-market reverts, admin-resolve fallback path, unresolved-market
    query reverts, missing-market query reverts (the remaining tests).

These are genuine unit + integration tests against real contract bytecode via
`forge test` (Foundry's EVM), including one real (non-mocked) Groth16 proof
verification per bet path — not stubs of the verifier.

---

## `molfi-app` — vitest (frontend chain layer + adapters)

```bash
cd molfi-app
npm test          # vitest run — offline, deterministic
```

**55 passing, 4 skipped.** The 4 skipped tests are a single file,
`src/lib/stellar/onchain.e2e.spec.ts` (name is a holdover from the Stellar
build; contents are pure viem/Fuji), and they are **the live e2e** — see
below.

Covered by the 55 offline tests:
- `src/lib/molfi-backend.spec.ts` (142 lines) — the app's client for the
  Molfi backend REST API.
- `src/lib/stellar/market-adapter.spec.ts` (79 lines) — mapping on-chain /
  backend market shapes into UI view-models.
- `src/lib/leverx/position-action-availability.spec.ts` and
  `position-metrics.spec.ts` — pre-existing LeverX (perps) UI logic, unit
  tested, untouched by the Fuji migration.

### Live e2e (opt-in, needs a funded Fuji key)

```bash
cd molfi-app
VITE_MOLFI_E2E_KEY=0x<funded Fuji admin key> npm run test:e2e
```

This drives the app's **own** chain functions (the same code the trading UI
calls) through a full round trip against the **real deployed contracts on
Fuji**: faucet mUSDC → escrow a bet → admin resolves from the **live**
Chainlink BTC/USD feed → read pool/position/outcome → redeem the pari-mutuel
payout. The key must be the `MolfiMarket` admin (so it can resolve/faucet).
Without `VITE_MOLFI_E2E_KEY` set, `npm test` skips this file cleanly and stays
green. **Verified 4/4 passing live** against Fuji for this submission.

---

## `molfi-backend` — `node --test` (market engine + Chainlink polling + ZK)

```bash
cd molfi-backend
npm test
# → node --test --test-concurrency=1 --test-force-exit "test/**/*.test.mjs"
```

**18/18 tests pass**, across `test/zk.test.mjs` and `test/api.test.mjs`,
using a shared harness in `test/helpers.mjs`:

- **Storage is real, in-memory**: `mongodb-memory-server` boots a real
  `mongod` in-process — no external database is required to run the test
  suite. A single shared instance is reused across the run for speed; each
  boot gets its own uniquely-named database for isolation.
- **Chain reads are mocked in these tests** — `helpers.mjs` exports
  `mockChain()`, a deterministic stand-in for the backend's `chain.js` (no
  RPC calls, no transactions ever broadcast). This is intentional: the
  backend's REST/API tests are about the market engine and HTTP surface, not
  about re-proving live Fuji connectivity — that's what `molfi-app`'s live
  e2e (above) and the agent demo (below) exercise against the real chain.
- **ZK proof generation is real, not mocked.** `test/zk.test.mjs` calls the
  actual `zk.js` module, which drives `snarkjs` against the compiled BN254
  `confidential_bet` circuit to produce a genuine Groth16 proof (same shape
  as the on-chain verifier expects: `a[2]`, `b[2][2]`, `c[2]`, and public
  signals `[root, nullifierHash, outcome, recipient]`). These tests
  self-skip cleanly if the circuit artifacts haven't been built
  (`zk.circuitAvailable()` guards them) — they are not silently faked.

### Running the backend live

The test suite needs nothing beyond Node — no `.env`, no external Mongo. To
run the **server** itself (not tests), it needs a real MongoDB:

```bash
cd molfi-backend
cp .env.example .env      # set MONGODB_URI (see below), then:
npm start
```

`.env.example` documents every variable; the important one for standing the
server up is:

```
MONGODB_URI=mongodb://localhost:27017
```

All Fuji contract addresses and Chainlink feed addresses are pre-filled with
the live deployment (see the deployed-addresses table below) — override only
if you redeploy.

### Known quirk

`snarkjs`'s Groth16 proving uses worker threads, and `mongodb-memory-server`
spawns a `mongod` child process — between the two, the Node process can
refuse to exit on its own after the last test finishes. The backend's `test`
script already wires around this with `--test-force-exit`
(`node --test --test-concurrency=1 --test-force-exit ...`); if you ever
invoke `node --test` directly on this package without that flag, expect the
run to hang after the final assertion instead of returning.

---

## `molfi-predict-sdk` — `node --test` (viem SDK + agent)

```bash
cd molfi-predict-sdk
npm run build   # tsc — clean, no errors
npm test        # → npm run build && node --test "test/**/*.test.mjs"
```

**11/11 tests pass** (`test/sdk.test.mjs`), all pure/offline unit tests of
the SDK's exported helpers — no network, no chain: `TESTNET` config
(chain id 43113, 7-decimal `mUSDC`, deployed contract addresses, Chainlink
feeds), `toBaseUnits`/`fromBaseUnits` conversion and rounding/truncation
behavior, outcome constants, wallet generation, CLOB order building and
canonicalization, and order signing (`PrivateKeyOrderSigner`).

`npm run build` (`tsc -p tsconfig.json`) is clean with no type errors.

### Live agent demo (opt-in, needs a funded Fuji key)

```bash
cd molfi-predict-sdk
OPERATOR_KEY=0x<funded Fuji key> node demo/agent-confidential-bet.mjs
# equivalently: OPERATOR_KEY=0x... npm run agent:demo
```

An autonomous agent, with no human in the loop, drives the full confidential
flow against the real deployed contracts on Fuji: spins up a fresh EVM
wallet, generates a real Groth16 proof for a **hidden** YES/NO side
(`snarkjs` against the compiled `confidential_bet` circuit), commits the bet
on-chain (only the opaque commitment is visible), waits for the market to
resolve from the **live** Chainlink BTC/USD feed, then claims its winnings by
proving in zero knowledge that its note backed the resolved winner — 2×
payout, side never revealed on-chain. **Verified live** for this submission;
example transactions are linked in the root `README.md`.

---

## Unit vs. integration vs. live — summary

| Kind | Where | Touches real chain? | Real ZK proof? | Real DB? |
|---|---|---|---|---|
| Unit | `molfi-predict-sdk/test`, `molfi-app` leverx specs | No | No | N/A |
| Integration (mocked chain, real DB, real proof) | `molfi-backend/test` | No (chain reads mocked) | Yes (BN254 via snarkjs) | Yes (in-memory Mongo) |
| Integration (real EVM, mocked-only where noted) | `molfi-contracts` (`forge test`) | Runs against Foundry's local EVM with real bytecode; Chainlink feed is a local mock aggregator | Yes (real Groth16 proof/calldata) | N/A |
| Live e2e | `molfi-app npm run test:e2e`, `molfi-predict-sdk` agent demo | **Yes** — real Fuji RPC, real deployed contracts, real Chainlink feed | Yes | N/A |

The honest summary judges should take away: everything that can be
deterministic and offline (unit tests, the backend's API/DB layer, the ZK
proving math itself) is tested that way and passes at 100%. The two things
that require a live network — reading/writing the real chain end-to-end, and
an autonomous agent completing a real bet-resolve-claim cycle — are each
covered by a dedicated opt-in live test/demo, and both have been run and
verified against Fuji for this submission (transaction links in the root
`README.md`).

---

## Deployed contracts (Avalanche Fuji, chain id 43113)

Source of truth: `molfi-contracts/deployments-fuji.json`.

| Contract | Address |
|---|---|
| `MolfiMarket` | `0xBded9535cbe128f09A8CC1a97dDFb339f22CBc9b` |
| `PredictEscrow` | `0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c` |
| `ConfidentialBet` | `0x5DAFB4217088dFB79dee6d780ED7437DC9D42E84` |
| `mUSDC` (collateral) | `0xADE818616EA14903278E9cE11c2BfFfa4eEB682C` |
| `confidentialBetVerifier` (Groth16, BN254) | `0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB` |
| eERC `cUSD` (confidential stakes) | `0x320C389607d109B12836D6B8F507C7e87783cf82` |
| eERC registrar | `0x098561944b2437288Fe98d3F5FA824868899104a` |
| Chainlink BTC/USD | `0x31CF013A08c6Ac228C94551d535d5BAfE19c602a` |
| Chainlink ETH/USD | `0x86d67c3D38D2bCeE722E601025C25a575021c6EA` |
| Chainlink AVAX/USD | `0x5498BB86BC934c8D34FDA08E81D444153d0D06aD` |
| Chainlink LINK/USD | `0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470` |

Explorer: https://testnet.snowtrace.io. Testnet only — not audited.
