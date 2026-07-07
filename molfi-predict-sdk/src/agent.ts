/**
 * MolfiAgent — the one-class API for an autonomous trader on Avalanche Fuji.
 *
 *   const agent = MolfiAgent.create();          // fresh EVM wallet
 *   await agent.onboard();                       // mint mUSDC from the faucet
 *   const markets = await agent.markets();       // live order book / odds
 *   await agent.bet(onChainMarketId, 0, 100);    // escrow 100 mUSDC on YES
 *   await agent.redeem(onChainMarketId);         // claim winnings after resolution
 *
 * Data (markets, odds, leaderboard, vaults) comes from the Molfi market engine;
 * money movement (faucet, bet, redeem) is real on-chain, signed by the agent's
 * own secp256k1 key via viem.
 */
import { TESTNET, fromBaseUnits, type MolfiConfig } from "./config.js";
import {
  generateWallet,
  walletFromSecret,
  fundWithFriendbot,
  type MolfiWallet,
} from "./wallet.js";
import { MolfiChain, type Groth16Proof } from "./chain.js";
import {
  fetchMarkets,
  fetchMarket,
  fetchOrderBook,
  fetchPrices,
  fetchLeaderboard,
  fetchVaults,
  fetchOnChainMarkets,
} from "./data.js";

export interface OnboardResult {
  address: string;
  /** Always false on Fuji (no friendbot); retained for shape compatibility. */
  xlmFunded: boolean;
  musdc: number;
}

export class MolfiAgent {
  readonly config: MolfiConfig;
  readonly wallet: MolfiWallet;
  readonly chain: MolfiChain;

  constructor(secret: string, config: MolfiConfig = TESTNET) {
    this.config = config;
    this.wallet = walletFromSecret(secret);
    this.chain = new MolfiChain({ config, privateKey: this.wallet.privateKey });
  }

  /** Spin up an agent with a brand-new wallet. Save `agent.wallet.secret`. */
  static create(config: MolfiConfig = TESTNET): MolfiAgent {
    return new MolfiAgent(generateWallet().secret, config);
  }

  get address(): string {
    return this.wallet.address;
  }

  /** Claim test mUSDC from the open faucet. (Gas AVAX must be funded separately.) */
  async onboard(): Promise<OnboardResult> {
    const xlmFunded = await fundWithFriendbot(this.address, this.config);
    await this.chain.faucet();
    return { address: this.address, xlmFunded, musdc: await this.musdc() };
  }

  // ── Market data ──────────────────────────────────────────────────────────
  markets(status: "open" | "closed" = "open") {
    return fetchMarkets(this.config, status);
  }
  market(id: string) {
    return fetchMarket(id, this.config);
  }
  orderBook(id: string) {
    return fetchOrderBook(id, this.config);
  }
  prices(symbol: string, limit = 120) {
    return fetchPrices(symbol, limit, this.config);
  }
  leaderboard() {
    return fetchLeaderboard(this.config);
  }
  vaults() {
    return fetchVaults(this.config);
  }
  /** On-chain market ids (32-byte hex) the agent can actually bet on. */
  onChainMarkets() {
    return fetchOnChainMarkets(this.config);
  }

  // ── Trading (real on-chain mUSDC) ─────────────────────────────────────────
  /** mUSDC balance as a human number. */
  async musdc(): Promise<number> {
    return fromBaseUnits(await this.chain.musdcBalance(), this.config.decimals);
  }
  /** Escrow `amount` mUSDC on an outcome (0=YES, 1=NO) of an on-chain market. */
  bet(marketId: string, outcome: number, amount: number) {
    return this.chain.bet(marketId, outcome, amount);
  }
  /** Privacy bet gated by a Groth16 proof verified on-chain (BN254). */
  betZk(
    marketId: string,
    outcome: number,
    amount: number,
    proof: Groth16Proof,
    publicInputs: (string | bigint)[],
  ) {
    return this.chain.betZk(marketId, outcome, amount, proof, publicInputs);
  }
  /** Claim winnings after the market resolves. */
  redeem(marketId: string) {
    return this.chain.redeem(marketId);
  }
  winningOutcome(marketId: string) {
    return this.chain.winningOutcome(marketId);
  }
  isResolved(marketId: string) {
    return this.chain.isResolved(marketId);
  }
}
