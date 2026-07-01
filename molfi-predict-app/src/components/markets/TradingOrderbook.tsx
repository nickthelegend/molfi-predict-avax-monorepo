import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, TrendingDown, Lock } from "lucide-react";

interface TradingOrderbookProps {
  asset: string;
  yesProb: number;
}

export function TradingOrderbook({ asset, yesProb }: TradingOrderbookProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippage] = useState(0.5);

  const noProb = 100 - yesProb;
  const currentPrice = side === "yes" ? yesProb : noProb;
  const estimatedShares = Number(amount) / (currentPrice / 100);

  // Generate demo orderbook levels
  const generateLevels = (basePrice: number, count: number, isAsk: boolean) => {
    return Array.from({ length: count }, (_, i) => ({
      price: basePrice + (isAsk ? (i + 1) * 0.5 : -(i + 1) * 0.5),
      size: Math.round(20 + Math.random() * 180),
      total: 0,
    })).map((level, i, arr) => ({
      ...level,
      total: arr.slice(0, i + 1).reduce((s, l) => s + l.size, 0),
    }));
  };

  const asks = generateLevels(yesProb, 6, true).reverse();
  const bids = generateLevels(yesProb, 6, false);
  const maxTotal = Math.max(...asks.map(a => a.total), ...bids.map(b => b.total));

  return (
    <div className="flex flex-col h-full">
      {/* Order Book Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Book</span>
        <span
          className="text-[9px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border border-warning/40 text-warning"
          title="Indicative depth around the live midpoint. The on-chain CLOB matches off-chain; settlement is on-chain. Private positions are held in the shielded pool."
        >
          Indicative
        </span>
      </div>

      {/* Mini orderbook */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-0.5">
          {/* Asks */}
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Asks</span>
          </div>
          {asks.map((ask, i) => (
            <div key={i} className="flex justify-between items-center text-[11px] py-0.5 px-1 rounded relative overflow-hidden">
              <div className="absolute right-0 top-0 bottom-0 bg-red-500/8" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
              <span className="text-red-500 font-medium tabular-nums relative z-10">{ask.price.toFixed(1)}¢</span>
              <span className="text-muted-foreground tabular-nums relative z-10">{ask.size}</span>
            </div>
          ))}

          {/* Spread */}
          <div className="text-center py-1.5 border-y border-border/50 my-1">
            <span className="text-xs font-bold tabular-nums">{yesProb.toFixed(1)}¢</span>
            <span className="text-[10px] text-muted-foreground ml-1">spread 1.0¢</span>
          </div>

          {/* Bids */}
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Bids</span>
          </div>
          {bids.map((bid, i) => (
            <div key={i} className="flex justify-between items-center text-[11px] py-0.5 px-1 rounded relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/8" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
              <span className="text-emerald-500 font-medium tabular-nums relative z-10">{bid.price.toFixed(1)}¢</span>
              <span className="text-muted-foreground tabular-nums relative z-10">{bid.size}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy — the real Molfi feature: shield positions in the ZK pool */}
      <Link
        to="/demo"
        className="mx-3 mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-[11px] hover:border-primary/60 transition-colors"
      >
        <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          <span className="font-semibold text-primary">Trade privately</span> — shield your
          position with a zero-knowledge proof in the Molfi pool
        </span>
      </Link>

      {/* Order Form */}
      <div className="border-t border-border p-3 space-y-3">
        {/* Order type tabs */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
          <TabsList className="w-full h-7">
            <TabsTrigger value="market" className="flex-1 text-[10px] h-6">Market</TabsTrigger>
            <TabsTrigger value="limit" className="flex-1 text-[10px] h-6">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Side toggle */}
        <div className="grid grid-cols-2 gap-1">
          <Button
            size="sm"
            variant={side === "yes" ? "default" : "outline"}
            className={cn("h-7 text-xs", side === "yes" && "bg-emerald-500 hover:bg-emerald-600 text-white")}
            onClick={() => setSide("yes")}
          >
            Buy Yes {yesProb.toFixed(0)}¢
          </Button>
          <Button
            size="sm"
            variant={side === "no" ? "default" : "outline"}
            className={cn("h-7 text-xs", side === "no" && "bg-red-500 hover:bg-red-600 text-white")}
            onClick={() => setSide("no")}
          >
            Buy No {noProb.toFixed(0)}¢
          </Button>
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Amount (USDC)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-8 text-sm"
            placeholder="0.00"
          />
          <div className="flex gap-1">
            {[5, 10, 25, 50].map((v) => (
              <Button key={v} variant="outline" size="sm" className="h-5 text-[9px] flex-1 px-0" onClick={() => setAmount(String(v))}>
                ${v}
              </Button>
            ))}
          </div>
        </div>

        {/* Limit price (only for limit orders) */}
        {orderType === "limit" && (
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Limit Price (¢)</Label>
            <Input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="h-8 text-sm"
              placeholder={currentPrice.toFixed(1)}
            />
          </div>
        )}

        {/* Summary */}
        <div className="rounded-md bg-muted/50 p-2 space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Price</span>
            <span className="font-medium tabular-nums">{currentPrice.toFixed(1)}¢</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Shares</span>
            <span className="font-medium tabular-nums">{isFinite(estimatedShares) ? estimatedShares.toFixed(1) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Max Payout</span>
            <span className="font-medium tabular-nums text-emerald-500">
              ${isFinite(estimatedShares) ? estimatedShares.toFixed(2) : "—"}
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className={cn(
            "w-full h-9 text-xs font-bold",
            side === "yes"
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          )}
        >
          {orderType === "market" ? "Place Market Order" : "Place Limit Order"}
        </Button>

        <p className="text-[9px] text-muted-foreground text-center">
          Slippage tolerance: {slippage}%
        </p>
      </div>
    </div>
  );
}
