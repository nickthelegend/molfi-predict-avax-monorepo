import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { MarketChart } from "./MarketChart";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileMarketDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    id: string;
    title: string;
    yesPercentage: number;
    noPercentage: number;
    volume?: string;
  };
}

export function MobileMarketDetail({ open, onOpenChange, market }: MobileMarketDetailProps) {
  const isMobile = useIsMobile();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [chartOpen, setChartOpen] = useState(true);
  const [orderbookOpen, setOrderbookOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const currentPrice = side === "yes" ? market.yesPercentage / 100 : market.noPercentage / 100;
  const estimatedShares = amount ? parseFloat(amount) / currentPrice : 0;

  const handleTrade = () => {
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }
    toast.success("Order placed successfully!");
    onOpenChange(false);
  };

  // If not mobile, return null (desktop version will handle it)
  if (!isMobile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] p-0 overflow-y-auto">
        <DialogHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2 mb-2">
            <Badge className="text-xs">Crypto</Badge>
            <Badge variant="outline" className="text-xs">Polymarket</Badge>
          </div>
          <DialogTitle className="text-base leading-tight">{market.title}</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Quick Trade Section */}
          <div className="bg-card rounded-lg border p-4 space-y-3">
            <div className="flex gap-2">
              <Button
                variant={side === "yes" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSide("yes")}
              >
                <TrendingUp className="w-4 h-4 mr-1" />
                Yes {market.yesPercentage}%
              </Button>
              <Button
                variant={side === "no" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSide("no")}
              >
                <TrendingDown className="w-4 h-4 mr-1" />
                No {market.noPercentage}%
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount (USD)</span>
                <span className="text-xs text-muted-foreground">Balance: $1,000</span>
              </div>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex gap-2">
                {[10, 25, 50, 100].map((val) => (
                  <Button
                    key={val}
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => setAmount(val.toString())}
                  >
                    ${val}
                  </Button>
                ))}
              </div>
            </div>

            {amount && (
              <div className="bg-muted/50 rounded p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Shares</span>
                  <span className="font-medium">{estimatedShares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Price</span>
                  <span className="font-medium">${currentPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Return</span>
                  <span className="font-medium text-green-500">
                    ${(estimatedShares * (1 - currentPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleTrade}>
              Place Order
            </Button>
          </div>

          {/* Collapsible Chart Section */}
          <Collapsible open={chartOpen} onOpenChange={setChartOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-card rounded-lg border">
              <span className="font-semibold text-sm">Price Chart</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${chartOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-card rounded-lg border p-3 h-[250px]">
                <MarketChart marketId={market.id} />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Collapsible Orderbook Section */}
          <Collapsible open={orderbookOpen} onOpenChange={setOrderbookOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-card rounded-lg border">
              <span className="font-semibold text-sm">Order Book</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${orderbookOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-card rounded-lg border p-3 space-y-2">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-green-500 mb-1">Bids (Yes)</div>
                  {[
                    { price: 0.67, size: 150 },
                    { price: 0.66, size: 200 },
                    { price: 0.65, size: 180 },
                  ].map((order, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-green-500">${order.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{order.size}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 space-y-1">
                  <div className="text-xs font-semibold text-red-500 mb-1">Asks (No)</div>
                  {[
                    { price: 0.33, size: 120 },
                    { price: 0.34, size: 160 },
                    { price: 0.35, size: 140 },
                  ].map((order, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-red-500">${order.price.toFixed(2)}</span>
                      <span className="text-muted-foreground">{order.size}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Collapsible Market Details Section */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-card rounded-lg border">
              <span className="font-semibold text-sm">Market Details</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="bg-card rounded-lg border p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{market.volume || "$2.8M"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Liquidity</span>
                  <span className="font-medium">$2.8M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="font-medium">1,847</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium">March 31, 2026</span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}
