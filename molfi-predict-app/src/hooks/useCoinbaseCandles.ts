import { useState, useEffect, useRef } from "react";

export interface CoinbaseCandle {
  timestamp: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CoinbaseAssetData {
  asset: string;
  pair: string;
  candles: CoinbaseCandle[];       // 1-min candles (last 60 min) for hourly
  dailyCandles: CoinbaseCandle[];  // 5-min candles from 00:00 UTC today for daily
  currentPrice: number;
  hourlyBaseline: number;
  dailyBaseline: number;
  hourlyCloseTime: Date;
  dailyCloseTime: Date;
  isLoading: boolean;
  error: string | null;
}

const COINBASE_API = "https://api.exchange.coinbase.com";

const ASSET_PAIRS: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  DOGE: "DOGE-USD",
  XRP: "XRP-USD",
};

/**
 * Fetch 1-minute candles from Coinbase public API.
 * Returns most recent candles (Coinbase returns newest first).
 */
async function fetchCandles(pair: string, granularity: number = 60, count: number = 60): Promise<CoinbaseCandle[]> {
  const end = new Date();
  const start = new Date(end.getTime() - count * granularity * 1000);

  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${granularity}&start=${start.toISOString()}&end=${end.toISOString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`);

  const raw: number[][] = await res.json();

  return raw
    .map(([ts, low, high, open, close, volume]) => ({
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume,
    }))
    .reverse();
}

/**
 * Fetch candles from a specific start time to now.
 */
async function fetchCandlesSince(pair: string, granularity: number, since: Date): Promise<CoinbaseCandle[]> {
  const end = new Date();
  const url = `${COINBASE_API}/products/${pair}/candles?granularity=${granularity}&start=${since.toISOString()}&end=${end.toISOString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Coinbase API error: ${res.status}`);

  const raw: number[][] = await res.json();

  return raw
    .map(([ts, low, high, open, close, volume]) => ({
      timestamp: ts,
      open,
      high,
      low,
      close,
      volume,
    }))
    .reverse();
}

/**
 * Compute the baseline price for a given timeframe.
 * Hourly: close of the last completed hour candle.
 * Daily: close of the last completed daily candle.
 */
function computeBaseline(candles: CoinbaseCandle[], timeframe: "hourly" | "daily"): number {
  if (candles.length === 0) return 0;

  const now = new Date();

  if (timeframe === "hourly") {
    // Last completed hour = floor current hour, then go back 1 hour
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);
    const lastHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);

    // Find candle closest to last hour end (i.e., current hour start)
    const lastHourCandle = candles
      .filter((c) => c.timestamp * 1000 >= lastHourStart.getTime() && c.timestamp * 1000 < currentHourStart.getTime())
      .pop(); // last one in that range

    return lastHourCandle?.close ?? candles[candles.length - 1].close;
  }

  // Daily: use the last completed day's close
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // We'd need daily candles for this — use the oldest 1-min candle as approximation,
  // or fetch a single daily candle
  return candles[0]?.open ?? candles[candles.length - 1].close;
}

/** Next full-hour boundary in UTC (e.g. 02:00, 03:00 UTC) */
function getNextHourlyClose(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCMinutes(0, 0, 0);
  next.setUTCHours(next.getUTCHours() + 1);
  return next;
}

/** Next midnight UTC boundary (00:00 UTC) */
function getNextDailyClose(): Date {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(0, 0, 0, 0);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Hook to fetch Coinbase candle data for a single asset.
 */
export function useCoinbaseCandles(asset: string) {
  const pair = ASSET_PAIRS[asset] || `${asset}-USD`;
  const [data, setData] = useState<CoinbaseAssetData>({
    asset,
    pair,
    candles: [],
    dailyCandles: [],
    currentPrice: 0,
    hourlyBaseline: 0,
    dailyBaseline: 0,
    hourlyCloseTime: getNextHourlyClose(),
    dailyCloseTime: getNextDailyClose(),
    isLoading: true,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // ── Hourly baseline: fetch the last candle of the previous hour ──
        const currentHourStart = new Date();
        currentHourStart.setUTCMinutes(0, 0, 0);
        const prevHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);

        let hourlyBaseline = 0;
        try {
          // Fetch 1-min candles covering the last 5 minutes of the previous hour
          const prevHourEnd = new Date(currentHourStart.getTime() - 1000); // HH:59:59
          const prevHourLate = new Date(currentHourStart.getTime() - 5 * 60 * 1000); // HH:55:00
          const baselineCandles = await fetchCandlesSince(pair, 60, prevHourLate);
          if (!cancelled && baselineCandles.length > 0) {
            // Get the last candle that falls within the previous hour
            const prevHourCandles = baselineCandles.filter(c => c.timestamp * 1000 < currentHourStart.getTime());
            hourlyBaseline = prevHourCandles.length > 0
              ? prevHourCandles[prevHourCandles.length - 1].close
              : baselineCandles[0].close;
          }
        } catch {
          // fallback below
        }

        // Fetch 1-min candles from start of current hour (hourly chart)
        const candles = await fetchCandlesSince(pair, 60, currentHourStart);
        if (cancelled) return;

        const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

        // If baseline fetch failed, use first candle's open as fallback
        if (hourlyBaseline === 0 && candles.length > 0) {
          hourlyBaseline = candles[0].open;
        }

        // ── Daily baseline: fetch previous day's closing price ──
        const todayMidnight = new Date();
        todayMidnight.setUTCHours(0, 0, 0, 0);

        let dailyBaseline = currentPrice;
        try {
          // Fetch the last few 5-min candles from yesterday evening
          const yesterdayLate = new Date(todayMidnight.getTime() - 30 * 60 * 1000); // 23:30 UTC yesterday
          const yesterdayCandles = await fetchCandlesSince(pair, 300, yesterdayLate);
          if (!cancelled && yesterdayCandles.length > 0) {
            const prevDayCandles = yesterdayCandles.filter(c => c.timestamp * 1000 < todayMidnight.getTime());
            dailyBaseline = prevDayCandles.length > 0
              ? prevDayCandles[prevDayCandles.length - 1].close
              : yesterdayCandles[0].close;
          }
        } catch {
          // fallback: use daily candle API
          try {
            const dailyBaseCandles = await fetchCandles(pair, 86400, 2);
            if (!cancelled && dailyBaseCandles.length >= 2) {
              dailyBaseline = dailyBaseCandles[dailyBaseCandles.length - 2].close;
            }
          } catch {
            dailyBaseline = candles[0]?.open ?? currentPrice;
          }
        }

        // Fetch 5-min candles from 00:00 UTC today (daily chart)
        let dailyChartCandles: CoinbaseCandle[] = [];
        try {
          dailyChartCandles = await fetchCandlesSince(pair, 300, todayMidnight);
        } catch {
          // fallback: empty
        }
        if (cancelled) return;

        setData({
          asset,
          pair,
          candles,
          dailyCandles: dailyChartCandles,
          currentPrice,
          hourlyBaseline,
          dailyBaseline,
          hourlyCloseTime: getNextHourlyClose(),
          dailyCloseTime: getNextDailyClose(),
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (cancelled) return;
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err.message || "Failed to fetch",
        }));
      }
    };

    load();

    // Refresh every 30 seconds
    intervalRef.current = setInterval(load, 30_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [asset, pair]);

  return data;
}

/**
 * Format a date as "MMM-DD-YYYY HH:MM UTC"
 */
export function formatCloseTime(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getUTCMonth()];
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const mins = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month}-${day}-${year} ${hours}:${mins} UTC`;
}

/**
 * Format price with appropriate decimal places
 */
export function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

/**
 * Build the market question string.
 */
export function buildMarketQuestion(
  asset: string,
  baseline: number,
  closeTime: Date,
  timeframe: "hourly" | "daily"
): string {
  return `${asset} will close above $${formatPrice(baseline)} at ${formatCloseTime(closeTime)}?`;
}
