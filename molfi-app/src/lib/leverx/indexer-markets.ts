import { FLOAT_SCALING } from "@/lib/predict/constants";
import type { GlobalMarketTrade, MarketCatalogEntry } from "@/lib/leverx/indexer-client";
import { premiumPerUnitFromMintCost } from "@/lib/leverx/trade-math";
import type { PredictSide } from "@/lib/predict/instruments";
import { scaleQuote } from "@/lib/predict/scaling";

export interface LeverxMarketRow {
  id: string;
  oracleId: string;
  asset: string;
  strike: number;
  strikeRaw: number;
  expiry: number;
  higherStrikeRaw: number;
  isUp: boolean;
  isRange: boolean;
  lastAskPremium: number | null;
  /** Live on-chain contract quote unavailable after fetch attempt. */
  quotePaused?: boolean;
  volume: number;
  status: string;
  /** Live spot from Predict server (USD). */
  spotPrice?: number | null;
  oracleStatus?: string;
  underlyingAsset?: string;
  /** Oracle strike grid (raw 1e9) — used for ATM UP quotes on catalog cards. */
  minStrikeRaw?: number;
  tickSizeRaw?: number;
  /** Stellar binary-market extras — carried through gridUpDisplayRow's spread. */
  question?: string;
  onchainStatus?: number;
  onchainOutcome?: number;
  /** Market thumbnail (Polymarket image/icon URL). Falls back to the asset badge. */
  iconUrl?: string;
  /** Category id ("crypto" | "sports" | "politics" | …) for filtering + labels. */
  category?: string;
  /** Source venue: on-chain Stellar, or a live Polymarket reference market. */
  source?: "stellar" | "polymarket";
}

const SCALE = Number(FLOAT_SCALING);

/** ask_price / bid_price → display cents (0–100) */
export function premiumToCents(premium: number): number {
  if (premium <= 0) return 0;
  return (premium / SCALE) * 100;
}

/** Per-contract premium (1e9) from a global tape row, with cost/payout fallback. */
export function tradePremiumRaw(trade: GlobalMarketTrade): number | null {
  if (trade.trade_side === "mint") {
    if (trade.ask_price != null && trade.ask_price > 0) return trade.ask_price;
    if (trade.cost != null && trade.cost > 0 && trade.quantity > 0) {
      return Number(premiumPerUnitFromMintCost(BigInt(trade.cost), BigInt(trade.quantity)));
    }
    return null;
  }
  if (trade.bid_price != null && trade.bid_price > 0) return trade.bid_price;
  if (trade.payout != null && trade.payout > 0 && trade.quantity > 0) {
    return Number(premiumPerUnitFromMintCost(BigInt(trade.payout), BigInt(trade.quantity)));
  }
  return null;
}

export function formatPremiumCents(premium: number): string {
  return `${premiumToCents(premium).toFixed(1)}¢`;
}

export function formatPremiumOrPlaceholder(premium: number | null | undefined): string {
  if (premium == null || premium <= 0) return "_";
  return formatPremiumCents(premium);
}

/** Contract price on markets list — paused markets show 0¢ instead of a badge. */
export function formatMarketContractPrice(args: {
  premium?: number | null;
  quotePaused?: boolean;
  loading?: boolean;
}): string {
  if (args.loading) return "…";
  if (args.quotePaused) return "0¢";
  return formatPremiumOrPlaceholder(args.premium);
}

/** Prefer live on-chain ask; fall back to indexer catalog premium. */
export function formatContractPremiumLabel(args: {
  liveAskRaw?: bigint | null;
  catalogPremium?: number | null;
  loading?: boolean;
}): string {
  if (args.liveAskRaw != null && args.liveAskRaw > 0n) {
    return formatPremiumCents(Number(args.liveAskRaw));
  }
  if (args.catalogPremium != null && args.catalogPremium > 0) {
    return formatPremiumOrPlaceholder(args.catalogPremium);
  }
  if (args.loading) return "…";
  return formatPremiumOrPlaceholder(null);
}

function oracleAssetLabel(oracleId: string): string {
  return oracleId.slice(2, 6).toUpperCase() || "MKT";
}

export const MARKET_TITLES = {
  up: "Bitcoin Up, Down, or Range",
  down: "Bitcoin Up, Down, or Range",
  range: "Bitcoin Up, Down, or Range",
} as const;

export const MARKET_TITLE_UP = MARKET_TITLES.up;
export const MARKET_TITLE_DOWN = MARKET_TITLES.down;
export const MARKET_TITLE_RANGE = MARKET_TITLES.range;

export function catalogEntryToMarketRow(entry: MarketCatalogEntry): LeverxMarketRow {
  const asset = oracleAssetLabel(entry.oracle_id);

  return {
    id: entry.market_key,
    oracleId: entry.oracle_id,
    asset,
    strike: entry.strike / SCALE,
    strikeRaw: entry.strike,
    higherStrikeRaw: entry.higher_strike,
    expiry: entry.expiry_ms,
    isUp: entry.is_up,
    isRange: entry.is_range,
    lastAskPremium: entry.last_ask_price ?? null,
    volume: scaleQuote(entry.volume_24h),
    status: entry.trade_count_24h > 0 ? "active" : "indexed",
  };
}

export function catalogToMarketRows(entries: readonly MarketCatalogEntry[]): LeverxMarketRow[] {
  return entries.map(catalogEntryToMarketRow).sort((a, b) => b.volume - a.volume);
}

export function findMarketRow(
  rows: readonly LeverxMarketRow[],
  args: { strikeRaw?: number; side?: PredictSide },
): LeverxMarketRow | undefined {
  const { strikeRaw, side = "up" } = args;

  if (side === "range") {
    return rows.find((m) => m.isRange && (!strikeRaw || m.strikeRaw === strikeRaw));
  }

  const isUp = side === "up";
  if (strikeRaw) {
    return rows.find((m) => !m.isRange && m.isUp === isUp && m.strikeRaw === strikeRaw);
  }

  return rows.find((m) => !m.isRange && m.isUp === isUp) ?? rows[0];
}

export function rangeBoundsForRow(m: LeverxMarketRow): { lower: number; upper: number } | null {
  if (!m.isRange || m.higherStrikeRaw <= 0) return null;
  return { lower: m.strikeRaw, upper: m.higherStrikeRaw };
}
