/**
 * Molfi on-chain layer — **Avalanche Fuji** (viem).
 *
 * Reads go through a public client; writes are sent by a pluggable wallet client
 * (the browser's injected wallet — Core / MetaMask — in the app, or a private-key
 * signer in integration tests). This replaces the Soroban simulation/XDR flow
 * while keeping every export name, so the premium Molfi UI compiles unchanged.
 *
 * Contracts (Fuji): MolfiMarket (Chainlink-resolved lifecycle), PredictEscrow
 * (real-mUSDC pari-mutuel + on-chain ZK-gated bets), ConfidentialBet (hidden-side
 * commitment notes + on-chain ZK claim), MockUSD (mUSDC faucet token).
 */
import {
  createPublicClient,
  defineChain,
  http,
  getAddress,
  parseUnits,
  type Abi,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { CONTRACTS, FUJI, MUSDC_UNIT, MUSDC_DECIMALS } from "@/lib/stellar/contracts";

// ---------------------------------------------------------------------------
// Chain + clients
// ---------------------------------------------------------------------------

export const fujiChain = defineChain({
  id: FUJI.chainId,
  name: "Avalanche Fuji",
  nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
  rpcUrls: { default: { http: [FUJI.rpcUrl] } },
  blockExplorers: { default: { name: "SnowTrace", url: "https://testnet.snowtrace.io" } },
  testnet: true,
});

export const publicClient: PublicClient = createPublicClient({
  chain: fujiChain,
  transport: http(FUJI.rpcUrl),
});

/** The wallet client used to send writes. Set by the wallet layer on connect
 * (browser injected wallet) or by an integration test (private-key signer). */
let _wallet: WalletClient | null = null;
let _account: `0x${string}` | null = null;

export function setWalletClient(wc: WalletClient | null, account?: `0x${string}`): void {
  _wallet = wc;
  _account = account ?? (wc?.account?.address as `0x${string}` | undefined) ?? null;
}

function requireWallet(): { wallet: WalletClient; account: `0x${string}` } {
  if (!_wallet || !_account) throw new Error("Wallet not connected");
  return { wallet: _wallet, account: _account };
}

// ---------------------------------------------------------------------------
// ABIs (minimal — only what the app calls)
// ---------------------------------------------------------------------------

const MUSDC_ABI = [
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "allowance", stateMutability: "view", inputs: [{ type: "address" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
] as const satisfies Abi;

const MARKET_ABI = [
  { type: "function", name: "markets", stateMutability: "view", inputs: [], outputs: [{ type: "bytes32[]" }] },
  { type: "function", name: "getMarket", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "string" }, { type: "uint64" }, { type: "uint8" }, { type: "uint32" }] },
  { type: "function", name: "isResolved", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "winningOutcome", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint32" }] },
  { type: "function", name: "resolveFromOracle", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }], outputs: [] },
] as const satisfies Abi;

const ESCROW_ABI = [
  { type: "function", name: "bet", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }, { type: "uint32" }, { type: "uint256" }], outputs: [] },
  { type: "function", name: "betZk", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }, { type: "uint32" }, { type: "uint256" }, { type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }, { type: "uint256[4]" }], outputs: [] },
  { type: "function", name: "redeem", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "pool", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "uint32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "total", stateMutability: "view", inputs: [{ type: "bytes32" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "position", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "uint32" }, { type: "address" }], outputs: [{ type: "uint256" }] },
] as const satisfies Abi;

