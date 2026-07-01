/**
 * Autonomous Molfi trading agent — runnable demo.
 *
 *   cd molfi-predict-sdk && npm install && npm run build
 *   node examples/agent-trade.mjs
 *
 * It generates a wallet, funds itself (friendbot + mUSDC faucet), reads the live
 * markets, and — if an on-chain market is available — places a REAL mUSDC bet
 * and reads back its escrowed position. Pass MOLFI_MARKET_ID=<32-byte hex> to
 * bet on a specific on-chain market.
 */
import { MolfiAgent, OUTCOME_YES } from "../dist/index.js";

const log = (...a) => console.log(...a);

const agent = MolfiAgent.create();
log("🪪  new agent wallet:", agent.address);
log("    (secret — keep safe):", agent.wallet.secret.slice(0, 8) + "…");

log("\n⛽  onboarding (friendbot XLM + mUSDC faucet)…");
const onboarded = await agent.onboard();
log("    XLM funded:", onboarded.xlmFunded, "| mUSDC:", onboarded.musdc);

log("\n📈  live markets (top 3 by implied YES odds):");
const markets = await agent.markets();
for (const m of markets.slice(0, 3)) {
  log(`    ${m.symbol}  ${(m.yesPrice * 100).toFixed(0)}% YES  —  ${m.question}`);
}

log("\n🏆  leaderboard (top 3 by PnL):");
for (const r of (await agent.leaderboard()).slice(0, 3)) {
  log(`    #${r.rank}  ${r.address.slice(0, 8)}…  PnL ${r.pnl}  win% ${r.winRate}`);
}

const marketId = process.env.MOLFI_MARKET_ID || (await agent.onChainMarkets())[0]?.marketId;
if (!marketId) {
  log("\nℹ️  No on-chain market id available to bet on.");
  log("    Set MOLFI_MARKET_ID=<32-byte hex>, or run molfi-contracts/scripts/agent_onchain_bet.sh.");
  process.exit(0);
}

log(`\n🎯  placing a REAL on-chain bet: 100 mUSDC on YES of ${marketId.slice(0, 12)}…`);
const tx = await agent.bet(marketId, OUTCOME_YES, 100);
log("    bet tx:", tx);
log("    escrowed YES position:", Number(await agent.chain.escrowPosition(marketId, OUTCOME_YES)) / 1e7, "mUSDC");
log("    mUSDC balance now:", await agent.musdc());
log("\n✅  Done. When the market resolves, call agent.redeem(marketId) to claim winnings.");
