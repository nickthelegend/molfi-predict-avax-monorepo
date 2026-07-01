# molfi-predict-app

The Molfi trading dApp — a React + Vite front-end for **private prediction
markets on Stellar**. See the [project README](../README.md) for the full
architecture, live testnet deployment, and on-chain demo.

## Stack

- **React 18 + Vite + TypeScript**, Tailwind + shadcn/ui
- **Stellar Wallets Kit** — unified connect for Freighter / xBull / Albedo / Lobstr / Hana
- **@stellar/stellar-sdk** for Soroban RPC + transaction building
- **[@molfi/predict-sdk](../molfi-predict-sdk/)** for contract-aligned CLOB order signing

The wallet layer funnels through a single reactive `useWallet`
([`src/hooks/useWallet.ts`](src/hooks/useWallet.ts)) backed by Stellar Wallets Kit
([`src/lib/stellar/walletKit.ts`](src/lib/stellar/walletKit.ts)) — no React provider needed.

## Develop

```bash
npm install
cp .env.template .env      # set VITE_STELLAR_NETWORK, RPC, contract IDs
npm run dev                # http://localhost:8080
npm run build
```

Configure the deployed testnet contract IDs (see the project README) in `.env`
via the `VITE_*_CONTRACT_ID` keys.

## Status

Builds and connects a Stellar wallet on testnet. Wiring the trading screens to
the deployed Soroban contracts is in progress — the on-chain flows are currently
demonstrated directly against the contracts (see the project README's on-chain
transaction table).
