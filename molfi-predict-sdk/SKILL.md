---
name: molfi-confidential-bet
description: Bet privately on Molfi prediction markets on Avalanche — your side stays hidden (ZK), stakes are confidential (eERC), markets resolve from Chainlink. An AI agent can run the whole lifecycle autonomously.
---

# Molfi — confidential, agent-native prediction markets on Avalanche

You (an AI agent) can bet on real-world outcomes where **your side (YES/NO) never
touches the chain** and your **stake amount is confidential**. Markets resolve
from a **Chainlink** price feed. Everything is on **Avalanche Fuji**.

## What stays private
- **Side** — hidden behind a Poseidon commitment; you claim your win with a
  zero-knowledge Groth16 proof, unlinkable to your bet.
- **Amount** — held as a confidential **eERC** balance (`cUSD`); bets are a fixed
  denomination so pari-mutuel accounting works without leaking size.

## The lifecycle (one flow, no human)

1. **Wallet** — create a fresh EVM key; get funded with a little AVAX (gas) and
   `mUSDC` (bankroll). Optionally hold your bankroll as confidential eERC `cUSD`.
2. **Prove your side** — pick YES(0) or NO(1). Generate a Groth16 proof
   (`confidential_bet` circuit, BN254) that a note with your side exists; the
   side is a *private* input, never revealed. Public signals:
   `[root, nullifierHash, outcome, recipient]`.
3. **Commit** — `approve(mUSDC)` then `ConfidentialBet.commit(commitment)` to
   escrow the fixed denom. The side is not on-chain.
4. **Resolve** — after close, anyone calls `MolfiMarket.resolveFromOracle(id)`;
   it reads the Chainlink feed (`latestRoundData`, freshness-checked) and sets the
   winner.
5. **Claim** — `ConfidentialBet.claim(id, a, b, c, root, nullifierHash, you)`.
   The contract injects the resolved winner as a public input, so a losing note
   can't prove. The nullifier is burned; you're paid, unlinkable to your bet.

## Run it

```bash
OPERATOR_KEY=0x<funded Fuji key> npm run agent:demo
```

`demo/agent-confidential-bet.mjs` is a complete, self-contained agent that does
all five steps live on Fuji and prints the Snowtrace transactions. It uses only
`viem` + `snarkjs` and the built circuit artifacts in
`molfi-circuits/build/confidential_bet/`.

## Contracts (Fuji 43113)
- `MolfiMarket` `0xF260A7a44c7e6868D124dFcC4F13982C2eF42f8f` — Chainlink-resolved markets (enumerable)
- `PredictEscrow` `0xBeA24615324465bc0e7227AcaA1F539533165EEF` — real-mUSDC pari-mutuel + ZK-gated bets
- `ConfidentialBet` `0xEd1db687779eE2646162b70Bd3838AF8f4EeF6B3` — hidden-side bets + ZK claim
- Groth16 verifier `0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB`
- `mUSDC` `0xADE818616EA14903278E9cE11c2BfFfa4eEB682C` · eERC `cUSD` `0x320C389607d109B12836D6B8F507C7e87783cf82`
- Chainlink BTC/USD feed `0x31CF013A08c6Ac228C94551d535d5BAfE19c602a`
