/**
 * Network + deployed-contract configuration for Molfi on Avalanche Fuji.
 * Every address is overridable via env so the SDK works against a fresh deploy.
 */
export interface MolfiContracts {
  mUSDC: string;
  eERC_cUSD: string; // confidential stake token (Encrypted ERC)
  verifier: string;
  market: string;
  confidentialBet: string;
  predictEscrow: string; // real-mUSDC pari-mutuel betting + on-chain ZK-gated bets
}

export interface MolfiConfig {
  /** Molfi market-engine REST API (auto-rolling markets, prices, leaderboard). */
  backendUrl: string;
  /** EVM JSON-RPC endpoint (Fuji C-Chain). */
  rpcUrl: string;
  chainId: number;
  explorer: string;
  /** mUSDC / cUSD have 7 decimals. */
  decimals: number;
  contracts: MolfiContracts;
  /** Chainlink AggregatorV3 price feeds (Fuji). */
  feeds: Record<string, string>;
}

const env = (k: string, d: string) =>
  (typeof process !== "undefined" && process.env?.[k]) || d;

export const config: MolfiConfig = {
  backendUrl: env("MOLFI_BACKEND_URL", "http://localhost:8080"),
  rpcUrl: env("MOLFI_RPC", "https://api.avax-test.network/ext/bc/C/rpc"),
  chainId: Number(env("MOLFI_CHAIN_ID", "43113")),
  explorer: "https://testnet.snowtrace.io",
  decimals: 7,
  contracts: {
    mUSDC: env("MOLFI_MUSDC", "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C"),
    eERC_cUSD: env("MOLFI_EERC", "0x320C389607d109B12836D6B8F507C7e87783cf82"),
    verifier: env("MOLFI_VERIFIER", "0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB"),
    market: env("MOLFI_MARKET", "0xF260A7a44c7e6868D124dFcC4F13982C2eF42f8f"),
    confidentialBet: env("MOLFI_CBET", "0xEd1db687779eE2646162b70Bd3838AF8f4EeF6B3"),
    predictEscrow: env("MOLFI_ESCROW", "0xBeA24615324465bc0e7227AcaA1F539533165EEF"),
  },
  feeds: {
    "BTC/USD": "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a",
    "ETH/USD": "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
    "AVAX/USD": "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
    "LINK/USD": "0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470",
  },
};
