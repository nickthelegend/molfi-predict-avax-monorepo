import type { OnChainMarket } from "@/lib/stellar/soroban";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { MARKET_STATUS } from "@/lib/stellar/contracts";

/** Best-effort asset symbol from a market question, for the card's asset badge. */
function assetFromQuestion(question: string): string {
  const m = question
    .toUpperCase()
    .match(/\b(BTC|ETH|XLM|SOL|USDC|BITCOIN|ETHEREUM|STELLAR|SOLANA)\b/);
  if (!m) return "XLM";
  const canon: Record<string, string> = {
    BITCOIN: "BTC",
    ETHEREUM: "ETH",
    STELLAR: "XLM",
    SOLANA: "SOL",
  };
  return canon[m[1]] ?? m[1];
}

/**
 * Map an on-chain Molfi market into the LeverX catalog row the rich Markets
 * grid/table already render. `strikeRaw: 0` makes `marketRowToKey` return
 * undefined, which disables the Sui ask/premium fetch (so cards render straight
 * away instead of sitting in skeletons). The binary-market specifics
 * (question / status / outcome) ride along on the row and surface in the card.
 */
export function stellarMarketToRow(m: OnChainMarket): LeverxMarketRow {
  return {
    id: m.id,
    // Unique per market (the grid + hero dedupe on oracleId). `strikeRaw: 0`
    // below is what disables the Sui ask query, so this stays browser-safe.
    oracleId: m.id,
    asset: assetFromQuestion(m.question),
    strike: 0,
    strikeRaw: 0,
    higherStrikeRaw: 0,
    expiry: m.closeTs * 1000,
    isUp: true,
    isRange: false,
    lastAskPremium: null,
    quotePaused: false,
    volume: 0,
    status: m.status === MARKET_STATUS.RESOLVED ? "resolved" : "active",
    question: m.question,
    onchainStatus: m.status,
    onchainOutcome: m.outcome,
  };
}
