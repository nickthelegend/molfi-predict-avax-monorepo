/**
 * Molfi — deployed **Avalanche Fuji** contract addresses and market constants.
 * (This module keeps its `stellar/` path + export names so the premium UI keeps
 * compiling through the Soroban → Avalanche migration; the chain underneath is
 * now the Fuji C-Chain.) Override any value via VITE_* env.
 * Source of truth: molfi-contracts/script/DeployApp.s.sol
 */

/** Fuji C-Chain network config (viem client is built from this in ./soroban). */
export const FUJI = {
  chainId: Number(import.meta.env.VITE_FUJI_CHAIN_ID ?? 43113),
  rpcUrl:
    (import.meta.env.VITE_FUJI_RPC_URL as string | undefined) ??
    "https://api.avax-test.network/ext/bc/C/rpc",
} as const;

/** Legacy read-source (Soroban needed a funded account to simulate). viem reads
 * need no sender, so this is retained only for import compatibility. */
export const READ_SOURCE = "0x0000000000000000000000000000000000000000";

/** Live Fuji deployment (see molfi-contracts/script/DeployApp.s.sol). */
export const CONTRACTS = {
  verifier:
    (import.meta.env.VITE_VERIFIER_CONTRACT_ID as string | undefined) ??
    "0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB",
  market:
    (import.meta.env.VITE_MARKET_CONTRACT_ID as string | undefined) ??
    "0xF260A7a44c7e6868D124dFcC4F13982C2eF42f8f",
  /** predict-escrow — real-mUSDC pari-mutuel betting + on-chain ZK-gated bets. */
  predictEscrow:
    (import.meta.env.VITE_PREDICT_ESCROW_CONTRACT_ID as string | undefined) ??
    "0xBeA24615324465bc0e7227AcaA1F539533165EEF",
  /** confidential-bet — hidden-side commitment notes + on-chain ZK claim. */
  confidentialBet:
    (import.meta.env.VITE_CONF_BET_CONTRACT_ID as string | undefined) ??
    "0xEd1db687779eE2646162b70Bd3838AF8f4EeF6B3",
  /** mUSDC — Molfi's testnet stablecoin with an open faucet (7 decimals). */
  musdc:
    (import.meta.env.VITE_MUSDC_CONTRACT_ID as string | undefined) ??
    "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C",
  /** eERC confidential-stake token (Encrypted ERC). */
  eercCUSD:
    (import.meta.env.VITE_EERC_CUSD_CONTRACT_ID as string | undefined) ??
    "0x320C389607d109B12836D6B8F507C7e87783cf82",
  // ── legacy aliases kept for display links; escrow is the single settlement contract ──
  clobSettlement:
    (import.meta.env.VITE_PREDICT_ESCROW_CONTRACT_ID as string | undefined) ??
    "0xBeA24615324465bc0e7227AcaA1F539533165EEF",
  vault:
    (import.meta.env.VITE_PREDICT_ESCROW_CONTRACT_ID as string | undefined) ??
    "0xBeA24615324465bc0e7227AcaA1F539533165EEF",
} as const;

/** Chainlink BTC/USD data feed on Fuji (8 decimals) — resolves the seeded markets. */
export const BTC_USD_FEED = "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a";

/** mUSDC has 7 decimals; one whole token = 1e7 base units. */
export const MUSDC_DECIMALS = 7;
export const PREDICT_ESCROW = CONTRACTS.predictEscrow;
export const MUSDC_UNIT = 10_000_000;

/** Outcome encoding shared by the market + escrow contracts. */
export const OUTCOME = { YES: 0, NO: 1, INVALID: 2 } as const;

/** Market lifecycle status from the `MolfiMarket` contract. */
export const MARKET_STATUS = { TRADING: 0, RESOLVING: 1, RESOLVED: 2 } as const;

/** Seeded Fuji markets — keccak256(key) ids from DeployApp.s.sol. */
export const MARKET_IDS = {
  BTC50K_NOW: "0x2da6688a356970e9958ae7c7abcf23b7a544b8a43b2393cb2e09bd5c75effc21",
  BTC100K_NOW: "0xbc2b192b87069436597fb4769428a7662e172a040bceccadd366b4d75a817a49",
  BTC75K_7D: "0x6b3e03b337fdbf84d548bdb98d524f1411d19174dd0f21643a603b77452fbdc3",
  BTC120K_7D: "0x93f2bf776adeb0695be251952ab5a2b3e46675716e53ba06d2b5648f0a2b5e54",
  BTC90K_7D: "0x5be4aa809a08b1fed040133b76809da6f9110fc7796187cbd47a475e2f230950",
} as const;

export const EXPLORER = "https://testnet.snowtrace.io";
export const contractUrl = (id: string): string => `${EXPLORER}/address/${id}`;
export const txUrl = (hash: string): string => `${EXPLORER}/tx/${hash}`;
