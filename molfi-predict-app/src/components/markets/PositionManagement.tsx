import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTradingStore } from "@/hooks/useTradingStore";
import { usePriceTicker } from "@/hooks/usePriceTicker";
import { useMarketBaseline } from "@/hooks/useMarketBaseline";
import { walletAPI } from "@/services/wallet-provider";
import { toast } from "sonner";

/** Compute live YES probability from price vs baseline */
function computeYesProb(currentPrice: number, baseline: number) {
  if (baseline <= 0 || currentPrice <= 0) return 50;
  return Math.min(95, Math.max(5, 50 + ((currentPrice - baseline) / baseline) * 100 * 25));
}

function PositionRow({ position, onClose }: { position: any; onClose: (pnl: number) => void }) {
  const { price: currentPrice } = usePriceTicker(position.asset);
  const { baseline } = useMarketBaseline(position.asset, position.timeframe);

  const currentYesProb = computeYesProb(currentPrice, baseline);
  const currentCents = position.side === "YES" ? currentYesProb : (100 - currentYesProb);
  const pnl = (currentCents - position.entryPrice) * position.shares / 100;
  const pnlPercent = position.entryPrice > 0 ? ((currentCents - position.entryPrice) / position.entryPrice) * 100 : 0;

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="p-2 pl-4 font-medium">{position.market}</td>
      <td className="p-2">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", position.side === "YES" ? "text-emerald-500 border-emerald-500/30" : "text-red-500 border-red-500/30")}>
          {position.side}
        </Badge>
      </td>
      <td className="p-2 text-right tabular-nums">${position.size.toFixed(2)}</td>
      <td className="p-2 text-right tabular-nums">{position.entryPrice.toFixed(1)}¢</td>
      <td className="p-2 text-right tabular-nums">{currentCents.toFixed(1)}¢</td>
      <td className={cn("p-2 text-right tabular-nums font-bold", pnl >= 0 ? "text-emerald-500" : "text-red-500")}>
        {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
        <span className="text-muted-foreground font-normal ml-1">({pnlPercent.toFixed(1)}%)</span>
      </td>
      <td className="p-2 pr-4 text-right">
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive" onClick={() => onClose(pnl)}>
          <X className="w-3 h-3 mr-1" /> Close
        </Button>
      </td>
    </tr>
  );
}

export function PositionManagement() {
  const [tab, setTab] = useState("positions");
  const { positions, orders, closePosition } = useTradingStore();

  const handleClose = async (posId: string, pnl: number) => {
    const pos = positions.find((p) => p.id === posId);
    if (pos) {
      // Return margin + profit (or margin - loss) to available balance
      const returnAmount = pos.size + pnl;
      try {
        if (returnAmount > 0) {
          await walletAPI.deposit(returnAmount);
        }
      } catch (err) {
        console.error("Failed to return margin:", err);
      }
    }
    closePosition(posId);
    toast.success(`Position closed${pnl >= 0 ? ` — +$${pnl.toFixed(2)} profit` : ` — -$${Math.abs(pnl).toFixed(2)} loss`}`);
  };

  const openOrders = orders.filter((_, i) => false); // No open orders in demo — all are instantly filled
  const filledOrders = orders;

  return (
    <div className="border-t border-border bg-card">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between px-4 pt-2">
          <TabsList className="h-8 bg-transparent p-0 gap-4">
            <TabsTrigger value="positions" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Positions ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Orders ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs h-7 px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              History ({filledOrders.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="positions" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-right p-2 font-medium">Entry</th>
                  <th className="text-right p-2 font-medium">Current</th>
                  <th className="text-right p-2 font-medium">PnL</th>
                  <th className="text-right p-2 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <PositionRow key={pos.id} position={pos} onClose={(pnl) => handleClose(pos.id, pnl)} />
                ))}
                {positions.length === 0 && (
                  <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">No open positions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-left p-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.length === 0 && (
                  <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">No open orders</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0">
          <div className="overflow-x-auto max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card z-10">
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-2 pl-4 font-medium">Market</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Side</th>
                  <th className="text-right p-2 font-medium">Price</th>
                  <th className="text-right p-2 font-medium">Size</th>
                  <th className="text-right p-2 font-medium">Shares</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-right p-2 pr-4 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filledOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="p-2 pl-4 font-medium">{order.market}</td>
                    <td className="p-2"><Badge variant="outline" className="text-[10px] px-1.5 py-0">{order.type}</Badge></td>
                    <td className="p-2"><span className="font-medium text-emerald-500">{order.side}</span></td>
                    <td className="p-2 text-right tabular-nums">{order.price.toFixed(1)}¢</td>
                    <td className="p-2 text-right tabular-nums">${order.size.toFixed(2)}</td>
                    <td className="p-2 text-right tabular-nums">{order.shares.toFixed(1)}</td>
                    <td className="p-2"><Badge variant="secondary" className="text-[10px] px-1.5 py-0">filled</Badge></td>
                    <td className="p-2 pr-4 text-right text-muted-foreground">{new Date(order.filledAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
                {filledOrders.length === 0 && (
                  <tr><td colSpan={8} className="text-center p-6 text-muted-foreground">No order history</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
