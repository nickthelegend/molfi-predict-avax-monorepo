import type { GlobalMarketTrade } from "@/lib/leverx/indexer-client";
import { scaleQuote } from "@/lib/predict/scaling";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface OracleTradeStats {
  total: number;
  last24h: number;
  mints: number;
  redeems: number;
  up: number;
  down: number;
  volume: number;
  volume24h: number;
}

export function summarizeGlobalTrades(
  trades: readonly GlobalMarketTrade[],
  nowMs = Date.now(),
): OracleTradeStats {
  const cutoff = nowMs - DAY_MS;
  let last24h = 0;
  let mints = 0;
  let redeems = 0;
  let up = 0;
  let down = 0;
  let volume = 0;
  let volume24h = 0;

  for (const trade of trades) {
    const notional = scaleQuote(trade.cost ?? trade.payout ?? 0);
    volume += notional;

    if (trade.trade_side === "mint") mints++;
    else redeems++;

    if (trade.is_range) {
      // Range trades are neither up nor down.
    } else if (trade.is_up) {
      up++;
    } else {
      down++;
    }

    if (trade.timestamp_ms >= cutoff) {
      last24h++;
      volume24h += notional;
    }
  }

  return {
    total: trades.length,
    last24h,
    mints,
    redeems,
    up,
    down,
    volume,
    volume24h,
  };
}
