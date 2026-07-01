/**
 * Soroban contract calls from the browser — reads via simulation, writes signed
 * by the connected Stellar wallet (Stellar Wallets Kit). This is Molfi's on-chain
 * layer; it replaces the Sui DeepBook Predict client.
 *
 * Contracts (testnet): market (lifecycle), clob-settlement (accounts/positions/
 * settle/redeem), privacy-pool (ZK deposits/withdraws), verifier (Groth16).
 */
import { Buffer } from "buffer";
import {
  rpc,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  scValToNative,
  nativeToScVal,
  Address,
} from "@stellar/stellar-sdk";
import { walletKit, NETWORK_PASSPHRASE, SOROBAN_RPC_URL } from "@/lib/stellar/walletKit";
import { CONTRACTS, READ_SOURCE, MUSDC_UNIT } from "@/lib/stellar/contracts";

const server = new rpc.Server(SOROBAN_RPC_URL, {
  allowHttp: SOROBAN_RPC_URL.startsWith("http://"),
});

// ---------------------------------------------------------------------------
// ScVal argument helpers
// ---------------------------------------------------------------------------

/** 32-byte hex → ScVal bytes (e.g. a market id). */
export const bytesArg = (hex: string): xdr.ScVal =>
  nativeToScVal(Buffer.from(hex, "hex"), { type: "bytes" });

export const addressArg = (g: string): xdr.ScVal => new Address(g).toScVal();
export const u32Arg = (n: number): xdr.ScVal => nativeToScVal(n, { type: "u32" });
export const i128Arg = (n: bigint): xdr.ScVal => nativeToScVal(n, { type: "i128" });

const toHex = (u: Uint8Array): string =>
  Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");

// ---------------------------------------------------------------------------
// Generic read / write
// ---------------------------------------------------------------------------

