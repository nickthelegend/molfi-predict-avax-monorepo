import { fetchJson } from "@/lib/api/fetch-json";
import { downsampleSeries } from "@/lib/charts/sparkline-path";
import { appConfig } from "@/lib/config";
import { normalizeProtectionBase } from "@/lib/markets";
import type { PricePoint } from "@/lib/predict/price-point";

/** `[timestamp_ms, open, high, low, close, volume]` — candle times are Unix ms. */
export type OhlcvCandle = [number, number, number, number, number, number];

export type OhlcvInterval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";

export const CHART_OHLCV_INTERVAL: OhlcvInterval = "15m";
export const CHART_OHLCV_INTERVAL_MS = ohlcvIntervalMs(CHART_OHLCV_INTERVAL);
export const CHART_OHLCV_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export const CHART_OHLCV_INTERVALS: readonly OhlcvInterval[] = [
  "1m",
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
];

export function ohlcvIntervalMs(interval: OhlcvInterval): number {
  switch (interval) {
    case "1m":
      return 60_000;
    case "5m":
      return 5 * 60_000;
    case "15m":
      return 15 * 60_000;
    case "1h":
      return 60 * 60_000;
    case "4h":
      return 4 * 60 * 60_000;
    case "1d":
      return 24 * 60 * 60_000;
  }
}

const DEEPBOOK_PAIRS: Record<string, string> = {
  BTC: "XBTC_USDC",
};

export function deepbookPairForAsset(asset: string): string | null {
  const base = normalizeProtectionBase(asset);
  if (!base) return null;
  return DEEPBOOK_PAIRS[base] ?? null;
}

/** Normalize indexer candle time to Unix seconds (Lightweight Charts). */
export function ohlcvTimeToSec(t: number): number {
  return t > 1e12 ? Math.floor(t / 1000) : Math.floor(t);
}

export function ohlcvCandlesToPricePoints(candles: readonly OhlcvCandle[]): PricePoint[] {
  return candles
    .map(([t, , , , close]) => ({ t: ohlcvTimeToSec(t) * 1000, price: close }))
    .filter((p) => p.t > 0 && Number.isFinite(p.price) && p.price > 0)
    .sort((a, b) => a.t - b.t);
}

/** Align chart terminal with oracle “Current price” by overwriting the newest candle close. */
export function patchLatestPriceWithOracle(
  points: readonly PricePoint[],
  oracleSpot: number,
): PricePoint[] {
  if (points.length === 0 || !Number.isFinite(oracleSpot) || oracleSpot <= 0) {
    return [...points];
  }
  const next = [...points];
  next[next.length - 1] = { ...next[next.length - 1]!, price: oracleSpot };
  return next;
}

/** Unix milliseconds for DeepBook indexer `start_time` / `end_time` (matches candle timestamps). */
export async function fetchDeepbookOhlcv(
  pair: string,
  interval: OhlcvInterval,
  startTimeMs: number,
  endTimeMs: number,
  options?: { limit?: number },
): Promise<OhlcvCandle[]> {
  const base = appConfig.deepbookIndexerUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    interval,
    start_time: String(Math.floor(startTimeMs)),
    end_time: String(Math.floor(endTimeMs)),
  });
  if (options?.limit != null) {
    params.set("limit", String(options.limit));
  }

  const url = `${base}/ohclv/${encodeURIComponent(pair)}?${params}`;
  const data = await fetchJson<{ candles?: OhlcvCandle[] }>(url, { timeoutMs: 20_000 });
  let candles = Array.isArray(data.candles) ? data.candles : [];

  if (candles.length === 0 && options?.limit == null) {
    const fallbackUrl =
      `${base}/ohclv/${encodeURIComponent(pair)}` + `?interval=${interval}&limit=100`;
    const fallback = await fetchJson<{ candles?: OhlcvCandle[] }>(fallbackUrl, {
      timeoutMs: 20_000,
    });
    candles = Array.isArray(fallback.candles) ? fallback.candles : [];
  }

  return candles;
}

const MARKETS_SPARKLINE_MAX_POINTS = 32;

/** Close prices from OHLCV candles, oldest → newest, downsampled for market sparklines. */
export function ohlcvCandlesToSparklineSeries(
  candles: readonly OhlcvCandle[],
  maxPoints = MARKETS_SPARKLINE_MAX_POINTS,
): number[] {
  const closes = [...candles]
    .sort((a, b) => a[0] - b[0])
    .map(([, , , , close]) => close)
    .filter((close) => Number.isFinite(close) && close > 0);
  return downsampleSeries(closes, maxPoints);
}
