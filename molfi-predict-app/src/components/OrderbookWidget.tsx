import { useOrderbook } from "@/hooks/useOrderbook";
import { LoadingSpinner } from "./LoadingSpinner";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderbookWidgetProps {
  marketId: string;
  compact?: boolean;
}

export function OrderbookWidget({ marketId, compact = false }: OrderbookWidgetProps) {
  const { orderbook, isLoading } = useOrderbook(marketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!orderbook) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        <p className="font-medium mb-1">No orderbook data</p>
        <p className="text-xs">Live order book will populate when WebSocket data streams in.</p>
      </div>
    );
  }

  const displayBids = compact ? orderbook.bids.slice(0, 5) : orderbook.bids;
  const displayAsks = compact ? orderbook.asks.slice(0, 5) : orderbook.asks;

  return (
    <div className="space-y-4">
      {/* Spread */}
      <div className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
        <span className="text-xs text-muted-foreground">Spread</span>
        <span className="text-sm font-semibold">{(orderbook.spread * 100).toFixed(2)}¢</span>
      </div>

      {/* Asks (Sell orders) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <span className="text-xs font-semibold text-muted-foreground">ASKS (SELL)</span>
        </div>
        <div className="space-y-1">
          {displayAsks.map((ask, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm p-2 rounded hover:bg-destructive/5 transition-colors relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-destructive/10"
                style={{ width: `${(ask.size / Math.max(...displayAsks.map((a) => a.size))) * 100}%` }}
              />
              <span className="text-destructive font-medium relative z-10">{(ask.price * 100).toFixed(1)}¢</span>
              <span className="text-muted-foreground relative z-10">{ask.size.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mid Price */}
      <div className="text-center py-2 border-y">
        <div className="text-xs text-muted-foreground mb-1">Mid Price</div>
        <div className="text-lg font-bold">{(orderbook.midPrice * 100).toFixed(1)}¢</div>
      </div>

      {/* Bids (Buy orders) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <span className="text-xs font-semibold text-muted-foreground">BIDS (BUY)</span>
        </div>
        <div className="space-y-1">
          {displayBids.map((bid, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm p-2 rounded hover:bg-success/5 transition-colors relative overflow-hidden"
            >
              <div
                className="absolute left-0 top-0 bottom-0 bg-success/10"
                style={{ width: `${(bid.size / Math.max(...displayBids.map((b) => b.size))) * 100}%` }}
              />
              <span className="text-success font-medium relative z-10">{(bid.price * 100).toFixed(1)}¢</span>
              <span className="text-muted-foreground relative z-10">{bid.size.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
