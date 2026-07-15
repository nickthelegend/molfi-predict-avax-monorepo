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

/**
 * Default Molfi network config — Avalanche Fuji C-Chain.
 * (Named `TESTNET` for import compatibility with the agent/chain/wallet/data
 * modules; the underlying chain is Fuji, not Stellar testnet.)
 */
export const TESTNET: MolfiConfig = {
  backendUrl: env("MOLFI_BACKEND_URL", "http://localhost:4000"),
  rpcUrl: env("MOLFI_RPC", "https://api.avax-test.network/ext/bc/C/rpc"),
  chainId: Number(env("MOLFI_CHAIN_ID", "43113")),
  explorer: "https://testnet.snowtrace.io",
  decimals: 7,
  contracts: {
    mUSDC: env("MOLFI_MUSDC", "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C"),
    eERC_cUSD: env("MOLFI_EERC", "0x320C389607d109B12836D6B8F507C7e87783cf82"),
    verifier: env("MOLFI_VERIFIER", "0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB"),
    market: env("MOLFI_MARKET", "0xBded9535cbe128f09A8CC1a97dDFb339f22CBc9b"),
    confidentialBet: env("MOLFI_CBET", "0x5DAFB4217088dFB79dee6d780ED7437DC9D42E84"),
    predictEscrow: env("MOLFI_ESCROW", "0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c"),
  },
  feeds: {
    "BTC/USD": "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a",
    "ETH/USD": "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
    "AVAX/USD": "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
    "LINK/USD": "0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470",
  },
};

/** Back-compat alias — some callers imported the config as `config`. */
export const config: MolfiConfig = TESTNET;

/** Outcome encoding shared by the market + escrow contracts. */
export const OUTCOME_YES = 0;
export const OUTCOME_NO = 1;
export const OUTCOME_INVALID = 2;

/**
 * Convert a human token amount to base units (integer). mUSDC/cUSD have 7
 * decimals, so `toBaseUnits(1.5)` → `15000000n`. Truncates sub-unit dust.
 */
export function toBaseUnits(amount: number | string, decimals = TESTNET.decimals): bigint {
  const s = String(amount).trim();
  if (!/^-?\d*(\.\d*)?$/.test(s) || s === "" || s === "." || s === "-") {
    throw new Error(`invalid amount: ${amount}`);
  }
  const neg = s.startsWith("-");
  const [whole, frac = ""] = (neg ? s.slice(1) : s).split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const digits = `${whole || "0"}${fracPadded}`.replace(/^0+(?=\d)/, "");
  const value = BigInt(digits || "0");
  return neg ? -value : value;
}

/** Convert base units back to a human number. Inverse of {@link toBaseUnits}. */
export function fromBaseUnits(base: bigint | number | string, decimals = TESTNET.decimals): number {
  const b = BigInt(base);
  const divisor = 10n ** BigInt(decimals);
  const neg = b < 0n;
  const abs = neg ? -b : b;
  const whole = abs / divisor;
  const frac = abs % divisor;
  const fracStr = frac.toString().padStart(decimals, "0");
  const num = Number(`${whole}.${fracStr}`);
  return neg ? -num : num;
}
