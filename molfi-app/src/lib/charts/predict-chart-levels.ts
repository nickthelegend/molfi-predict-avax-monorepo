import type { PriceLevel } from "@/lib/charts/price-level";
import { formatStrikeUsdFromRaw } from "@/lib/leverx/format-asset-price";
import { predictSideLabel, sideFromIsUp } from "@/lib/predict/instruments";
import type { PredictSide } from "@/lib/predict/instruments";
import { FLOAT_SCALING } from "@/lib/predict/constants";

const SCALE = Number(FLOAT_SCALING);

export interface StrikeChartLevelInput {
  activeSide: PredictSide;
  strikePrice?: number;
  rangeLower?: number;
  rangeUpper?: number;
}

export interface PositionStrikeChartInput {
  isUp: boolean;
  isRange: boolean;
  strikeRaw: number;
  higherStrikeRaw?: number;
}

/** Strike lines from the user's open positions on this oracle. */
export function buildPositionStrikeChartLevels(
  positions: readonly PositionStrikeChartInput[],
): PriceLevel[] {
  const levels: PriceLevel[] = [];
  const seen = new Set<string>();

  for (const position of positions) {
    if (position.isRange && (position.higherStrikeRaw ?? 0) > position.strikeRaw) {
      const rangeKey = `range:${position.strikeRaw}:${position.higherStrikeRaw}`;
      if (!seen.has(rangeKey)) {
        seen.add(rangeKey);
        levels.push({
          label: `Range ${formatStrikeUsdFromRaw(position.strikeRaw)}–${formatStrikeUsdFromRaw(position.higherStrikeRaw!)}`,
          price: position.strikeRaw / SCALE,
          tone: "entry-range",
        });
        levels.push({
          label: `Range high ${formatStrikeUsdFromRaw(position.higherStrikeRaw!)}`,
          price: position.higherStrikeRaw! / SCALE,
          tone: "entry-range",
        });
      }
      continue;
    }

    if (position.strikeRaw <= 0) continue;
    const key = `binary:${position.strikeRaw}:${position.isUp ? 1 : 0}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const side = predictSideLabel[sideFromIsUp(position.isUp)];
    levels.push({
      label: `${side} ${formatStrikeUsdFromRaw(position.strikeRaw)}`,
      price: position.strikeRaw / SCALE,
      tone: position.isUp ? "entry-up" : "entry-down",
    });
  }

  return levels;
}

/** Horizontal strike guides for the live spot chart (trade panel / no open positions). */
export function buildStrikeChartLevels(input: StrikeChartLevelInput): PriceLevel[] {
  const { activeSide, strikePrice, rangeLower, rangeUpper } = input;

  if (activeSide === "range") {
    const levels: PriceLevel[] = [];
    if (rangeLower != null && rangeLower > 0) {
      levels.push({ label: "Lower strike", price: rangeLower, tone: "strike" });
    }
    if (rangeUpper != null && rangeUpper > 0) {
      levels.push({ label: "Upper strike", price: rangeUpper, tone: "strike" });
    }
    return levels;
  }

  if (strikePrice != null && strikePrice > 0) {
    return [{ label: "Strike", price: strikePrice, tone: "strike" }];
  }

  return [];
}
