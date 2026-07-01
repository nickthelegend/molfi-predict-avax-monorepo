import type { LineData, UTCTimestamp } from "lightweight-charts";
import type { PricePoint } from "@/lib/predict/price-point";

function candleTime(timestamp: number): UTCTimestamp {
  const sec = timestamp > 1e12 ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
  return sec as UTCTimestamp;
}

/** Price history points → ascending unique timestamps for Lightweight Charts. */
export function toLineData(points: readonly PricePoint[]): LineData<UTCTimestamp>[] {
  const out: LineData<UTCTimestamp>[] = [];
  let lastSec = -Infinity;

  for (const p of points) {
    let sec = candleTime(p.t) as number;
    if (sec <= lastSec) sec = lastSec + 1;
    lastSec = sec;
    out.push({ time: sec as UTCTimestamp, value: p.price });
  }

  return out;
}

/**
 * Spot poll series with strike anchored at index 0:
 * `[strike, spot₁, spot₂, …, spotₙ]` where each spot is one poll interval apart.
 */
export function buildStrikeAnchoredSpotLineData(
  points: readonly PricePoint[],
  strikePrice: number | undefined,
  pollIntervalMs: number,
): LineData<UTCTimestamp>[] {
  const spotLine = toLineData(points);
  const pollIntervalSec = Math.max(1, Math.round(pollIntervalMs / 1000));

  if (spotLine.length === 0) return [];

  const hasStrike =
    strikePrice != null && Number.isFinite(strikePrice) && strikePrice > 0;

  if (!hasStrike) {
    if (spotLine.length === 1) {
      const point = spotLine[0]!;
      return [
        { time: ((point.time as number) - pollIntervalSec) as UTCTimestamp, value: point.value },
        point,
      ];
    }
    return spotLine;
  }

  const firstTime = spotLine[0]!.time as number;
  let strikeTime = firstTime - pollIntervalSec;
  if (strikeTime >= firstTime) strikeTime = firstTime - 1;

  return [{ time: strikeTime as UTCTimestamp, value: strikePrice }, ...spotLine];
}

/** Flat line when oracle history is empty (constant price over `spanHours`). */
export function flatLineData(price: number, spanHours = 24): LineData<UTCTimestamp>[] {
  if (!Number.isFinite(price) || price <= 0) return [];

  const nowSec = Math.floor(Date.now() / 1000);
  const startSec = nowSec - spanHours * 3600;
  return [
    { time: startSec as UTCTimestamp, value: price },
    { time: nowSec as UTCTimestamp, value: price },
  ];
}
