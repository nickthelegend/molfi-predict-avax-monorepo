import { FLOAT_SCALING } from "@/lib/predict/constants";
import { formatStrikeUsdFromRaw } from "@/lib/leverx/format-asset-price";
import { strikeUsdToRaw } from "@/lib/leverx/trade-math";

export { formatStrikeUsdFromRaw };

const SCALE = Number(FLOAT_SCALING);

/** Round spot to tick for default ATM strike (raw 1e9 units). */
export function atmStrikeRaw(spotUsd: number, minStrikeRaw: number, tickSizeRaw: number): number {
  if (spotUsd <= 0) return minStrikeRaw > 0 ? minStrikeRaw : 0;
  const spotRaw = Math.round(spotUsd * SCALE);
  const tick = tickSizeRaw > 0 ? tickSizeRaw : minStrikeRaw;
  if (tick <= 0) return spotRaw;
  return Math.max(minStrikeRaw, Math.round(spotRaw / tick) * tick);
}

/** Normalize oracle min_strike / tick_size to raw 1e9 units. */
export function toOracleStrikeRaw(value: number | undefined | null): number {
  if (value == null || value <= 0) return 0;
  return value < 1_000_000 ? Math.round(value * SCALE) : Math.round(value);
}

export function oracleStrikeBounds(args: { minStrike?: number | null; tickSize?: number | null }): {
  minStrikeRaw: number;
  tickSizeRaw: number;
} {
  const minStrikeRaw = toOracleStrikeRaw(args.minStrike);
  const tickSizeRaw = toOracleStrikeRaw(args.tickSize) || minStrikeRaw || SCALE;
  return { minStrikeRaw, tickSizeRaw };
}

export const STRIKE_PRESET_OFFSETS = {
  pct_neg_3: -3,
  pct_neg_2: -2,
  market: 0,
  pct_pos_2: 2,
  pct_pos_3: 3,
} as const;

export type StrikePresetId = keyof typeof STRIKE_PRESET_OFFSETS | "custom";

export const STRIKE_PRESET_OPTIONS: readonly {
  id: StrikePresetId;
  label: string;
}[] = [
  { id: "pct_neg_3", label: "−3%" },
  { id: "pct_neg_2", label: "−2%" },
  { id: "market", label: "Market" },
  { id: "pct_pos_2", label: "+2%" },
  { id: "pct_pos_3", label: "+3%" },
  { id: "custom", label: "Custom" },
];

/** Snap USD strike to oracle tick grid and enforce min_strike. */
export function snapStrikeRaw(
  strikeUsd: number,
  minStrikeRaw: number,
  tickSizeRaw: number,
): number {
  if (!Number.isFinite(strikeUsd) || strikeUsd <= 0) return 0;
  const strikeRaw = strikeUsdToRaw(strikeUsd);
  const tick = tickSizeRaw > 0 ? tickSizeRaw : minStrikeRaw;
  if (tick <= 0) return Math.max(minStrikeRaw, strikeRaw);
  const snapped = Math.round(strikeRaw / tick) * tick;
  return Math.max(minStrikeRaw, snapped);
}

export function strikeRawFromPreset(
  preset: Exclude<StrikePresetId, "custom">,
  spotUsd: number,
  minStrikeRaw: number,
  tickSizeRaw: number,
): number {
  if (preset === "market" || spotUsd <= 0) {
    return atmStrikeRaw(spotUsd, minStrikeRaw, tickSizeRaw);
  }
  const offset = STRIKE_PRESET_OFFSETS[preset];
  const targetUsd = spotUsd * (1 + offset / 100);
  return snapStrikeRaw(targetUsd, minStrikeRaw, tickSizeRaw);
}

export function strikeUsdFromRaw(strikeRaw: number): number {
  if (strikeRaw <= 0) return 0;
  return strikeRaw / SCALE;
}

/** Default “Market” range band: spot ± 0.2% (snapped to oracle tick grid). */
export const RANGE_MARKET_WIDTH = 0.002;

export const RANGE_PRESET_WIDTHS = {
  market: RANGE_MARKET_WIDTH,
  pct_0_5: 0.005,
  pct_1: 0.01,
} as const;

export type RangePresetId = keyof typeof RANGE_PRESET_WIDTHS | "custom";

export const RANGE_PRESET_OPTIONS: readonly {
  id: RangePresetId;
  label: string;
}[] = [
  { id: "market", label: "Market" },
  { id: "pct_0_5", label: "0.5%" },
  { id: "pct_1", label: "1%" },
  { id: "custom", label: "Custom" },
];

/** Default range band for trade terminal fallbacks — same as the Market preset. */
export function defaultRangeBoundsRaw(
  spotUsd: number,
  minStrikeRaw: number,
  tickSizeRaw: number,
): { lower: number; upper: number } {
  return rangeBoundsFromPreset("market", spotUsd, minStrikeRaw, tickSizeRaw);
}

function tickWidenedRangeBounds(
  spotUsd: number,
  minStrikeRaw: number,
  tickSizeRaw: number,
): { lower: number; upper: number } {
  const atm = atmStrikeRaw(spotUsd, minStrikeRaw, tickSizeRaw);
  const tick = tickSizeRaw > 0 ? tickSizeRaw : minStrikeRaw || SCALE;
  const lower = Math.max(minStrikeRaw > 0 ? minStrikeRaw : tick, atm - tick);
  const upper = atm + tick;
  return { lower, upper };
}

export function rangeBoundsFromPreset(
  preset: Exclude<RangePresetId, "custom">,
  spotUsd: number,
  minStrikeRaw: number,
  tickSizeRaw: number,
): { lower: number; upper: number } {
  if (spotUsd <= 0) {
    return tickWidenedRangeBounds(spotUsd, minStrikeRaw, tickSizeRaw);
  }
  const width = RANGE_PRESET_WIDTHS[preset];
  const lower = snapStrikeRaw(spotUsd * (1 - width), minStrikeRaw, tickSizeRaw);
  const upper = snapStrikeRaw(spotUsd * (1 + width), minStrikeRaw, tickSizeRaw);
  if (upper <= lower) {
    return tickWidenedRangeBounds(spotUsd, minStrikeRaw, tickSizeRaw);
  }
  return { lower, upper };
}

export function formatRangeBoundsFromRaw(lowerRaw: number, upperRaw: number): string {
  if (lowerRaw <= 0 || upperRaw <= lowerRaw) return "—";
  return `${formatStrikeUsdFromRaw(lowerRaw)} – ${formatStrikeUsdFromRaw(upperRaw)}`;
}

export function rangeWidthPct(
  lowerRaw: number,
  upperRaw: number,
  spotUsd?: number | null,
): number | null {
  if (lowerRaw <= 0 || upperRaw <= lowerRaw || spotUsd == null || spotUsd <= 0) {
    return null;
  }
  const widthUsd = (upperRaw - lowerRaw) / SCALE;
  return (widthUsd / spotUsd) * 100;
}
