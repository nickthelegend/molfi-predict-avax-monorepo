import { useMemo } from "react";
import { useMarketBaseline } from "@/hooks/useMarketBaseline";
import { usePriceTicker } from "@/hooks/usePriceTicker";
import { cn } from "@/lib/utils";
import { Clock, Loader2 } from "lucide-react";

interface CoinbaseMarketCardProps {
  asset: string;
  timeframe: "hourly" | "daily";
  isSelected?: boolean;
  compact?: boolean;
  expanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

/**
 * CoinbaseMarketCard — uses shared baseline cache + WebSocket ticker.
 * NO candle fetching. NO Coinbase REST polling.
 */
export function CoinbaseMarketCard({ asset, timeframe, isSelected = false, compact = false, expanded = false, onClick }: CoinbaseMarketCardProps) {
  const { baseline, periodEnd, isLoading: baselineLoading } = useMarketBaseline(asset, timeframe);
  const { price: currentPrice } = usePriceTicker(asset);
  const isDaily = timeframe === "daily";

  const closeTime = useMemo(() => new Date(periodEnd), [periodEnd]);

  const question = useMemo(() => {
    if (baseline <= 0) return `${asset} market loading...`;
    const fmtBl = formatPrice(baseline);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const d = closeTime;
    const dateStr = `${months[d.getUTCMonth()]}-${String(d.getUTCDate()).padStart(2, "0")}-${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
    return `${asset} will close above $${fmtBl} at ${dateStr}?`;
  }, [asset, baseline, closeTime]);

  const yesProb = useMemo(() => {
    if (baseline <= 0 || currentPrice <= 0) return 50;
    const diff = ((currentPrice - baseline) / baseline) * 100;
    return Math.min(95, Math.max(5, 50 + diff * 25));
  }, [currentPrice, baseline]);

  const noProb = 100 - yesProb;

  const timeLeftText = useMemo(() => {
    const diff = periodEnd - Date.now();
    if (diff <= 0) return "Closing...";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m left`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${mins % 60}m left`;
    return `${Math.floor(hrs / 24)}d ${hrs % 24}h left`;
  }, [periodEnd]);

  const priceColor = currentPrice >= baseline ? "text-emerald-500" : "text-red-500";

  if (baselineLoading && currentPrice === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-center min-h-[80px]">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 transition-all flex flex-col",
        onClick && "cursor-pointer hover:shadow-md",
        isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Top row: badges */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
            isDaily ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
          )}>
            {timeframe}
          </span>
          {isDaily && (
            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
              5x
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          <Clock className="w-2.5 h-2.5" />
          {timeLeftText}
        </span>
      </div>

      {/* Question */}
      <h3 className={cn("font-semibold leading-snug mb-3", compact ? "text-xs line-clamp-1" : "text-sm line-clamp-2")}>
        {question}
      </h3>

      {/* Current price */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted-foreground">Current</span>
        <span className={cn("font-bold tabular-nums", priceColor)}>
          ${formatPrice(currentPrice)}
        </span>
      </div>

      {/* YES/NO bar */}
      <div className="flex h-5 rounded-md overflow-hidden mb-1">
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white bg-emerald-500 transition-all"
          style={{ width: `${Math.max(yesProb, 10)}%` }}
        >
          {yesProb >= 20 && `${yesProb.toFixed(0)}%`}
        </div>
        <div
          className="flex items-center justify-center text-[10px] font-bold text-white bg-red-500 transition-all"
          style={{ width: `${Math.max(noProb, 10)}%` }}
        >
          {noProb >= 20 && `${noProb.toFixed(0)}%`}
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Yes <span className="font-semibold text-emerald-500">{yesProb.toFixed(0)}%</span></span>
        <span>No <span className="font-semibold text-red-500">{noProb.toFixed(0)}%</span></span>
      </div>
    </div>
  );
}
