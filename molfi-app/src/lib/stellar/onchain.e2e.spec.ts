// @vitest-environment node
/**
 * LIVE end-to-end test of Molfi's on-chain layer against the REAL deployed
 * contracts on Avalanche Fuji. It drives the app's OWN chain functions
 * (soroban.ts) — the exact code the premium UI calls — through a full trade:
 *
 *   faucet mUSDC → escrow a bet → (admin) resolve from the live Chainlink
 *   BTC/USD feed → read pool/position/outcome → redeem the pari-mutuel payout.
 *
 * Runs only when VITE_MOLFI_E2E_KEY (a funded Fuji key that is the market admin)
 * is set, so the default `npm test` stays offline-green (this suite is skipped):
 *   VITE_MOLFI_E2E_KEY=0x... npx vitest run src/lib/stellar/onchain.e2e.spec.ts
 *
 * (Read via import.meta.env, not process.env: vite-plugin-node-polyfills shims
 * `process` in the test env, so process.env is empty here.)
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  createWalletClient,
  http,
  keccak256,
  toHex,
  getAddress,
  type Abi,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  fujiChain,
  publicClient,
  setWalletClient,
  faucet,
  musdcBalance,
  listMarkets,
  escrowBet,
  escrowPool,
  escrowPosition,
  escrowTotal,
  isResolved,
  winningOutcome,
  escrowRedeem,
} from "./soroban";
import { CONTRACTS, MUSDC_UNIT, OUTCOME, BTC_USD_FEED } from "./contracts";

const KEY = import.meta.env.VITE_MOLFI_E2E_KEY as `0x${string}` | undefined;
const unit = (base: bigint) => Number(base) / MUSDC_UNIT;

const MARKET_ADMIN_ABI = [
  { type: "function", name: "createPriceMarket", stateMutability: "nonpayable", inputs: [
    { type: "bytes32" }, { type: "string" }, { type: "uint64" }, { type: "address" }, { type: "int256" }, { type: "uint8" }, { type: "uint64" },
  ], outputs: [] },
  { type: "function", name: "resolveFromOracle", stateMutability: "nonpayable", inputs: [{ type: "bytes32" }], outputs: [] },
] as const satisfies Abi;

describe.skipIf(!KEY)("molfi on-chain e2e (live Fuji)", () => {
  const STAKE = 5; // mUSDC on YES
  let me: `0x${string}`;
  let wallet: WalletClient;
  let marketId: `0x${string}`;

  beforeAll(() => {
    const account = privateKeyToAccount(KEY!);
    me = account.address;
    wallet = createWalletClient({ account, chain: fujiChain, transport: http() });
    setWalletClient(wallet, me); // the app's write path now signs with this wallet
    // Unique market per run → idempotent, re-runnable.
    marketId = keccak256(toHex(`molfi-e2e:${Date.now()}:${me}`));
  });

  it("faucets mUSDC to the connected wallet", async () => {
    const before = await musdcBalance(me);
    await faucet(me);
    const after = await musdcBalance(me);
    expect(unit(after - before)).toBe(1000); // faucet mints 1,000 mUSDC
  }, 120_000);

  it("enumerates the seeded markets", async () => {
    const markets = await listMarkets();
    expect(markets.length).toBeGreaterThanOrEqual(5);
    expect(markets.every((m) => typeof m.question === "string" && m.question.length > 0)).toBe(true);
  }, 60_000);

  it("creates a fresh price market, bets YES, and reflects the stake on-chain", async () => {
    const closeTs = BigInt(Math.floor(Date.now() / 1000) - 30); // already closed → resolvable now
    const createHash = await wallet.writeContract({
      address: getAddress(CONTRACTS.market),
      abi: MARKET_ADMIN_ABI,
      functionName: "createPriceMarket",
      args: [marketId, "E2E: BTC >= $50,000?", closeTs, getAddress(BTC_USD_FEED), 50_000n * 10n ** 8n, 0, 86_400n],
      account: wallet.account!,
      chain: fujiChain,
    });
    await publicClient.waitForTransactionReceipt({ hash: createHash });

    await escrowBet(me, marketId, OUTCOME.YES, STAKE); // the app's own bet path

    expect(unit(await escrowPool(marketId, OUTCOME.YES))).toBe(STAKE);
    expect(unit(await escrowPosition(marketId, OUTCOME.YES, me))).toBe(STAKE);
    expect(unit(await escrowTotal(marketId))).toBe(STAKE);
  }, 180_000);

  it("resolves YES from the live Chainlink feed and pays the pari-mutuel winner", async () => {
    const resolveHash = await wallet.writeContract({
      address: getAddress(CONTRACTS.market),
      abi: MARKET_ADMIN_ABI,
      functionName: "resolveFromOracle",
      args: [marketId],
      account: wallet.account!,
      chain: fujiChain,
    });
    await publicClient.waitForTransactionReceipt({ hash: resolveHash });

    expect(await isResolved(marketId)).toBe(true);
    expect(await winningOutcome(marketId)).toBe(OUTCOME.YES); // BTC ≫ $50k

    const before = await musdcBalance(me);
    await escrowRedeem(me, marketId); // the app's own redeem path
    const gained = unit((await musdcBalance(me)) - before);
    // Sole YES bettor recovers the whole pool. The deployer is also the fee
    // vault here, so the 2% fee routes back to the same address → net gain = full
    // stake. (The fee SPLIT itself is asserted in molfi-contracts Molfi.t.sol's
    // test_PredictEscrowPariMutuel, where vault ≠ bettor and the winner nets 98%.)
    expect(gained).toBeCloseTo(STAKE, 5);
  }, 180_000);
});