/** Read-only call: simulate and decode the return value. */
export async function readContract(
  sourceAddress: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<unknown> {
  const account = await server.getAccount(sourceAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const retval = sim.result?.retval;
  return retval ? scValToNative(retval) : null;
}

/** State-changing call: prepare, sign with the connected wallet, submit, await success. */
export async function writeContract(
  walletAddress: string,
  contractId: string,
  method: string,
  args: xdr.ScVal[] = [],
): Promise<string> {
  const account = await server.getAccount(walletAddress);
  const built = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(new Contract(contractId).call(method, ...args))
    .setTimeout(60)
    .build();

  const prepared = await server.prepareTransaction(built);
  const { signedTxXdr } = await walletKit.signTransaction(prepared.toXDR(), {
    address: walletAddress,
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const sent = await server.sendTransaction(signed);
  if (sent.status === "ERROR") {
    throw new Error(`submit failed: ${JSON.stringify(sent.errorResult)}`);
  }

  let got = await server.getTransaction(sent.hash);
  for (let i = 0; i < 30 && got.status === "NOT_FOUND"; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    got = await server.getTransaction(sent.hash);
  }
  if (got.status !== "SUCCESS") {
    throw new Error(`transaction ${got.status}: ${sent.hash}`);
  }
  return sent.hash;
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
  const ids = (await readContract(READ_SOURCE, CONTRACTS.market, "markets")) as
    | Uint8Array[]
    | null;
  const out: OnChainMarket[] = [];
  for (const idBytes of ids ?? []) {
    const hex = toHex(idBytes);
    const m = await getMarket(hex).catch(() => null);
    if (m) out.push(m);
  }
  return out;
}

/** Fetch a single market's state by 32-byte hex id. */
export async function getMarket(idHex: string): Promise<OnChainMarket> {
  const m = (await readContract(READ_SOURCE, CONTRACTS.market, "get_market", [
    bytesArg(idHex),
  ])) as {
    question: string;
    close_ts: bigint | number;
    status: bigint | number;
    outcome: bigint | number;
  };
  return {
    id: idHex,
    question: m.question,
    closeTs: Number(m.close_ts),
    status: Number(m.status),
    outcome: Number(m.outcome),
  };
}

export async function isResolved(idHex: string): Promise<boolean> {
  return Boolean(
    await readContract(READ_SOURCE, CONTRACTS.market, "is_resolved", [bytesArg(idHex)]),
  );
}

/** Winning outcome (0 YES / 1 NO / 2 INVALID) for a resolved market. */
export async function winningOutcome(idHex: string): Promise<number> {
  return Number(
    await readContract(READ_SOURCE, CONTRACTS.market, "winning_outcome", [bytesArg(idHex)]),
  );
}

// ---------------------------------------------------------------------------
// CLOB settlement contract (accounts, positions, redeem)
// ---------------------------------------------------------------------------

/** Internal account balance (quote atoms) held in the settlement contract. */
export async function balance(trader: string): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.clobSettlement, "balance", [
    addressArg(trader),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

/** Shares a holder owns on a given market outcome. */
export async function position(
  holder: string,
  marketHex: string,
  outcome: number,
): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.clobSettlement, "position", [
    addressArg(holder),
    bytesArg(marketHex),
    u32Arg(outcome),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

/** Total escrow locked for a market. */
export async function escrow(marketHex: string): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.clobSettlement, "escrow", [
    bytesArg(marketHex),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

/** Deposit quote funds into the settlement account (signed by the trader). */
export async function deposit(trader: string, amount: bigint): Promise<string> {
  return writeContract(trader, CONTRACTS.clobSettlement, "deposit", [
    addressArg(trader),
    i128Arg(amount),
  ]);
}

/** Redeem winning shares after resolution; returns the payout tx hash. */
export async function redeem(
  holder: string,
  marketHex: string,
  shares: bigint,
): Promise<string> {
  return writeContract(holder, CONTRACTS.clobSettlement, "redeem", [
    addressArg(holder),
    bytesArg(marketHex),
    i128Arg(shares),
  ]);
}

// ---------------------------------------------------------------------------
// mUSDC token + faucet
// ---------------------------------------------------------------------------

/** Claim test mUSDC to `to` (open faucet, signed by the connected wallet). */
export async function faucet(to: string): Promise<string> {
  return writeContract(to, CONTRACTS.musdc, "faucet", [addressArg(to)]);
}

/** mUSDC balance (base units) for an address. */
export async function musdcBalance(addr: string): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.musdc, "balance", [addressArg(addr)]);
  return BigInt((v as bigint | number | null) ?? 0);
}

// ---------------------------------------------------------------------------
// predict-escrow (real mUSDC bet escrow + pari-mutuel payout)
// ---------------------------------------------------------------------------

/** Escrow `amountUsdc` mUSDC on an outcome (0=YES, 1=NO) of an on-chain market. */
export async function escrowBet(
  walletAddress: string,
  marketIdHex: string,
  outcome: number,
  amountUsdc: number,
): Promise<string> {
  return writeContract(walletAddress, CONTRACTS.predictEscrow, "bet", [
    bytesArg(marketIdHex),
    addressArg(walletAddress),
    u32Arg(outcome),
    i128Arg(BigInt(Math.round(amountUsdc * MUSDC_UNIT))),
  ]);
}

/** Claim winnings on a resolved on-chain market. */
export async function escrowRedeem(walletAddress: string, marketIdHex: string): Promise<string> {
  return writeContract(walletAddress, CONTRACTS.predictEscrow, "redeem", [
    bytesArg(marketIdHex),
    addressArg(walletAddress),
  ]);
}

/** A wallet's escrowed stake (base units) on (market, outcome). */
export async function escrowPosition(
  marketIdHex: string,
  outcome: number,
  who: string,
): Promise<bigint> {
  const v = await readContract(who, CONTRACTS.predictEscrow, "position", [
    bytesArg(marketIdHex),
    u32Arg(outcome),
    addressArg(who),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

/** Total mUSDC (base units) escrowed across both sides of a market. */
export async function escrowTotal(marketIdHex: string): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.predictEscrow, "total", [
    bytesArg(marketIdHex),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

/** Total mUSDC (base units) escrowed on one outcome (the real on-chain pool). */
export async function escrowPool(marketIdHex: string, outcome: number): Promise<bigint> {
  const v = await readContract(READ_SOURCE, CONTRACTS.predictEscrow, "pool", [
    bytesArg(marketIdHex),
    u32Arg(outcome),
  ]);
  return BigInt((v as bigint | number | null) ?? 0);
}

// ---------------------------------------------------------------------------
// LP vault (deposit mUSDC on-chain, earn trading fees)
// ---------------------------------------------------------------------------

/**
 * Privacy bet: escrow `amountUsdc` mUSDC on `outcome`, gated by a Groth16 proof
 * that the `verifier` contract checks ON-CHAIN before the escrow accepts it (the
 * proof's nullifier is burned, single-use). The proof comes from the backend ZK
 * service. Wallet-signed.
 */
export async function escrowBetZk(
  walletAddress: string,
  marketIdHex: string,
  outcome: number,
  amountUsdc: number,
  proof: { a: string; b: string; c: string },
  publicInputs: string[],
  domain: string,
): Promise<string> {
  // The Proof struct must be a map with SYMBOL keys (a,b,c) — nativeToScVal on a
  // plain object emits string keys, which the contract rejects (UnexpectedType).
  const proofBytes = (hex: string) => nativeToScVal(Buffer.from(hex, "hex"), { type: "bytes" });
  const proofScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("a"), val: proofBytes(proof.a) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("b"), val: proofBytes(proof.b) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("c"), val: proofBytes(proof.c) }),
  ]);
  const piScVal = nativeToScVal(publicInputs.map((h) => Buffer.from(h, "hex")));
  return writeContract(walletAddress, CONTRACTS.predictEscrow, "bet_zk", [
    bytesArg(marketIdHex),
    addressArg(walletAddress),
    u32Arg(outcome),
    i128Arg(BigInt(Math.round(amountUsdc * MUSDC_UNIT))),
    proofScVal,
    piScVal,
    bytesArg(domain),
  ]);
}

/** Deposit `amountUsdc` mUSDC into the on-chain LP vault (wallet-signed). */
export async function vaultDepositOnChain(
  walletAddress: string,
  amountUsdc: number,
): Promise<string> {
  return writeContract(walletAddress, CONTRACTS.vault, "deposit", [
    addressArg(walletAddress),
    i128Arg(BigInt(Math.round(amountUsdc * MUSDC_UNIT))),
  ]);
}

// ---------------------------------------------------------------------------
// confidential-bet (hidden-side commitment notes + on-chain ZK claim)
// ---------------------------------------------------------------------------

/**
 * Escrow one fixed-denomination (100 mUSDC) commitment note. The `commitment` is
 * a binding hash of an off-chain note (secret, nullifier, chosen side) — nothing
 * on-chain reveals which outcome it backs, and the uniform denom hides the amount.
 * Wallet-signed (the wallet authorizes the mUSDC transfer in the same tx).
 */
export async function confidentialCommit(
  walletAddress: string,
  commitmentHex: string,
): Promise<string> {
  return writeContract(walletAddress, CONTRACTS.confidentialBet, "commit", [
    addressArg(walletAddress),
    bytesArg(commitmentHex),
  ]);
}

/**
 * Claim a winning confidential note. The proof (from the backend) is verified
 * ON-CHAIN: the contract injects the resolved winning outcome as a public input,
 * so only a note that backed the winner verifies. The nullifier is burned
 * (single-use) and `PAYOUT_MULT × denom` mUSDC is paid to the wallet — unlinkable
 * to the deposit. `claim` needs no auth, but the wallet is the source + recipient.
 */
export async function confidentialClaim(
  walletAddress: string,
  marketIdHex: string,
  proof: { a: string; b: string; c: string },
  nullifierHashHex: string,
  recipientFieldHex: string,
  rootHex: string,
): Promise<string> {
  const pb = (hex: string) => nativeToScVal(Buffer.from(hex, "hex"), { type: "bytes" });
  const proofScVal = xdr.ScVal.scvMap([
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("a"), val: pb(proof.a) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("b"), val: pb(proof.b) }),
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("c"), val: pb(proof.c) }),
  ]);
  // claim(market_id, proof, nullifier_hash, recipient, recipient_field, root)
  return writeContract(walletAddress, CONTRACTS.confidentialBet, "claim", [
    bytesArg(marketIdHex),
    proofScVal,
    bytesArg(nullifierHashHex),
    addressArg(walletAddress),
    bytesArg(recipientFieldHex),
    bytesArg(rootHex),
  ]);
}
