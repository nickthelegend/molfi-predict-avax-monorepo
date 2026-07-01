# Molfi — Hackathon Submission

**Molfi is a private, agent-native prediction market on Stellar.** You bet on real-world
outcomes; your *side* stays hidden on-chain, proven with zero-knowledge; and **AI agents can
trade it end-to-end from a single skill file** — generate a wallet, fund themselves, place a
ZK-verified bet, and redeem — with no human in the loop.

- **Network:** Stellar **testnet** (Soroban)
- **Live:** web app + autonomous-agent SDK, both hitting real deployed contracts
- **Domain:** molfi.fun

---

## 1. Why this is a ZK submission (three real ZK mechanisms, all verified on-chain)

Everything below is a **BLS12-381 Groth16 proof verified inside a Soroban transaction** by an
on-chain `verifier` contract (CAP-0059 host functions). Circuits are Circom + snarkjs.

| Mechanism | What it proves | Contract |
|---|---|---|
| **ZK-gated bet** (`bet_zk`) | Eligibility + single-use **nullifier** (anti-replay) — every live bet carries a fresh proof verified on-chain before mUSDC escrows | `predict-escrow` |
| **Confidential bet** | Your **side is hidden** — you commit a note, then later prove in ZK that you backed the *resolved winner* (the contract injects the winner as a public input, so a losing note can't prove), redeem unlinkably | `confidential-bet` |
| **Privacy pool** | Poseidon Merkle membership + nullifier withdraw (Tornado-style) | `privacy-pool` |

> Honest scope: the confidential bet's *anonymity set* is currently a single-leaf path (root
> registered per-claim) and proving is server-assisted — the ZK verification, outcome-binding,
> side-hiding, and nullifier are all real on-chain; a shared multi-leaf Poseidon accumulator +
> client-side proving is the production follow-up. See §9.

---

## 2. The differentiator: **agent-native**

Molfi ships a skill file (`molfi-predict-sdk/SKILL.md`) + TypeScript SDK (`MolfiAgent`) so an
LLM agent can trade with zero human setup:

```ts
const agent = MolfiAgent.create();     // fresh Stellar wallet
await agent.onboard();                  // friendbot XLM + mUSDC faucet
await agent.betZk(marketId, 0, amount, proof, publicInputs, domain); // ZK bet, verified on-chain
await agent.resolveFromOracle(marketId);   // settle (permissionless after close)
await agent.redeem(marketId);              // claim winnings
```

**Proven live this build:** an autonomous agent read `SKILL.md` and ran the **entire** private-bet
lifecycle with no human — generated wallet `GD7ZRQ7BDGLVLW67B6BXX5NA6NF7IE3TOQ2SJK2MHMM6YVEUYR6IH7MJ`,
funded itself, minted its own Groth16 proof, placed a ZK-verified `bet_zk`, settled it, and
**redeemed a +96 mUSDC profit**. All six transactions confirmed on-chain — see §5.

---

## 3. Architecture

```
Users ─┐                          ┌─ predict-escrow (mUSDC bets, bet_zk, pari-mutuel redeem)
       ├─ molfi-app (React/Vite) ─┤─ confidential-bet (hidden-side commit + ZK claim)
Agents ┘   molfi-predict-sdk      ├─ verifier (Groth16 / BLS12-381)     ← Circom circuits
                │                 ├─ market (lifecycle + resolve_from_oracle)
       molfi-backend (Express) ───┤─ mock-oracle / Reflector (SEP-40 price feed)
       keeper · ZK proof svc ·    ├─ vault (LP) · musdc (faucet token)
       IPFS chat (Pinata)         └─ privacy-pool · clob-settlement · policy
```

- **Oracle:** the real **Reflector** SEP-40 feed on Stellar (mock-oracle only for deterministic demos). Pyth is not on Soroban.
- **Keeper:** backend auto-rolls 15m/30m crypto markets and settles them from the oracle — the venue is self-sustaining.
- **Chat:** per-market comments (emoji/GIF/image) with images pinned to **IPFS via Pinata**.

