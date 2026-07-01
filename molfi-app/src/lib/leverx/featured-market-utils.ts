import { premiumToCents, type LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { positionKeyFromArgs, marketRowToKey } from "@/lib/leverx/market-keys";
import { resolveRangeBounds } from "@/lib/leverx/predict-oracle-markets";

export function featuredDownRow(row: LeverxMarketRow): LeverxMarketRow {
  const keyArgs = marketRowToKey({ ...row, isUp: false, isRange: false });
  const id = keyArgs ? positionKeyFromArgs(keyArgs) : `${row.id}:down`;

  return {
    ...row,
    id,
    isUp: false,
    isRange: false,
  };
}

export function featuredRangeRow(row: LeverxMarketRow): LeverxMarketRow | null {
  const bounds = resolveRangeBounds({
    oracleId: row.oracleId,
    oracleSpot: row.spotPrice ?? null,
    strikeRaw: row.strikeRaw,
  });
  if (!bounds) return null;

  const keyArgs = marketRowToKey({
    ...row,
    isUp: true,
    isRange: true,
    strikeRaw: bounds.lower,
    higherStrikeRaw: bounds.upper,
  });
  if (!keyArgs) return null;

  return {
    ...row,
    id: positionKeyFromArgs(keyArgs),
    strikeRaw: bounds.lower,
    strike: bounds.lower / 1e9,
    higherStrikeRaw: bounds.upper,
    isUp: true,
    isRange: true,
  };
}

export function normalizeAskPremium(
  premium: number | bigint | null | undefined,
): number | null {
  if (premium == null) return null;
  const value = typeof premium === "bigint" ? Number(premium) : premium;
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function payoutMultiplier(
  premium: number | bigint | null | undefined,
): string | null {
  const normalized = normalizeAskPremium(premium);
  if (normalized == null) return null;

  const cents = premiumToCents(normalized);
  if (!Number.isFinite(cents) || cents <= 0 || cents >= 100) return null;

  const multiplier = 100 / cents;
  if (!Number.isFinite(multiplier)) return null;

  return `${multiplier.toFixed(2)}x`;
}

/** Short countdown — M:SS under an hour, otherwise H:MM:SS. */
export function formatFeaturedCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "0:00";
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}
