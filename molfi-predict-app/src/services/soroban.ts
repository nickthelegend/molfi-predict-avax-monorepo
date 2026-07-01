/**
 * Soroban contract calls from the browser — reads via simulation, writes signed
 * by the connected Stellar wallet (via Stellar Wallets Kit).
 */
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
import { walletKit, NETWORK_PASSPHRASE } from "@/lib/stellar/walletKit";
import { STELLAR_RPC_URL, READ_SOURCE, CONTRACTS } from "@/config/molfi";

const server = new rpc.Server(STELLAR_RPC_URL, { allowHttp: STELLAR_RPC_URL.startsWith("http://") });

/** 32-byte hex → ScVal bytes (e.g. a market id). */
export const bytesArg = (hex: string): xdr.ScVal =>
  nativeToScVal(Buffer.from(hex, "hex"), { type: "bytes" });

export const addressArg = (g: string): xdr.ScVal => new Address(g).toScVal();
export const u32Arg = (n: number): xdr.ScVal => nativeToScVal(n, { type: "u32" });
export const i128Arg = (n: bigint): xdr.ScVal => nativeToScVal(n, { type: "i128" });

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

  // Poll for confirmation.
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

export interface OnChainMarket {
  id: string; // hex
  question: string;
  closeTs: number;
  status: number; // 0 Trading, 1 Resolving, 2 Resolved
  outcome: number; // 0 YES, 1 NO, 2 INVALID
}

const toHex = (u: Uint8Array): string =>
  Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");

/** Enumerate all markets from the `market` contract and fetch each one's state. */
export async function listMarkets(): Promise<OnChainMarket[]> {
  const ids = (await readContract(READ_SOURCE, CONTRACTS.market, "markets")) as Uint8Array[];
  const out: OnChainMarket[] = [];
  for (const idBytes of ids ?? []) {
    const hex = toHex(idBytes);
    try {
      const m = (await readContract(READ_SOURCE, CONTRACTS.market, "get_market", [
        bytesArg(hex),
      ])) as any;
      out.push({
        id: hex,
        question: m.question,
        closeTs: Number(m.close_ts),
        status: Number(m.status),
        outcome: Number(m.outcome),
      });
    } catch {
      /* skip unreadable market */
    }
  }
  return out;
}
