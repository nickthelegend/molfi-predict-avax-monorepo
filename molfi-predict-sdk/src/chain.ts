/**
 * The on-chain layer: real Soroban calls to Molfi's contracts, signed by a
 * Stellar keypair (so an autonomous agent can transact without a browser
 * wallet). Reads go through simulation; writes are prepared, signed, submitted
 * and awaited.
 *
 *   chain.faucet()                        → claim test mUSDC
 *   chain.musdcBalance()                  → read mUSDC balance
 *   chain.bet(marketId, YES, 1000)        → escrow real mUSDC on an outcome
 *   chain.betZk(...)                      → bet gated by an on-chain Groth16 proof
 *   chain.redeem(marketId)                → claim winnings after resolution
 *   chain.winningOutcome(marketId)        → read resolved outcome
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
  Keypair,
} from "@stellar/stellar-sdk";
import { TESTNET, toBaseUnits, type MolfiConfig } from "./config.js";

const hexBytes = (hex: string): xdr.ScVal =>
  nativeToScVal(Buffer.from(hex.replace(/^0x/, ""), "hex"), { type: "bytes" });
const addr = (g: string): xdr.ScVal => new Address(g).toScVal();
const u32 = (n: number): xdr.ScVal => nativeToScVal(n, { type: "u32" });
const i128 = (n: bigint): xdr.ScVal => nativeToScVal(n, { type: "i128" });

export interface Groth16Proof {
  /** 96-byte hex (G1). */ a: string;
  /** 192-byte hex (G2). */ b: string;
  /** 96-byte hex (G1). */ c: string;
}

export interface ChainOptions {
  config?: MolfiConfig;
  /** S... secret seed for signing writes. Omit for read-only. */
  secret?: string;
}

export class MolfiChain {
  readonly config: MolfiConfig;
  readonly server: rpc.Server;
  private readonly keypair?: Keypair;

  constructor(opts: ChainOptions = {}) {
    this.config = opts.config ?? TESTNET;
    this.server = new rpc.Server(this.config.rpcUrl, {
      allowHttp: this.config.rpcUrl.startsWith("http://"),
    });
    if (opts.secret) this.keypair = Keypair.fromSecret(opts.secret);
  }

  /** The signer's public key, or undefined if read-only. */
  get address(): string | undefined {
    return this.keypair?.publicKey();
  }

  private requireKeypair(): Keypair {
    if (!this.keypair) throw new Error("No signer — construct MolfiChain with { secret }");
    return this.keypair;
  }

