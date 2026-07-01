import { useState, useEffect, useMemo } from "react";
import { useCoinbaseCandles, formatPrice } from "@/hooks/useCoinbaseCandles";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AssetSignal {
  asset: string;
  price: number;
  hourlyProb: number;
  dailyProb: number;
  direction: "up" | "down" | "neutral";
}

function SignalRow({ asset }: { asset: string }) {
  const data = useCoinbaseCandles(asset);

  const hourlyProb = useMemo(() => {
    if (data.hourlyBaseline <= 0 || data.currentPrice <= 0) return 50;
    const diff = ((data.currentPrice - data.hourlyBaseline) / data.hourlyBaseline) * 100;
    return Math.min(95, Math.max(5, 50 + diff * 25));
  }, [data.currentPrice, data.hourlyBaseline]);

  const dailyProb = useMemo(() => {
    if (data.dailyBaseline <= 0 || data.currentPrice <= 0) return 50;
    const diff = ((data.currentPrice - data.dailyBaseline) / data.dailyBaseline) * 100;
    return Math.min(95, Math.max(5, 50 + diff * 25));
  }, [data.currentPrice, data.dailyBaseline]);

  const avgProb = (hourlyProb + dailyProb) / 2;
  const direction = avgProb > 52 ? "up" : avgProb < 48 ? "down" : "neutral";

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg animate-pulse">
        <span className="text-xs font-bold text-muted-foreground">{asset}</span>
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-foreground">{asset}</span>
        {direction === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
        {direction === "down" && <TrendingDown className="w-3 h-3 text-red-500" />}
        {direction === "neutral" && <Minus className="w-3 h-3 text-muted-foreground" />}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground tabular-nums">${formatPrice(data.currentPrice)}</span>
        <span className={cn(
          "text-xs font-bold tabular-nums min-w-[36px] text-right",
          direction === "up" && "text-emerald-500",
          direction === "down" && "text-red-500",
          direction === "neutral" && "text-foreground",
        )}>
          {avgProb.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function ConsensusWidget() {
  const assets = ["BTC", "ETH", "SOL", "DOGE", "XRP"];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] text-muted-foreground mb-3">
        Liquidity-weighted probability signal across active hourly &amp; daily markets.
      </p>
      <div className="space-y-0.5">
        {assets.map((asset) => (
          <SignalRow key={asset} asset={asset} />
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-border">
        <p className="text-[9px] text-muted-foreground/60">
          Source: Coinbase · Updates every 30s
        </p>
      </div>
    </div>
  );
}
