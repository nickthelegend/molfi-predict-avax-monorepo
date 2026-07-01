import type { LineData, UTCTimestamp } from "lightweight-charts";
import type { PredictSide } from "@/lib/predict/instruments";

export type SegmentTone = "win" | "loss";

export interface ColoredLineSegment {
  tone: SegmentTone;
  data: LineData<UTCTimestamp>[];
}

function asTime(value: number): UTCTimestamp {
  return value as UTCTimestamp;
}

/** Whether the position is in-the-money for the active side at this spot. */
export function isPriceWinning(
  price: number,
  side: PredictSide,
  strike: number,
  range?: { lower: number; upper: number },
): boolean {
  if (side === "up") return price >= strike;
  if (side === "down") return price <= strike;
  if (range) return price >= range.lower && price <= range.upper;
  return price >= strike;
}

function crossingPoint(
  a: LineData<UTCTimestamp>,
  b: LineData<UTCTimestamp>,
  level: number,
): LineData<UTCTimestamp> | null {
  const delta = b.value - a.value;
  if (delta === 0) return null;
  if ((a.value - level) * (b.value - level) > 0) return null;

  const ratio = (level - a.value) / delta;
  const time = (a.time as number) + ratio * ((b.time as number) - (a.time as number));
  return { time: asTime(Math.round(time)), value: level };
}

function thresholdsForSide(
  side: PredictSide,
  strike: number,
  range?: { lower: number; upper: number },
): number[] {
  if (side === "range" && range) {
    return [range.lower, range.upper].sort((a, b) => a - b);
  }
  return [strike];
}

function splitSegmentAtLevels(
  segment: LineData<UTCTimestamp>[],
  levels: readonly number[],
): LineData<UTCTimestamp>[][] {
  if (segment.length < 2 || levels.length === 0) return [segment];

  const out: LineData<UTCTimestamp>[][] = [];
  let current: LineData<UTCTimestamp>[] = [segment[0]!];

  for (let i = 1; i < segment.length; i++) {
    const prev = segment[i - 1]!;
    const next = segment[i]!;
    const crossings: LineData<UTCTimestamp>[] = [];

    for (const level of levels) {
      const cross = crossingPoint(prev, next, level);
      if (cross) crossings.push(cross);
    }

    crossings.sort((a, b) => (a.time as number) - (b.time as number));

    if (crossings.length === 0) {
      current.push(next);
      continue;
    }

    for (const cross of crossings) {
      current.push(cross);
      out.push(current);
      current = [cross];
    }
    current.push(next);
  }

  if (current.length > 0) out.push(current);
  return out;
}

/** Split price history into contiguous win/loss segments for options-style coloring. */
export function buildOptionsLineSegments(
  points: readonly LineData<UTCTimestamp>[],
  side: PredictSide,
  strike: number,
  range?: { lower: number; upper: number },
): ColoredLineSegment[] {
  if (points.length === 0 || strike <= 0) return [];

  const levels = thresholdsForSide(side, strike, range);
  const atomic = splitSegmentAtLevels([...points], levels);
  const segments: ColoredLineSegment[] = [];

  for (const chunk of atomic) {
    if (chunk.length === 0) continue;
    const mid = chunk[Math.floor(chunk.length / 2)]!.value;
    const tone: SegmentTone = isPriceWinning(mid, side, strike, range) ? "win" : "loss";

    const prev = segments[segments.length - 1];
    if (prev && prev.tone === tone) {
      const lastTime = prev.data[prev.data.length - 1]?.time;
      const firstTime = chunk[0]?.time;
      if (lastTime === firstTime && prev.data.length > 0) {
        prev.data.push(...chunk.slice(1));
      } else {
        prev.data.push(...chunk);
      }
      continue;
    }

    segments.push({ tone, data: [...chunk] });
  }

  return segments;
}

/** Symmetric Y-axis span centered on strike so the strike line sits mid-chart. */
export function strikeCenteredVisibleRange(
  prices: readonly number[],
  strike: number,
  padRatio = 0.15,
): { from: number; to: number } {
  const finite = prices.filter((p) => Number.isFinite(p) && p > 0);
  const dataMin = finite.length ? Math.min(...finite) : strike;
  const dataMax = finite.length ? Math.max(...finite) : strike;

  const halfSpan = Math.max(strike - dataMin, dataMax - strike, strike * 0.005, 1);
  const pad = halfSpan * padRatio;

  return {
    from: strike - halfSpan - pad,
    to: strike + halfSpan + pad,
  };
}