### GitHub repos (all public, `github.com/nickthelegend`)
| Repo | Contents |
|---|---|
| [molfi-predict-app](https://github.com/nickthelegend/molfi-predict-app) | Web app (React + Vite + Tailwind) |
| [molfi-predict-backend](https://github.com/nickthelegend/molfi-predict-backend) | Market engine, keeper, ZK + confidential proof service, IPFS chat |
| [molfi-predict-sdk](https://github.com/nickthelegend/molfi-predict-sdk) | Agent SDK + `SKILL.md` |
| [molfi-predict-contracts](https://github.com/nickthelegend/molfi-predict-contracts) | Soroban contracts (Rust) |
| [molfi-predict-circuits](https://github.com/nickthelegend/molfi-predict-circuits) | Circom ZK circuits + Groth16 keys |
| [molfi-predict-landing](https://github.com/nickthelegend/molfi-predict-landing) | Landing page |
| [molfi-predict-docs](https://github.com/nickthelegend/molfi-predict-docs) | Architecture / roadmap / this submission |

---

## 4. Deployed contracts (Stellar testnet)

| Contract | ID |
|---|---|
| verifier (Groth16) | `CCTJUV6I5WVOLF7DQUZ2NX6ZJD2AWCGDBCEIN2SBFOWNLZP7MYV2ZXEC` |
| predict-escrow | `CCMR7AL3QT57B7KRZQ47AH34E4OQH42JXUK6BE7SQKRVOIJKAVILURL7` |
| confidential-bet | `CBJO7AZHJSS4JZFTFYHZWK7B2ZZNZ4OUQMAZ53YAJCMJB3M7HHHISJXA` |
| confidential verifier | `CBA3HZQJVGG3FIXY3CX5YVQE5ZOZBVFXFZZAYN4G3CVLPLF44A7L2GGC` |
| market | `CDDX7ELEU2XBQWYYS72BFKZN5M642EBLEA6N2X22WZTHNGXPF7YPAXP3` |
| Reflector oracle | `CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63` |
| mUSDC (faucet) | `CD4J6V73L5LBHDPCDITB2SMZQK5URUFBDED5IGTEU4G6XOUYXYUBJYST` |
| vault (LP) | `CBZSLDILDHVFVZ5E54Y4Z33H6AQANZYQLCB2MKOADD63BLP7VYA7VHDB` |
| privacy-pool | `CAIMKBEKKLAT2CQ2T3QY6RQLKTHGLIHIUHYDDQ4NXULTZWEGZM2OMPNN` |

## 5. Live proof — real transactions (the receipts)

Explorer: `https://stellar.expert/explorer/testnet/tx/<hash>`

| Flow | Transaction |
|---|---|
| **Live ZK bet** (bet_zk, Groth16 on-chain) | `82ec3633d883e7d5bb0735ecdb6c06a574dc2cf95d3c066e4f9509e575f632ce` |
| **Agent ZK bet** (via SDK) | `cff0cf6ffdedfc199eeeef24d6fda11b9494f932bc74736dede8753fffa5cd02` |
| **Confidential claim** (side hidden, ZK) | `63a587b656a7f4af4cbfba9a0bb3055192a5a1340d3f970fd419bef413eeb6d3` |
| Confidential — commit note | `f7bc03dec949409658b20e853356ae8c2e70b9d09bfe6ba76a6e6a5be54f9f94` |
| Confidential — market resolve | `6ae1a2b1bf9e666545a74cb341521933bbf10ba9ee3c21d01054627cfb890597` |
| ZK bet lifecycle — create / bet / resolve / redeem | `9d711ed0…` / `080e431e…` / `c852d0b8…` / `b612e116…` |
| Agent transparent lifecycle (10,000 → 10,960 mUSDC) | `45ba445757f220dc8e99a42045931ec2e4a231fdca4ac5e6bfc13d5964641001` |
| Reflector real-oracle settle | `17748f6db4423e3d730c87b099ba362e9de3651d3987db3467691b184adfc497` |

### Agent full private-bet lifecycle — run for this submission (all SUCCESS)

Autonomous agent `GD7ZRQ7BDGLVLW67B6BXX5NA6NF7IE3TOQ2SJK2MHMM6YVEUYR6IH7MJ` — **no human** — minted
its own BLS12-381 Groth16 proof and ran create → fund → faucet → **bet_zk** → resolve → redeem.
mUSDC **10,000 → 9,900 (100 staked) → 10,096 (redeemed)** = **+96 net profit** (pari-mutuel: won
its stake back + the loser's 100 pot, minus the 2% fee). Market `2c2cb6f4…` resolved **YES**; the
proof's nullifier flipped **false → true** across the `bet_zk` tx (single-use enforced on-chain).

| Step | Transaction |
|---|---|
| faucet (mUSDC) | `683ec16716ee1e09eb2d5a8047ff58e8143ad8ce2baa35abb14024589b9e7b32` |
| market create | `7af0a5055c4820db41e4becbab5c9a3b43dfe59ee34f3bd6d5814845e65ca8c7` |
| loser NO bet | `57492528a161135fb1cae505757711da13df7ba9aaabeaac905c107ba2d128e9` |
| **bet_zk** (Groth16 verified on-chain + nullifier burned) | `0e9bca76a9344796e9aee9ab9b1a4ea94dc17fa5a411dadfc074fc43dd0d7b72` |
| resolve (permissionless, post-close) | `d1eb6e7c4f0091caa43760ae73f3b5fa729933bb23f62cbedb22b8a8a4dd214c` |
| redeem (**+96 mUSDC**) | `09f89119c8394a3f2cc10d099093a9e1a863f0641e743e26db2b474cfc7b715e` |

---

## 6. Run it — how the flow starts

```bash
# 0. Prereqs: node 18+, the `stellar` CLI, a Freighter wallet (testnet)

# 1. Backend (market engine + keeper + ZK/confidential proof svc + IPFS chat)
cd molfi-backend
npm install
cp .env.example .env          # set MONGODB_URI, MOLFI_ADMIN_SECRET, PINATA_JWT
npm start                     # → http://localhost:4000

# 2. Web app
cd ../molfi-app
npm install
npm run dev                   # → http://localhost:8081  (this build used :8082)
```

Open the app → **Connect wallet** (Freighter, testnet) → click **Faucet** to get test mUSDC →
open a **Crypto** market. That's the entry point for the demo.

---

## 7. Demo recording guide (scene-by-scene)

Record ~2–3 minutes. Two acts: **humans trade**, then **agents trade**. Have the app on
`:8082`, backend on `:4000`, and a terminal ready for the agent act.

| # | Scene | On screen | Show |
|---|---|---|---|
| 0 | Hook | Landing / markets grid | The live crypto markets, "Private predictions on Stellar" |
| 1 | Onboard | Header | Connect Freighter → **Faucet** (10,000 mUSDC arrives) |
| 2 | **User — public bet** | Market detail | Pick BTC market → **Standard** → YES → bet → wallet signs → tx toast → Explorer |
| 3 | **User — private bet** | Same ticket | Toggle **🔒 Private** → YES → "Bet privately" → note the side is *hidden* on-chain (uniform 100 mUSDC) |
| 4 | Settle + claim | "Your private bets" panel | After the market resolves → **Claim** → a Groth16 proof verifies on-chain, payout arrives, side never revealed |
| 5 | Chat | Market chat | Post a comment + an image (pinned to IPFS/Pinata) |
| 6 | **AGENT — the climax** | Terminal | Run the agent (§8); narrate as it creates a wallet, funds itself, ZK-bets, settles, redeems — no human |
| 7 | Proof | Explorer tab | Open the agent's `bet_zk` + `redeem` tx on stellar.expert |
| 8 | Close | Repos / README | "On-chain, ZK-verified, agent-native, on Stellar." |

---

## 8. Narration script (TTS) — speak these lines

> Read at a steady pace; each block ≈ one scene. Emphasis on the **agent** act.

### Cold open (Scene 0) — ~12s
> "Prediction markets have a privacy problem. Every bet you place is public — the whole world
> sees which side you took, and whales front-run you. This is **Molfi**: a prediction market on
> **Stellar** where your bet is settled on-chain, but your *side* stays private — proven with
> zero-knowledge. And it's built so that **AI agents can trade it, not just people.**"

### Onboarding (Scene 1) — ~10s
> "I connect a Stellar wallet, hit the faucet, and I've got test mUSDC. These crypto markets are
> real, on-chain, and they roll and settle automatically from a live oracle."

### User — public bet (Scene 2) — ~15s
> "Let's bet. I think Bitcoin finishes above the strike, so I take YES. I sign with my wallet,
> and the stake escrows into a Soroban contract. There's the transaction on Stellar's explorer —
> real money, real settlement."

### User — private bet (Scene 3) — ~18s
> "Now the interesting part. I flip on **Private** mode. I still pick my side — but watch: on
> chain, all anyone sees is a uniform commitment. My side, YES or NO, is **hidden**. I'm not
> trusting Molfi to keep it secret — it's cryptographically hidden by a zero-knowledge commitment."

### Settle + ZK claim (Scene 4) — ~18s
> "When the market resolves, I claim. Behind this button, a **Groth16 proof** is generated and
> **verified on-chain**: it proves I hold a note backing the *winning* side — without ever
> revealing which note is mine or which side I took. A nullifier is burned so I can't double-claim,
> and the payout lands — completely unlinkable to my original bet."

### Agent — the climax (Scene 6) — ~35s
> "Here's what makes Molfi different. Everything I just did — an **AI agent** can do on its own.
> I give the agent one file: a skill file. No keys, no setup. Watch.
>
> It **generates its own Stellar wallet**. It **funds itself** from friendbot. It **requests test
> mUSDC** from the faucet. It **mints its own zero-knowledge proof**, and places a **ZK-verified
> bet** — the Groth16 proof is checked inside the transaction. The market settles from the oracle,
> and the agent **redeems its winnings**. No human touched a wallet. That's a full private-bet
> lifecycle, run autonomously by an agent, on Stellar."

### Proof + close (Scenes 7–8) — ~15s
> "And it's all verifiable — here are the agent's transactions on the explorer: the ZK bet, the
> settlement, the redeem. Molfi: **on-chain, zero-knowledge-private, and agent-native — on
> Stellar.**"

---

## 9. Reproduce — the agent full ZK lifecycle

**One command** (fresh wallet → friendbot → faucet → `bet_zk` [Groth16 verified on-chain] →
resolve → redeem), re-runnable with a fresh proof each time:

```bash
cd molfi-contracts
bash scripts/zk_onchain_bet.sh
# prints: agent address, market id, and TX_CREATE / TX_BET_ZK / TX_RESOLVE / TX_REDEEM
```

**Via the SDK / agent skill** (what an LLM agent runs after reading `SKILL.md`):

```bash
cd molfi-predict-sdk
npm install
node examples/agent-trade.mjs      # MolfiAgent.create → onboard → betZk → (resolve) → redeem
```

Contract IDs + all captured tx hashes live in `molfi-contracts/deploy/testnet.env`. The circuits
(and their proving/verifying keys) are in `molfi-predict-circuits`; rebuild with the scripts there.

---

## 10. Honest status & what's next

- ✅ Real on-chain prediction market (mUSDC escrow, pari-mutuel), on-chain **Groth16-verified**
  bets, autonomous oracle settlement, agent-native SDK + skill, per-market IPFS chat.
- ⚠️ **Confidential privacy depth:** side-hiding, outcome-bound soundness, and nullifiers are
  real on-chain; the anonymity *set* is a single-leaf path and proving is server-assisted today.
  **Next:** a shared BLS12-381 Poseidon Merkle accumulator + client-side proving.
- ⚠️ Testnet only. Mainnet needs the live Reflector feed wired for production assets, real USDC,
  and a contract audit.

_Built on Stellar · Soroban · Circom/Groth16 (BLS12-381) · Reflector · MongoDB · Pinata/IPFS._
