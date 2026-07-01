import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { DataTable, type Column } from "@/components/DataTable";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import { AnimatedPremium, AnimatedQuantity } from "@/components/ui/animated-numbers";
import type { GlobalMarketTrade } from "@/lib/leverx/indexer-client";
import { tradePremiumRaw } from "@/lib/leverx/indexer-markets";
import type { PredictSide } from "@/lib/predict/instruments";
import { cn } from "@/lib/utils";

interface Props {
  trades: readonly GlobalMarketTrade[];
  className?: string;
  paginationKey?: string | number;
  pageSize?: number;
}

interface TradeRow {
  id: string;
  trade: GlobalMarketTrade;
}

function formatTradeTime(ms: number): string {
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function tradePriceRaw(trade: GlobalMarketTrade): number | null {
  return tradePremiumRaw(trade);
}

function tradeOutcomeSide(trade: GlobalMarketTrade): PredictSide {
  if (trade.is_range) return "range";
  return trade.is_up ? "up" : "down";
}

export function MarketTradesTable({
  trades,
  className,
  paginationKey,
  pageSize,
}: Props) {
  const rows: TradeRow[] = trades.map((trade) => ({
    id: trade.event_digest,
    trade,
  }));

  const cols: Column<TradeRow>[] = [
    {
      key: "side",
      header: "Side",
      mobileEmphasis: true,
      cell: (r) => {
        const t = r.trade;
        return (
          <span className="flex min-w-0 items-center gap-1.5 font-mono text-sm">
            {t.trade_side === "mint" ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-success" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 shrink-0 text-destructive" />
            )}
            <span
              className={cn(
                "inline-flex items-center gap-1.5",
                t.is_range ? "text-foreground" : t.is_up ? "text-success" : "text-destructive",
              )}
            >
              <span>{t.trade_side === "mint" ? "OPEN" : "CLOSE"}</span>
              <PredictSideLabel side={tradeOutcomeSide(t)} />
            </span>
          </span>
        );
      },
    },
    {
      key: "price",
      header: "Price",
      align: "right",
      mobileTrailing: true,
      cell: (r) => (
        <AnimatedPremium
          value={tradePriceRaw(r.trade)}
          className="text-sm"
          placeholder="—"
        />
      ),
    },
    {
      key: "time",
      header: "Time",
      mobileLabel: "Time",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {formatTradeTime(r.trade.timestamp_ms)}
        </span>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (r) => (
        <AnimatedQuantity value={r.trade.quantity} className="text-sm" />
      ),
    },
  ];

  return (
    <div className={className}>
      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(r) => r.id}
        paginationKey={paginationKey}
        pageSize={pageSize}
      />
    </div>
  );
}
