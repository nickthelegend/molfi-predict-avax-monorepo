<div align="center">

# 🟣 Molfi

### Private, agent-native prediction markets on **Avalanche**

[![Avalanche](https://img.shields.io/badge/Avalanche-Fuji-e84142?logo=avalanche&logoColor=white)](https://www.avax.network)
[![eERC](https://img.shields.io/badge/eERC-Encrypted_ERC-a855f7)](https://github.com/ava-labs/EncryptedERC)
[![ZK](https://img.shields.io/badge/ZK-Groth16%20·%20BN254-9a6bff)](#)
[![Chainlink](https://img.shields.io/badge/Oracle-Chainlink-375bd2?logo=chainlink&logoColor=white)](https://chain.link)

**Bet on real-world outcomes — your _side_ stays hidden on-chain (ZK) and your
_stake_ is confidential (eERC). Markets resolve from Chainlink. AI agents trade
the whole thing from a single skill file, no human in the loop.**

</div>

---

## Built for the Avalanche "Privacy" Speedrun

Molfi already existed on **Stellar/Soroban**. **For this Speedrun we migrated the
whole thing to Avalanche** and made privacy the point — using the hackathon's
preferred primitive, **eERC**, plus on-chain ZK and Chainlink.

### The delta (what's new for the Speedrun)

| Layer | Was (Stellar) | Now (Avalanche) |
|---|---|---|
| **Curve** | BLS12-381 (CAP-0059) | **BN254** — recompiled circuits, EVM precompiles |
| **Verifier** | Soroban Rust (BLS12-381) | **Solidity `Groth16Verifier`** (exported from the circuit) |
| **Market / bet / escrow** | Soroban Rust | **Solidity** (`MolfiMarket`, `ConfidentialBet`) |
| **Confidential stake** | mUSDC (public) | **eERC `cUSD`** — encrypted balances/amounts |
| **Oracle** | Reflector SEP-40 | **Chainlink** Data Feeds (`AggregatorV3`) |
| **SDK / agent** | `@stellar/stellar-sdk` | **viem** + `snarkjs`; one `SKILL.md` |

## Two kinds of privacy, both live

- **Side hidden (ZK)** — you commit `Poseidon(secret, nullifier, side)`; your
  YES/NO never touches the chain. To win you prove in zero knowledge that your
  note backed the **Chainlink-resolved** winner (the contract injects the winner
  as a public input, so losers can't prove). Nullifier burned; payout unlinkable.
- **Amount hidden (eERC)** — the stake token `cUSD` is a real **Encrypted ERC**:
  balances and transfer amounts are encrypted on-chain (BabyJubJub · ElGamal ·
  Groth16). Fixed-denomination bets keep pari-mutuel accounting working while the
  size stays private.

## 🤖 An agent bets — no human

```bash
cd molfi-predict-sdk
OPERATOR_KEY=0x<funded Fuji key> npm run agent:demo
```

A fresh agent wallet is funded, **generates a Groth16 proof for a hidden side**,
commits the bet, the market **resolves from the live Chainlink BTC/USD feed**, and
the agent **claims its winnings** — all on Fuji, side never revealed.

## Proven live on Avalanche Fuji (Snowtrace)

- Confidential claim (hidden side, ZK-verified, Chainlink-resolved): [`0xf261273e…`](https://testnet.snowtrace.io/tx/0xf261273e7f8b537d9795a7ad963ae37d55376183ba507679a05b747165112e08)
- Market resolved from **Chainlink**: [`0x6ab6d118…`](https://testnet.snowtrace.io/tx/0x6ab6d11897e2b16b52fd50300fa39360a3dc3302cc6a6e136ed4bab7fc162e64)
- Hidden bet committed: [`0x0c81ed4b…`](https://testnet.snowtrace.io/tx/0x0c81ed4bac2badb1ba3c912c3d243a759b2ea5f12528cbc2a9e1cdbc9aaf69a8)

**Tests, all green:** `molfi-contracts` **33/33** (`forge test`) ·
`molfi-app` **55 passing + 4 skipped** (`npm test`; the 4 are the live e2e,
opt-in with a funded Fuji key) · `molfi-backend` **18/18** (`npm test`) ·
`molfi-predict-sdk` **11/11** (`npm test`). Confidential-bet claims (contracts
and backend) are checked against a **real BN254 Groth16 proof**, not a stub.
Full reproducible matrix, exact commands, and the live-vs-mocked breakdown:
see [`TESTING.md`](./TESTING.md).

## Deployed (Fuji 43113)

| Contract | Address |
|---|---|
| `MolfiMarket` (Chainlink-resolved, enumerable) | [`0xBded9535cbe128f09A8CC1a97dDFb339f22CBc9b`](https://testnet.snowtrace.io/address/0xBded9535cbe128f09A8CC1a97dDFb339f22CBc9b) |
| `PredictEscrow` (real-mUSDC pari-mutuel + ZK-gated bets) | [`0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c`](https://testnet.snowtrace.io/address/0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c) |
| `ConfidentialBet` (hidden side + ZK claim) | [`0x5DAFB4217088dFB79dee6d780ED7437DC9D42E84`](https://testnet.snowtrace.io/address/0x5DAFB4217088dFB79dee6d780ED7437DC9D42E84) |
| Groth16 verifier (BN254) | `0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB` |
| `mUSDC` collateral | `0xADE818616EA14903278E9cE11c2BfFfa4eEB682C` |
| **eERC `cUSD`** (confidential stakes) | `0x320C389607d109B12836D6B8F507C7e87783cf82` |
| Chainlink BTC/USD feed | `0x31CF013A08c6Ac228C94551d535d5BAfE19c602a` |

## Repo layout

```
molfi-circuits/         Circom circuits (recompiled to BN254) + Solidity verifier export
molfi-contracts/        Foundry: MolfiMarket · ConfidentialBet · verifier (Soroban kept in soroban-legacy/)
molfi-predict-sdk/      viem SDK + agent + SKILL.md (demo/agent-confidential-bet.mjs)
molfi-app/              React/Vite trading UI (premium components preserved; chain layer → Fuji; RainbowKit connect)
molfi-backend/          market engine + Chainlink price polling (Express + MongoDB)
molfi-predict-landing/  marketing site (Next.js)
```

See [`TESTING.md`](./TESTING.md) for what's tested where.

Testnet only · not audited. Circuit artifacts are rebuilt with
`cd molfi-circuits && bash scripts/build-bn254.sh confidential_bet 14`.
</div>
