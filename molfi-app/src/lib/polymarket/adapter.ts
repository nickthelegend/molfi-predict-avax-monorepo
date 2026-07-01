import type { PolymarketMarket } from "@/lib/polymarket/client";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

/**
 * Map a live Polymarket market into the LeverX catalog row the rich grid/table
 * render. `strikeRaw: 0` disables the Sui ask query (so no skeleton); the YES
 * probability becomes the card's premium (0.405 → 40.5¢), and the Polymarket
 * image rides along as `iconUrl`.
 */
export function polymarketToRow(m: PolymarketMarket, categoryId: string): LeverxMarketRow {
  return {
    id: `pm-${m.id}`,
    oracleId: `pm-${m.id}`,
    asset: "",
    strike: 0,
    strikeRaw: 0,
    higherStrikeRaw: 0,
    expiry: m.endDate ?? 0,
    isUp: true,
    isRange: false,
    lastAskPremium: m.yesPrice != null ? m.yesPrice * 100 : null,
    quotePaused: false,
    volume: m.volume24h,
    status: m.closed ? "resolved" : "active",
    question: m.question,
    iconUrl: m.icon ?? m.image ?? undefined,
    category: categoryId,
    source: "polymarket",
  };
}