const CBET_ABI = [
  { type: "function", name: "commit", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }, { type: "uint256[2]" }, { type: "uint256[2][2]" }, { type: "uint256[2]" }, { type: "uint256" }, { type: "uint256" }, { type: "address" }], outputs: [] },
] as const satisfies Abi;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const asHex = (h: string): Hex => (h.startsWith("0x") ? (h as Hex) : (`0x${h}` as Hex));
const toBase = (amountUsdc: number): bigint => parseUnits(String(amountUsdc), MUSDC_DECIMALS);
// A bare hex digest (e.g. a sha256 commitment) → 0x-prefixed then BigInt.
const bigHex = (h: string): bigint => BigInt(asHex(h));
// A field element the backend emits as a DECIMAL string (snarkjs publicSignals:
// root, nullifierHash, proof coords). BigInt() parses decimal and 0x-hex alike —
// but must NOT be 0x-prefixed first, or the decimal would be reparsed as hex and
// overflow uint256. (This is why publicInputs/root/nullifierHash use bigField,
// NOT bigHex.)
const bigField = (n: string): bigint => BigInt(n);

/** Convert a proof (snarkjs pi_* form, or {a,b,c} as hex/decimal string arrays)
 * into the Solidity Groth16 calldata shape the on-chain verifier expects. */
type RawProof =
  | { pi_a: string[]; pi_b: string[][]; pi_c: string[] }
  | { a: string | string[]; b: string | string[][]; c: string | string[] };

function toSolProof(p: RawProof): {
  a: [bigint, bigint];
  b: [[bigint, bigint], [bigint, bigint]];
  c: [bigint, bigint];
} {
  if ("pi_a" in p) {
    return {
      a: [BigInt(p.pi_a[0]), BigInt(p.pi_a[1])],
      // snarkjs G2 coordinates are swapped relative to the EVM verifier.
      b: [
        [BigInt(p.pi_b[0][1]), BigInt(p.pi_b[0][0])],
        [BigInt(p.pi_b[1][1]), BigInt(p.pi_b[1][0])],
      ],
      c: [BigInt(p.pi_c[0]), BigInt(p.pi_c[1])],
    };
  }
  const a = Array.isArray(p.a) ? p.a : [];
  const b = Array.isArray(p.b) ? (p.b as string[][]) : [];
  const c = Array.isArray(p.c) ? p.c : [];
  return {
    a: [BigInt(a[0]), BigInt(a[1])],
    b: [
      [BigInt(b[0][0]), BigInt(b[0][1])],
      [BigInt(b[1][0]), BigInt(b[1][1])],
    ],
    c: [BigInt(c[0]), BigInt(c[1])],
  };
}

async function read<T>(address: string, abi: Abi, functionName: string, args: readonly unknown[] = []): Promise<T> {
  return (await publicClient.readContract({
    address: getAddress(address),
    abi,
    functionName,
    args: args as never,
  })) as T;
}