  /** Read-only contract call via simulation. */
  async read(contractId: string, method: string, args: xdr.ScVal[] = []): Promise<unknown> {
    const source = this.keypair?.publicKey() ?? this.config.readSource;
    const account = await this.server.getAccount(source);
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(new Contract(contractId).call(method, ...args))
      .setTimeout(30)
      .build();
    const sim = await this.server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(sim)) throw new Error(sim.error);
    return sim.result?.retval ? scValToNative(sim.result.retval) : null;
  }

  /** State-changing call: prepare, sign, submit, await success. Returns tx hash. */
  async write(contractId: string, method: string, args: xdr.ScVal[] = []): Promise<string> {
    const kp = this.requireKeypair();
    const account = await this.server.getAccount(kp.publicKey());
    const built = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: this.config.networkPassphrase,
    })
      .addOperation(new Contract(contractId).call(method, ...args))
      .setTimeout(60)
      .build();
    const prepared = await this.server.prepareTransaction(built);
    prepared.sign(kp);
    const sent = await this.server.sendTransaction(prepared);
    if (sent.status === "ERROR") {
      throw new Error(`submit failed: ${JSON.stringify(sent.errorResult)}`);
    }
    let got = await this.server.getTransaction(sent.hash);
    for (let i = 0; i < 30 && got.status === "NOT_FOUND"; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      got = await this.server.getTransaction(sent.hash);
    }
    if (got.status !== "SUCCESS") throw new Error(`transaction ${got.status}: ${sent.hash}`);
    return sent.hash;
  }

  // ── mUSDC ──────────────────────────────────────────────────────────────────

  /** Claim test mUSDC from the open faucet (defaults to the signer). */
  faucet(to?: string): Promise<string> {
    return this.write(this.config.contracts.musdc, "faucet", [
      addr(to ?? this.requireKeypair().publicKey()),
    ]);
  }

  /** mUSDC balance in base units (7 decimals). */
  async musdcBalance(who?: string): Promise<bigint> {
    const target = who ?? this.address ?? this.config.readSource;
    const v = await this.read(this.config.contracts.musdc, "balance", [addr(target)]);
    return BigInt((v as bigint | number | null) ?? 0);
  }

  // ── Betting (predict-escrow) ─────────────────────────────────────────────────

  /** Escrow real mUSDC on an outcome (0=YES, 1=NO). `amount` is human mUSDC. */
  bet(marketId: string, outcome: number, amount: number): Promise<string> {
    return this.write(this.config.contracts.predictEscrow, "bet", [
      hexBytes(marketId),
      addr(this.requireKeypair().publicKey()),
      u32(outcome),
      i128(toBaseUnits(amount, this.config.musdcDecimals)),
    ]);
  }

  /**
   * Privacy bet: escrow gated by an on-chain Groth16 proof. The proof is
   * verified by the verifier contract inside this transaction and its nullifier
   * is burned (single-use). `publicInputs`/`domain` are 32-byte hex.
   */
  betZk(
    marketId: string,
    outcome: number,
    amount: number,
    proof: Groth16Proof,
    publicInputs: string[],
    domain: string,
  ): Promise<string> {
    // Proof struct needs SYMBOL keys (a,b,c); a plain object emits string keys
    // which the contract rejects (Error(Value, UnexpectedType)).
    const pb = (hex: string) => nativeToScVal(Buffer.from(hex, "hex"), { type: "bytes" });
    const proofScVal = xdr.ScVal.scvMap([
      new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("a"), val: pb(proof.a) }),
      new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("b"), val: pb(proof.b) }),
      new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol("c"), val: pb(proof.c) }),
    ]);
    const piScVal = nativeToScVal(
      publicInputs.map((h) => Buffer.from(h, "hex")),
    );
    return this.write(this.config.contracts.predictEscrow, "bet_zk", [
      hexBytes(marketId),
      addr(this.requireKeypair().publicKey()),
      u32(outcome),
      i128(toBaseUnits(amount, this.config.musdcDecimals)),
      proofScVal,
      piScVal,
      hexBytes(domain),
    ]);
  }

  /** Claim winnings after the market resolves. Returns tx hash. */
  redeem(marketId: string): Promise<string> {
    return this.write(this.config.contracts.predictEscrow, "redeem", [
      hexBytes(marketId),
      addr(this.requireKeypair().publicKey()),
    ]);
  }

  async escrowTotal(marketId: string): Promise<bigint> {
    const v = await this.read(this.config.contracts.predictEscrow, "total", [hexBytes(marketId)]);
    return BigInt((v as bigint | number | null) ?? 0);
  }
  async escrowPosition(marketId: string, outcome: number, who?: string): Promise<bigint> {
    const target = who ?? this.address ?? this.config.readSource;
    const v = await this.read(this.config.contracts.predictEscrow, "position", [
      hexBytes(marketId),
      u32(outcome),
      addr(target),
    ]);
    return BigInt((v as bigint | number | null) ?? 0);
  }

  // ── Market resolution (read) ─────────────────────────────────────────────────

  async isResolved(marketId: string): Promise<boolean> {
    return Boolean(await this.read(this.config.contracts.market, "is_resolved", [hexBytes(marketId)]));
  }
  /** 0=YES, 1=NO, 2=INVALID. Throws if the market isn't resolved. */
  async winningOutcome(marketId: string): Promise<number> {
    return Number(await this.read(this.config.contracts.market, "winning_outcome", [hexBytes(marketId)]));
  }
  /** Permissionlessly settle an oracle market after its close time. */
  resolveFromOracle(marketId: string): Promise<string> {
    return this.write(this.config.contracts.market, "resolve_from_oracle", [hexBytes(marketId)]);
  }
}
