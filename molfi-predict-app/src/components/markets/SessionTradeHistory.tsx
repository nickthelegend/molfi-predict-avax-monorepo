import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Clock, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface TradeEntry {
  id: string;
  asset: string;
  side: "yes" | "no";
  orderType: "market" | "limit";
  amount: number;
  leverage: number;
  price: number;
  timestamp: number;
  stopLoss?: string;
  takeProfit?: string;
}

interface SessionTradeHistoryProps {
  trades: TradeEntry[];
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function SessionTradeHistory({ trades }: SessionTradeHistoryProps) {
  const summary = useMemo(() => {
    let totalDeployed = 0;
    let totalMaxPayout = 0;
    let yesCount = 0;
    let noCount = 0;

    for (const t of trades) {
      totalDeployed += t.amount;
      const effectiveAmount = t.amount * t.leverage;
      const shares = t.price > 0 ? effectiveAmount / (t.price / 100) : 0;
      totalMaxPayout += isFinite(shares) ? shares : 0;
      if (t.side === "yes") yesCount++;
      else noCount++;
    }

    const estProfit = totalMaxPayout - totalDeployed;
    return { totalDeployed, totalMaxPayout, estProfit, yesCount, noCount };
  }, [trades]);

  if (trades.length === 0) return null;

  return (
    <div className="border-t border-border pt-2 space-y-1.5">
      {/* PnL Summary */}
      <div className="rounded-md bg-muted/40 p-2 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3" /> Session ({trades.length})
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-emerald-500 font-medium">{summary.yesCount} Yes</span>
            <span className="text-destructive font-medium">{summary.noCount} No</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Deployed</span>
          <span className="font-bold tabular-nums">${summary.totalDeployed.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground">Max Payout</span>
          <span className="font-bold tabular-nums">${summary.totalMaxPayout.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] border-t border-border pt-1">
          <span className="text-muted-foreground font-semibold flex items-center gap-0.5">
            {summary.estProfit >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
            Est. Profit
          </span>
          <span className={cn("font-bold tabular-nums", summary.estProfit >= 0 ? "text-emerald-500" : "text-destructive")}>
            {summary.estProfit >= 0 ? "+" : ""}${summary.estProfit.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Trade list */}
      <ScrollArea className="max-h-32">
        <div className="space-y-1">
          {trades.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded bg-muted/30 px-2 py-1 text-[10px]"
            >
              <div className="flex items-center gap-1.5">
                {t.side === "yes" ? (
                  <ArrowUp className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-destructive" />
                )}
                <span className="font-medium">{t.asset}</span>
                <span className={cn(
                  "px-1 rounded text-[8px] font-bold uppercase",
                  t.side === "yes" ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                )}>
                  {t.side}
                </span>
                {t.leverage > 1 && (
                  <span className="text-[8px] font-bold text-primary">{t.leverage}x</span>
                )}
                {t.stopLoss && <span className="text-[7px] text-destructive">SL:{t.stopLoss}</span>}
                {t.takeProfit && <span className="text-[7px] text-emerald-500">TP:{t.takeProfit}</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums font-medium">${t.amount.toFixed(2)}</span>
                <span className="text-muted-foreground tabular-nums">{formatTime(t.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