async function send(address: string, abi: Abi, functionName: string, args: readonly unknown[]): Promise<string> {
  const { wallet, account } = requireWallet();
  const hash = await wallet.writeContract({
    address: getAddress(address),
    abi,
    functionName,
    args: args as never,
    // Use the client's configured account: a local key signs + broadcasts via
    // eth_sendRawTransaction (tests), an injected-wallet address signs via the
    // provider's eth_sendTransaction (browser).
    account: wallet.account ?? account,
    chain: fujiChain,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

/** Approve `spender` to pull at least `amount` mUSDC from `owner` (idempotent). */
async function ensureAllowance(owner: string, spender: string, amount: bigint): Promise<void> {
  const current = await read<bigint>(CONTRACTS.musdc, MUSDC_ABI, "allowance", [getAddress(owner), getAddress(spender)]);
  if (current >= amount) return;
  await send(CONTRACTS.musdc, MUSDC_ABI, "approve", [getAddress(spender), 2n ** 256n - 1n]);
}

// ---------------------------------------------------------------------------
// Market contract (lifecycle + enumeration)
// ---------------------------------------------------------------------------

export interface OnChainMarket {
  id: string; // hex
  question: string;
  closeTs: number;
  status: number; // 0 Trading, 1 Resolving, 2 Resolved
  outcome: number; // 0 YES, 1 NO, 2 INVALID
}

/** Enumerate all markets and fetch each one's state. */
export async function listMarkets(): Promise<OnChainMarket[]> {
  const ids = await read<readonly Hex[]>(CONTRACTS.market, MARKET_ABI, "markets");
  const out: OnChainMarket[] = [];
  for (const id of ids ?? []) {
    const m = await getMarket(id).catch(() => null);
    if (m) out.push(m);
  }
  return out;
}

/** Fetch a single market's state by 32-byte hex id. */
export async function getMarket(idHex: string): Promise<OnChainMarket> {
  const [question, closeTs, status, outcome] = await read<[string, bigint, number, number]>(
    CONTRACTS.market,
    MARKET_ABI,
    "getMarket",
    [asHex(idHex)],
  );
  return {
    id: asHex(idHex),
    question,
    closeTs: Number(closeTs),
    status: Number(status),
    outcome: Number(outcome),
  };
}

export async function isResolved(idHex: string): Promise<boolean> {
  return read<boolean>(CONTRACTS.market, MARKET_ABI, "isResolved", [asHex(idHex)]);
}

/** Winning outcome (0 YES / 1 NO) for a resolved market. */
export async function winningOutcome(idHex: string): Promise<number> {
  return Number(await read<number>(CONTRACTS.market, MARKET_ABI, "winningOutcome", [asHex(idHex)]));
}

/** Permissionlessly settle an oracle market after close (reads the Chainlink feed). */
export async function resolveFromOracle(walletAddress: string, idHex: string): Promise<string> {
  return send(CONTRACTS.market, MARKET_ABI, "resolveFromOracle", [asHex(idHex)]);
}

// ---------------------------------------------------------------------------
// mUSDC token + faucet
// ---------------------------------------------------------------------------

/** Faucet mint (1,000 mUSDC) — MockUSD has an open mint. */
export async function faucet(to: string): Promise<string> {
  return send(CONTRACTS.musdc, MUSDC_ABI, "mint", [getAddress(to), 1000n * BigInt(MUSDC_UNIT)]);
}

/** mUSDC balance (base units) for an address. */
export async function musdcBalance(addr: string): Promise<bigint> {
  return read<bigint>(CONTRACTS.musdc, MUSDC_ABI, "balanceOf", [getAddress(addr)]);
}

// ---------------------------------------------------------------------------
// PredictEscrow (real-mUSDC pari-mutuel bet + payout)
// ---------------------------------------------------------------------------

/** Escrow `amountUsdc` mUSDC on an outcome (0=YES, 1=NO) of an on-chain market. */
export async function escrowBet(
  walletAddress: string,
  marketIdHex: string,
  outcome: number,
  amountUsdc: number,
): Promise<string> {
  const amount = toBase(amountUsdc);
  await ensureAllowance(walletAddress, CONTRACTS.predictEscrow, amount);
  return send(CONTRACTS.predictEscrow, ESCROW_ABI, "bet", [asHex(marketIdHex), outcome, amount]);
}

/** Claim winnings on a resolved on-chain market. */
export async function escrowRedeem(walletAddress: string, marketIdHex: string): Promise<string> {
  return send(CONTRACTS.predictEscrow, ESCROW_ABI, "redeem", [asHex(marketIdHex), getAddress(walletAddress)]);
}

/** A wallet's escrowed stake (base units) on (market, outcome). */
export async function escrowPosition(marketIdHex: string, outcome: number, who: string): Promise<bigint> {
  return read<bigint>(CONTRACTS.predictEscrow, ESCROW_ABI, "position", [asHex(marketIdHex), outcome, getAddress(who)]);
}

/** Total mUSDC (base units) escrowed across both sides of a market. */
export async function escrowTotal(marketIdHex: string): Promise<bigint> {
  return read<bigint>(CONTRACTS.predictEscrow, ESCROW_ABI, "total", [asHex(marketIdHex)]);
}

/** Total mUSDC (base units) escrowed on one outcome (the real on-chain pool). */
export async function escrowPool(marketIdHex: string, outcome: number): Promise<bigint> {
  return read<bigint>(CONTRACTS.predictEscrow, ESCROW_ABI, "pool", [asHex(marketIdHex), outcome]);
}

/**
 * Privacy bet: escrow `amountUsdc` mUSDC on `outcome`, gated by a Groth16 proof
 * the escrow verifies ON-CHAIN before accepting (its nullifier is burned,
 * single-use). Public signals `[root, nullifierHash, outcome, recipient]`.
 */
export async function escrowBetZk(
  walletAddress: string,
  marketIdHex: string,
  outcome: number,
  amountUsdc: number,
  proof: RawProof,
  publicInputs: string[],
  _domain: string,
): Promise<string> {
  if (!publicInputs || publicInputs.length < 4) throw new Error("bad public inputs");
  const amount = toBase(amountUsdc);
  await ensureAllowance(walletAddress, CONTRACTS.predictEscrow, amount);
  const { a, b, c } = toSolProof(proof);
  const pub = [bigField(publicInputs[0]), bigField(publicInputs[1]), bigField(publicInputs[2]), bigField(publicInputs[3])];
  return send(CONTRACTS.predictEscrow, ESCROW_ABI, "betZk", [asHex(marketIdHex), outcome, amount, a, b, c, pub]);
}

/** Deposit `amountUsdc` mUSDC into the fee vault (funds the escrow's LP pot). */
export async function vaultDepositOnChain(walletAddress: string, amountUsdc: number): Promise<string> {
  const amount = toBase(amountUsdc);
  return send(CONTRACTS.musdc, MUSDC_ABI, "transfer", [getAddress(CONTRACTS.vault), amount]);
}

// ---------------------------------------------------------------------------
// ConfidentialBet (hidden-side commitment notes + on-chain ZK claim)
// ---------------------------------------------------------------------------

/**
 * Escrow one fixed-denomination (100 mUSDC) commitment note. The `commitment` is
 * a binding hash of an off-chain note (secret, nullifier, chosen side) — nothing
 * on-chain reveals which outcome it backs, and the uniform denom hides the amount.
 */
export async function confidentialCommit(walletAddress: string, commitmentHex: string): Promise<string> {
  // ConfidentialBet.commit pulls one denom of mUSDC from the sender.
  await ensureAllowance(walletAddress, CONTRACTS.confidentialBet, 100n * BigInt(MUSDC_UNIT));
  return send(CONTRACTS.confidentialBet, CBET_ABI, "commit", [bigHex(commitmentHex)]);
}

/**
 * Claim a winning confidential note. The proof is verified ON-CHAIN: the contract
 * injects the resolved winning outcome as a public input, so only a note that
 * backed the winner verifies. The nullifier is burned (single-use) and the payout
 * is paid to the wallet — unlinkable to the deposit.
 */
export async function confidentialClaim(
  walletAddress: string,
  marketIdHex: string,
  proof: RawProof,
  nullifierHashHex: string,
  _recipientFieldHex: string,
  rootHex: string,
): Promise<string> {
  const { a, b, c } = toSolProof(proof);
  return send(CONTRACTS.confidentialBet, CBET_ABI, "claim", [
    asHex(marketIdHex),
    a,
    b,
    c,
    bigField(rootHex),
    bigField(nullifierHashHex),
    getAddress(walletAddress),
  ]);
}

// ---------------------------------------------------------------------------
// Legacy clob aliases (retained for import compatibility; escrow is the single
// settlement contract on Avalanche).
// ---------------------------------------------------------------------------

export const balance = (trader: string): Promise<bigint> => musdcBalance(trader);
export const position = (holder: string, marketHex: string, outcome: number): Promise<bigint> =>
  escrowPosition(marketHex, outcome, holder);
export const escrow = (marketHex: string): Promise<bigint> => escrowTotal(marketHex);
export const redeem = (holder: string, marketHex: string): Promise<string> => escrowRedeem(holder, marketHex);
