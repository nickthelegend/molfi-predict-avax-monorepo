import { appConfig } from "@/lib/config";

/** DeepBook Predict instrument sides — binary UP/DOWN and vertical RANGE. */
export type PredictSide = "up" | "down" | "range";

export const PREDICT_SIDES: readonly PredictSide[] = ["up", "down", "range"] as const;

export function isRangeTradingEnabled(): boolean {
  return appConfig.rangeEnabled;
}

export const TRADE_PREDICT_SIDES: readonly PredictSide[] = isRangeTradingEnabled()
  ? PREDICT_SIDES
  : (["up", "down"] as const);

export function coercePredictSide(side: PredictSide): PredictSide {
  return side;
}

export const predictSideLabel: Record<PredictSide, string> = {
  up: "UP",
  down: "DOWN",
  range: "RANGE",
};

/** Labels for the trade panel side toggle. */
export const tradePanelSideLabel: Record<"up" | "down", string> = {
  up: "LONG",
  down: "SHORT",
};

export function sideFromIsUp(isUp: boolean): "up" | "down" {
  return isUp ? "up" : "down";
}

export function predictSideFromBinary(args: {
  isUp: boolean;
  isRange?: boolean;
}): PredictSide {
  if (args.isRange) return "range";
  return sideFromIsUp(args.isUp);
}

export function isUpFromSide(side: PredictSide): boolean | undefined {
  if (side === "up") return true;
  if (side === "down") return false;
  return undefined;
}

/** Text color for UP / DOWN labels in lists and tables. */
export function predictSideTextClass(side: PredictSide): string {
  if (side === "up") return "text-[var(--long-text)]";
  if (side === "down") return "text-[var(--short-text)]";
  return "text-muted-foreground";
}

/** CSS modifier for existing long/short toggle styles. */
export function sideToggleClass(side: PredictSide, active: boolean): string {
  if (!active) return "border border-border text-muted-foreground";
  if (side === "up") return "bg-[var(--long-bg)] font-semibold text-[var(--long-text)]";
  if (side === "down") return "bg-[var(--short-bg)] font-semibold text-[var(--short-text)]";
  return "bg-accent/20 text-accent ring-1 ring-accent/40";
}

import { formatAssetPriceUsdWithSymbol } from "@/lib/leverx/format-asset-price";

export function formatRangeStrikes(lower: number, upper: number): string {
  return `${formatAssetPriceUsdWithSymbol(lower)} – ${formatAssetPriceUsdWithSymbol(upper)}`;
}
