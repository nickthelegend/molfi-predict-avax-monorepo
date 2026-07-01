import type {
  AutoscaleInfo,
  CandlestickData,
  IChartApi,
  LineData,
  UTCTimestamp,
} from "lightweight-charts";
import type { PriceLevel } from "@/lib/charts/price-level";

/** Default line viewport when not using fitContent (recent polls only). */
export const PREDICT_DETAIL_VISIBLE_BARS = 90;

/** ~16 hours of 15m OHLCV candles when using a fixed window. */
export const PREDICT_CANDLE_VISIBLE_BARS = 64;

/** Keep price action using most of the plot height. */
export const PREDICT_CHART_SCALE_MARGINS = { top: 0.02, bottom: 0.02 };

/** Tight Y padding so spot movement spreads across the chart. */
const PREDICT_LINE_Y_PAD_RATIO = 0.03;
const PREDICT_CANDLE_Y_PAD_RATIO = 0.025;

/** Expand Y bounds for strike lines only when they sit near the recent price window. */
const PREDICT_STRIKE_Y_EXPANSION_RATIO = 0.25;

function recentTail<T>(items: readonly T[], maxItems: number): readonly T[] {
  if (items.length <= maxItems) return items;
  return items.slice(items.length - maxItems);
}

export function predictChartTimeScaleOptions(mode: "line" | "candlestick" = "line") {
  return {
    timeVisible: true,
    secondsVisible: mode === "line",
    // Wider bar spacing spreads candles/points horizontally.
    barSpacing: mode === "candlestick" ? 12 : 18,
    minBarSpacing: mode === "candlestick" ? 4 : 8,
    rightOffset: 8,
    fixLeftEdge: false,
    fixRightEdge: false,
  };
}

function yBoundsFromValues(
  values: readonly number[],
  strikeLevels: readonly PriceLevel[],
): { min: number; max: number } | null {
  const prices = values.filter((value) => Number.isFinite(value) && value > 0);
  if (prices.length === 0) return null;

  let min = Math.min(...prices);
  let max = Math.max(...prices);

  const span = max - min || Math.max(max * 0.001, 1);
  const strikePad = span * PREDICT_STRIKE_Y_EXPANSION_RATIO;
  for (const level of strikeLevels) {
    const strike = level.price;
    if (!Number.isFinite(strike) || strike <= 0) continue;
    if (strike >= min - strikePad && strike <= max + strikePad) {
      min = Math.min(min, strike);
      max = Math.max(max, strike);
    }
  }

  if (min === max) {
    const bump = Math.max(min * 0.0015, 0.5);
    min -= bump;
    max += bump;
  }
  return { min, max };
}

function withYPadding(
  min: number,
  max: number,
  padRatio: number,
): { minValue: number; maxValue: number } {
  const span = max - min;
  const pad = Math.max(span * padRatio, max * 0.0005);
  return { minValue: min - pad, maxValue: max + pad };
}

export function buildPredictAutoscaleInfo(
  lineData: readonly LineData<UTCTimestamp>[],
  strikeLevels: readonly PriceLevel[],
): AutoscaleInfo | null {
  const recent = recentTail(lineData, PREDICT_DETAIL_VISIBLE_BARS);
  const bounds = yBoundsFromValues(
    recent.map((point) => point.value),
    strikeLevels,
  );
  if (!bounds) return null;
  return { priceRange: withYPadding(bounds.min, bounds.max, PREDICT_LINE_Y_PAD_RATIO) };
}

export function buildCandleAutoscaleInfo(
  candles: readonly CandlestickData<UTCTimestamp>[],
  strikeLevels: readonly PriceLevel[],
): AutoscaleInfo | null {
  const recent = recentTail(candles, PREDICT_CANDLE_VISIBLE_BARS);
  const lows = recent.map((bar) => bar.low);
  const highs = recent.map((bar) => bar.high);
  const bounds = yBoundsFromValues([...lows, ...highs], strikeLevels);
  if (!bounds) return null;
  return { priceRange: withYPadding(bounds.min, bounds.max, PREDICT_CANDLE_Y_PAD_RATIO) };
}

/** Spread the full series across the time axis (initial load only). */
export function applyPredictChartViewport(
  chart: IChartApi,
  dataLength: number,
  mode: "line" | "candlestick" = "line",
): void {
  chart.timeScale().applyOptions(predictChartTimeScaleOptions(mode));

  if (dataLength < 1) return;

  chart.timeScale().fitContent();
}
