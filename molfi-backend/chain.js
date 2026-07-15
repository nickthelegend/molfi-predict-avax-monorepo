/**
 * Molfi backend on-chain layer — **Avalanche Fuji** (viem).
 *
 * Read-only: a public client reads MolfiMarket / PredictEscrow / mUSDC and the
 * Chainlink price feeds. There are NO write paths here — the backend never
 * broadcasts a transaction (the app's own wallet does the real on-chain bets).
 * ZK proofs are BN254 Groth16 built with snarkjs against the compiled
 * confidential_bet circuit (mirrors molfi-predict-sdk/demo/agent-confidential-bet).
 */
import { createPublicClient, defineChain, http, getAddress } from "viem";

export const FUJI = {
  chainId: Number(process.env.MOLFI_CHAIN_ID || 43113),
  rpcUrl: process.env.MOLFI_RPC || "https://api.avax-test.network/ext/bc/C/rpc",
};

export const CONTRACTS = {
  market: process.env.MOLFI_MARKET || "0xBded9535cbe128f09A8CC1a97dDFb339f22CBc9b",
  predictEscrow: process.env.MOLFI_ESCROW || "0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c",
  confidentialBet: process.env.MOLFI_CBET || "0x5DAFB4217088dFB79dee6d780ED7437DC9D42E84",
  musdc: process.env.MOLFI_MUSDC || "0xADE818616EA14903278E9cE11c2BfFfa4eEB682C",
  verifier: process.env.MOLFI_VERIFIER || "0xCA791da6e0e2DB1C5B36Eb297B2d7bE05dc01EBB",
};

/** Chainlink AggregatorV3 feeds (Fuji, 8 decimals). */
export const FEEDS = {
  BTC: process.env.FEED_BTC || "0x31CF013A08c6Ac228C94551d535d5BAfE19c602a",
  ETH: process.env.FEED_ETH || "0x86d67c3D38D2bCeE722E601025C25a575021c6EA",
  AVAX: process.env.FEED_AVAX || "0x5498BB86BC934c8D34FDA08E81D444153d0D06aD",
  LINK: process.env.FEED_LINK || "0x34C4c526902d88a3Aa98DB8a9b802603EB1E3470",
};

/** mUSDC has 7 decimals; one whole token = 1e7 base units. */
export const MUSDC_DECIMALS = 7;
export const U = 10_000_000;

export const fujiChain = defineChain({
  id: FUJI.chainId,
  name: "Avalanche Fuji",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [FUJI.rpcUrl] } },
  blockExplorers: { default: { name: "SnowTrace", url: "https://testnet.snowtrace.io" } },
  testnet: true,
});

export const publicClient = createPublicClient({ chain: fujiChain, transport: http(FUJI.rpcUrl) });

export const MARKET_ABI = [
  { type: "function", name: "markets", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32[]" }] },
  { type: "function", name: "getMarket", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "string" }, { type: "uint64" }, { type: "uint8" }, { type: "uint32" }] },
  { type: "function", name: "isResolved", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "winningOutcome", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint32" }] },
];

export const ESCROW_ABI = [
  { type: "function", name: "pool", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "uint32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "total", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "position", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "uint32" }, { type: "address" }], outputs: [{ type: "uint256" }] },
];

export const MUSDC_ABI = [
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
];

export const FEED_ABI = [
  { type: "function", name: "latestRoundData", stateMutability: "view", inputs: [], outputs: [
    { type: "uint80" }, { type: "int256" }, { type: "uint256" }, { type: "uint256" }, { type: "uint80" },
  ] },
  { type: "function", name: "decimals", stateMutability: "view", inputs: [], outputs: [{ type: "uint8" }] },
];

const asHex = (h) => (String(h).startsWith("0x") ? h : `0x${h}`);

/** Generic read-only contract call. */
export async function readContract(address, abi, functionName, args = []) {
  return publicClient.readContract({ address: getAddress(address), abi, functionName, args });
}

/** Enumerate on-chain market ids (32-byte hex). */
export async function listMarketIds() {
  const ids = await readContract(CONTRACTS.market, MARKET_ABI, "markets");
  return ids ?? [];
}

/** Read a single market's state. Returns null on missing/revert. */
export async function getMarket(idHex) {
  try {
    const [question, closeTs, status, outcome] = await readContract(CONTRACTS.market, MARKET_ABI, "getMarket", [asHex(idHex)]);
    return { question, closeTs: Number(closeTs), status: Number(status), outcome: Number(outcome) };
  } catch {
    return null;
  }
}

export async function isResolved(idHex) {
  try {
    return Boolean(await readContract(CONTRACTS.market, MARKET_ABI, "isResolved", [asHex(idHex)]));
  } catch {
    return false;
  }
}

export async function winningOutcome(idHex) {
  return Number(await readContract(CONTRACTS.market, MARKET_ABI, "winningOutcome", [asHex(idHex)]));
}

/** Both-sided escrow pools (base units) for a market. */
export async function escrowPools(idHex) {
  const [yes, no] = await Promise.all([
    readContract(CONTRACTS.predictEscrow, ESCROW_ABI, "pool", [asHex(idHex), 0]).catch(() => 0n),
    readContract(CONTRACTS.predictEscrow, ESCROW_ABI, "pool", [asHex(idHex), 1]).catch(() => 0n),
  ]);
  return { yes: Number(yes) / U, no: Number(no) / U };
}

/** A wallet's escrowed stake (base units) on (market, outcome). */
export async function escrowPosition(idHex, outcome, who) {
  const v = await readContract(CONTRACTS.predictEscrow, ESCROW_ABI, "position", [asHex(idHex), outcome, getAddress(who)]).catch(() => 0n);
  return Number(v) / U;
}

/** mUSDC balance (base units). */
export async function musdcBalance(who) {
  const v = await readContract(CONTRACTS.musdc, MUSDC_ABI, "balanceOf", [getAddress(who)]).catch(() => 0n);
  return BigInt(v);
}

/**
 * Read a Chainlink price feed for `symbol` (BTC/ETH/AVAX/LINK). Returns the USD
 * price as a human number (feed answer / 10**decimals). Null if unsupported/error.
 */
export async function chainlinkPrice(symbol) {
  const feed = FEEDS[String(symbol).toUpperCase()];
  if (!feed) return null;
  try {
    const [, answer] = await readContract(feed, FEED_ABI, "latestRoundData");
    let dec = 8;
    try {
      dec = Number(await readContract(feed, FEED_ABI, "decimals"));
    } catch {
      /* default 8 */
    }
    return Number(answer) / 10 ** dec;
  } catch {
    return null;
  }
}
