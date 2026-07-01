import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import { ohlcvTimeToSec, type OhlcvCandle } from "@/lib/deepbook/ohlcv";

const MAX_ORACLE_TAIL_CANDLES = 120;

export function ohlcvToCandlestickData(
  candles: readonly OhlcvCandle[],
): CandlestickData<UTCTimestamp>[] {
  const byTime = new Map<number, CandlestickData<UTCTimestamp>>();

  for (const [t, open, high, low, close] of candles) {
    if (t <= 0 || !Number.isFinite(close) || close <= 0) continue;
    const time = ohlcvTimeToSec(t) as UTCTimestamp;
    byTime.set(time, {
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
    });
  }

  return [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, bar]) => bar);
}

/** Append a live oracle spot tick after the OHLCV history (never rewrite prior bars). */
export function appendOracleTailCandle(
  prevTail: readonly OhlcvCandle[],
  oracleSpot: number,
  oracleTimeMs?: number,
): OhlcvCandle[] {
  if (!Number.isFinite(oracleSpot) || oracleSpot <= 0) return [...prevTail];

  let t = oracleTimeMs ?? Date.now();
  const lastTailT = prevTail[prevTail.length - 1]?.[0] ?? 0;
  if (t <= lastTailT) t = lastTailT + 1_000;

  const last = prevTail[prevTail.length - 1];
  if (last && last[0] === t && last[4] === oracleSpot) return [...prevTail];

  const next: OhlcvCandle = [t, oracleSpot, oracleSpot, oracleSpot, oracleSpot, 0];
  const merged = [...prevTail, next];
  return merged.length > MAX_ORACLE_TAIL_CANDLES
    ? merged.slice(-MAX_ORACLE_TAIL_CANDLES)
    : merged;
}

/** Merge DeepBook OHLCV with oracle tail ticks (drops tail bars at or before the last base bar). */
export function mergeOhlcvWithOracleTail(
  baseCandles: readonly OhlcvCandle[],
  oracleTail: readonly OhlcvCandle[],
): OhlcvCandle[] {
  if (baseCandles.length === 0) return [...oracleTail];
  const sorted = [...baseCandles].sort((a, b) => a[0] - b[0]);
  const lastBaseT = sorted[sorted.length - 1]![0];
  const tail = oracleTail.filter(([t]) => t > lastBaseT);
  return [...sorted, ...tail];
}
