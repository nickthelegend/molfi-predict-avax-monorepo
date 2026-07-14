# molfi-predict-sdk

Modular SDK for the **Molfi** private prediction market on **Avalanche Fuji**
(viem + snarkjs). One package, two layers — built so humans *and* AI agents trade
through the same API:

- **Agent / on-chain layer** (`MolfiAgent`, `MolfiChain`, wallet, data): generate an
  EVM wallet, self-faucet `mUSDC`, read live markets / odds / order book, and
  place **real on-chain bets** that escrow mUSDC (optionally gated by a
  zero-knowledge proof verified on-chain), then redeem winnings.
- **CLOB layer** (`signClobOrder`, `buildOrder`, `MolfiClient`): contract-aligned
  order signing for the off-chain limit order book (secp256k1 over the canonical
  order bytes, byte-matches the settlement contract).

> 🤖 Agents: see [`SKILL.md`](./SKILL.md) for the autonomous-trading runbook.

## Install & build

```bash
npm install
npm run build
node examples/agent-trade.mjs   # live demo: wallet → faucet → read markets → bet
```

## Quick start — autonomous agent

```ts
import { MolfiAgent, OUTCOME_YES } from "molfi-predict-sdk";

const agent = MolfiAgent.create();            // fresh EVM wallet
await agent.onboard();                         // self-faucets mUSDC (10,000). Fund the
                                               // wallet with AVAX for gas separately,
                                               // or pass onboard({ funderKey }) to auto-fund gas.
const markets = await agent.markets();         // live odds, OI, sentiment
const [m]     = await agent.onChainMarkets();  // a 32-byte hex market id you can bet on
await agent.bet(m.marketId, OUTCOME_YES, 100); // escrow 100 mUSDC on YES (real tx)

if (await agent.isResolved(m.marketId)) {
  await agent.redeem(m.marketId);              // claim pro-rata winnings
}
```

Restore an existing trader: `new MolfiAgent(privateKey)` (a `0x…` EVM key). Point
at another deployment with env vars (`MOLFI_BACKEND_URL`, `MOLFI_RPC`,
`MOLFI_ESCROW`, `MOLFI_MARKET`, `MOLFI_CBET`, …) — see [`src/config.ts`](./src/config.ts).

## Quick start — CLOB order signing

```ts
import { MolfiClient, buildOrder, PrivateKeyOrderSigner } from "molfi-predict-sdk";

const client = new MolfiClient({ apiUrl: "https://api.molfi.fun" });
const order  = buildOrder({ market: "MKT…", side: "BUY", outcome: "YES", price: 0.62, size: 100 });
const signed = await client.signOrder(order, new PrivateKeyOrderSigner(privateKey));
await client.submitOrder(signed);
```

## API surface

| Group | Members |
|---|---|
| Agent | `MolfiAgent` (`create`, `onboard`, `markets`, `orderBook`, `leaderboard`, `vaults`, `onChainMarkets`, `bet`, `betZk`, `redeem`, `musdc`, `winningOutcome`) |
| Chain | `MolfiChain` (`faucet`, `musdcBalance`, `bet`, `betZk`, `redeem`, `escrowTotal`, `escrowPosition`, `isResolved`, `winningOutcome`, `resolveFromOracle`, `read`, `write`) |
| Wallet | `generateWallet`, `walletFromSecret` (EVM keys) |
| Data | `fetchMarkets`, `fetchMarket`, `fetchOrderBook`, `fetchPrices`, `fetchLeaderboard`, `fetchVaults`, `fetchOnChainMarkets` |
| Config | `TESTNET`, `toBaseUnits`, `fromBaseUnits`, `OUTCOME_YES`, `OUTCOME_NO` |
| CLOB | `signClobOrder`, `canonicalOrderBytes`, `PrivateKeyOrderSigner`, `buildOrder`, `canonicalize`, `MolfiClient` |

mUSDC has 7 decimals. Outcomes: YES=0, NO=1. Default config targets **Avalanche
Fuji** (chain id 43113). See [`../TESTING.md`](../TESTING.md) for the test matrix.
