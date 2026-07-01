/**
 * useMarketBaseline — Fetches candles ONCE per period boundary.
 *
 * Purpose:
 * 1. Determine how the previous market resolved (prev close)
 * 2. Set the baseline ("price to beat") for the current market
 *
 * Candles are NOT used for live charting. They are boundary data only.
 */
import { useState, useEffect, useRef } from "react";

const COINBASE_API = "https://api.exchange.coinbase.com";

const PAIR_MAP: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  DOGE: "DOGE-USD",
  XRP: "XRP-USD",
};

export interface MarketBaseline {
  /** The baseline price (previous period close) */
  baseline: number;
  /** Whether baseline has been loaded */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** When the current period started (ms) */
  periodStart: number;
  /** When the current period ends (ms) */
  periodEnd: number;
}

/** Get current period boundaries */
function getPeriodBounds(timeframe: "hourly" | "daily"): { start: number; end: number } {
  const now = new Date();
  if (timeframe === "daily") {
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start: start.getTime(), end: end.getTime() };
  }
  const start = new Date(now);
  start.setUTCMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 3600_000);
  return { start: start.getTime(), end: end.getTime() };
}

/** Fetch the close price of the previous period — single API call */
async function fetchPrevClose(pair: string, timeframe: "hourly" | "daily"): Promise<number> {
  const { start } = getPeriodBounds(timeframe);

  if (timeframe === "hourly") {
    // Fetch 1 x 1-hour candle covering the previous hour
    const prevStart = new Date(start - 3600_000);
    const url = `${COINBASE_API}/products/${pair}/candles?granularity=3600&start=${prevStart.toISOString()}&end=${new Date(start).toISOString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Coinbase ${res.status}`);
    const raw: number[][] = await res.json();
    // Coinbase format: [timestamp, low, high, open, close, volume]
    if (raw.length > 0) return raw[0][4]; // close of the most recent
    throw new Error("No candle data for previous hour");
  }

  // Daily: fetch 1 x daily candle for yesterday
  const prevDayStart = new Date(start - 86400_000);
  const url = `${COINBASE_API}/products/${pair}/candles?granularity=86400&start=${prevDayStart.toISOString()}&end=${new Date(start).toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase ${res.status}`);
  const raw: number[][] = await res.json();
  if (raw.length > 0) return raw[0][4];
  throw new Error("No candle data for previous day");
}

/**
 * Shared baseline cache — avoids duplicate fetches across sidebar cards + chart.
 * Key: "BTC-hourly-1707523200000" (asset-timeframe-periodStart)
 */
const baselineCache: Record<string, { baseline: number; promise?: Promise<number> }> = {};

function getCacheKey(asset: string, timeframe: "hourly" | "daily", periodStart: number) {
  return `${asset}-${timeframe}-${periodStart}`;
}

export function useMarketBaseline(asset: string, timeframe: "hourly" | "daily"): MarketBaseline {
  const pair = PAIR_MAP[asset] || `${asset}-USD`;
  const bounds = getPeriodBounds(timeframe);
  const cacheKey = getCacheKey(asset, timeframe, bounds.start);

  const [baseline, setBaseline] = useState(() => baselineCache[cacheKey]?.baseline ?? 0);
  const [isLoading, setIsLoading] = useState(baseline === 0);
  const [error, setError] = useState<string | null>(null);
  const lastKeyRef = useRef(cacheKey);

  useEffect(() => {
    // If period rolled over, reset
    if (lastKeyRef.current !== cacheKey) {
      lastKeyRef.current = cacheKey;
      const cached = baselineCache[cacheKey];
      if (cached?.baseline) {
        setBaseline(cached.baseline);
        setIsLoading(false);
        return;
      }
      setBaseline(0);
      setIsLoading(true);
    }

    // Already cached
    const cached = baselineCache[cacheKey];
    if (cached?.baseline) {
      setBaseline(cached.baseline);
      setIsLoading(false);
      return;
    }

    // Deduplicate in-flight requests
    if (!cached?.promise) {
      const promise = fetchPrevClose(pair, timeframe);
      baselineCache[cacheKey] = { baseline: 0, promise };
      promise
        .then((bl) => {
          baselineCache[cacheKey] = { baseline: bl };
          setBaseline(bl);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => setIsLoading(false));
    } else {
      cached.promise
        .then((bl) => { setBaseline(bl); setError(null); })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [cacheKey, pair, timeframe]);

  // Schedule a re-fetch at the next period boundary
  useEffect(() => {
    const diff = bounds.end - Date.now();
    if (diff <= 0) return;
    const timer = setTimeout(() => {
      // Period rolled over — clear cache and trigger re-fetch
      delete baselineCache[cacheKey];
      setBaseline(0);
      setIsLoading(true);
    }, diff + 2000); // +2s buffer for candle availability
    return () => clearTimeout(timer);
  }, [bounds.end, cacheKey]);

  return { baseline, isLoading, error, periodStart: bounds.start, periodEnd: bounds.end };
}

/** Fetch baseline for an arbitrary past period (used by timeline navigation) */
export async function fetchPeriodBaseline(
  asset: string,
  timeframe: "hourly" | "daily",
  periodStart: number
): Promise<number> {
  const pair = PAIR_MAP[asset] || `${asset}-USD`;
  const gran = timeframe === "hourly" ? 3600 : 86400;
  const prevPeriodLen = timeframe === "hourly" ? 3600_000 : 86400_000;
  const prevStart = new Date(periodStart - prevPeriodLen);
  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${gran}&start=${prevStart.toISOString()}&end=${new Date(periodStart).toISOString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase ${res.status}`);
  const raw: number[][] = await res.json();
  if (raw.length > 0) return raw[0][4];
  return 0;
}
