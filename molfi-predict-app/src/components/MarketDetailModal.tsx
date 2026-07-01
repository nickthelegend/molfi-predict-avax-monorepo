import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TrendingUp, TrendingDown, ExternalLink, Copy, Activity, Clock, Users } from "lucide-react";
import { MarketChart } from "./MarketChart";
import { PriceAlertsPanel } from "./PriceAlertsPanel";
import { toast } from "sonner";

interface MarketDetailModalProps {
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

export function MarketDetailModal({ open, onOpenChange, market }: MarketDetailModalProps) {
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [slippage, setSlippage] = useState([0.5]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Mock available balance - in production, this would come from wallet/portfolio
  const availableBalance = 1000;

  // Mock data
  const metadata = {
    liquidity: "2.8M",
    participants: 1847,
    endDate: "March 31, 2026",
    category: "Crypto",
    venue: "Polymarket",
    contractAddress: "0x1234...5678",
    lastTrade: "2 mins ago",
    spread: "0.5%"
  };

  const recentTrades = [
    { side: "buy", amount: 150, price: 0.67, time: "2m ago" },
    { side: "sell", amount: 80, price: 0.66, time: "5m ago" },
    { side: "buy", amount: 200, price: 0.67, time: "8m ago" },
  ];

  const currentPrice = side === "yes" ? market.yesPercentage / 100 : market.noPercentage / 100;
  const estimatedShares = amount ? parseFloat(amount) / currentPrice : 0;
  const fees = amount ? parseFloat(amount) * 0.02 : 0;
  const investedAmount = parseFloat(amount || "0");
  
  // Calculate P&L metrics
  const potentialProfit = estimatedShares * (1 - currentPrice);
  const maximumLoss = investedAmount; // Can lose entire investment if wrong
  const riskRewardRatio = maximumLoss > 0 ? (potentialProfit / maximumLoss) * 100 : 0;
  const breakEvenPrice = estimatedShares > 0 ? (investedAmount + fees) / estimatedShares : 0;
  
  // Win rate calculation (implied probability from current price)
  const impliedWinRate = currentPrice * 100;
  const requiredWinRate = breakEvenPrice * 100;

  const handleTradeClick = () => {
    if (!amount) {
      toast.error("Please enter amount");
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirmTrade = () => {
    toast.success("Order placed successfully!");
    setShowConfirmation(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <div className="grid grid-cols-3 h-[85vh]">
            {/* Left 2/3 - Chart & Market Data */}
            <div className="col-span-2 flex flex-col border-r overflow-hidden">
              <div className="p-4 pb-2 flex-shrink-0">
              {/* Header */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs">{metadata.category}</Badge>
                  <Badge variant="outline" className="text-xs">{metadata.venue}</Badge>
                </div>
                <h2 className="text-lg font-bold mb-1">{market.title}</h2>
              </div>

              {/* Chart */}
              <Card className="p-2 mb-3">
                <MarketChart marketId={market.id} height={200} />
              </Card>

              {/* Market Stats Grid */}
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Volume</div>
                  <div className="text-sm font-bold">${market.volume}</div>
                </Card>
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Liquidity</div>
                  <div className="text-sm font-bold">${metadata.liquidity}</div>
                </Card>
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Participants</div>
                  <div className="text-sm font-bold">{metadata.participants}</div>
                </Card>
                <Card className="p-2">
                  <div className="text-xs text-muted-foreground mb-0.5">Spread</div>
                  <div className="text-sm font-bold">{metadata.spread}</div>
                </Card>
              </div>
              </div>

              {/* Scrollable section */}
              <div className="flex-1 overflow-y-auto p-4 pt-2">

              {/* Market Details */}
              <Card className="p-2 mb-3">
                <h3 className="font-semibold text-xs mb-2">Market Details</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {metadata.endDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Trade</span>
                  <span className="font-medium">{metadata.lastTrade}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract</span>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(metadata.contractAddress); toast.success("Copied!"); }}
                    className="font-medium flex items-center gap-1 hover:text-primary"
                  >
                    {metadata.contractAddress}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Venue</span>
                  <span className="font-medium flex items-center gap-1">
                    {metadata.venue}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </Card>

              {/* Recent Activity */}
              <Card className="p-2 mb-3">
                <h3 className="font-semibold text-xs mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  Recent Trades
                </h3>
                <div className="space-y-1">
                  {recentTrades.map((trade, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded hover:bg-secondary/30">
                      <Badge variant={trade.side === "buy" ? "default" : "outline"} className={`text-xs ${trade.side === "buy" ? "bg-success" : "bg-destructive"}`}>
                        {trade.side.toUpperCase()}
                      </Badge>
                      <span className="text-xs">{trade.amount} shares</span>
                      <span className="text-xs font-medium">{(trade.price * 100).toFixed(1)}¢</span>
                      <span className="text-xs text-muted-foreground">{trade.time}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Price Alerts */}
              <PriceAlertsPanel 
                marketId={market.id} 
                marketTitle={market.title}
                currentPrice={currentPrice}
              />
            </div>
          </div>

            {/* Right 1/3 - Trading Interface */}
            <div className="p-3 bg-secondary/20 flex flex-col">
              <h3 className="text-sm font-bold mb-2">Place Order</h3>

              {/* Order Type */}
              <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")} className="mb-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="market" className="text-xs">Market</TabsTrigger>
                  <TabsTrigger value="limit" className="text-xs">Limit</TabsTrigger>
                </TabsList>

                <TabsContent value="market" className="space-y-2 mt-2">
                    <div>
                      <Label className="text-xs">Amount (USD)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 h-8 text-sm"
                      />
                      <div className="flex gap-1 mt-1">
                        {[10, 25, 50, 100].map((v) => (
                          <Button key={v} variant="outline" size="sm" onClick={() => setAmount(v.toString())} className="text-xs h-6 px-2">
                            ${v}
                          </Button>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setAmount(availableBalance.toString())} 
                          className="text-xs h-6 px-2 bg-primary/10"
                        >
                          Max
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Available: ${availableBalance.toFixed(2)}</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <Label className="text-xs">Slippage</Label>
                        <span className="text-xs font-medium">{slippage[0]}%</span>
                      </div>
                      <Slider value={slippage} onValueChange={setSlippage} max={5} step={0.1} />
                    </div>
                </TabsContent>

                <TabsContent value="limit" className="space-y-2 mt-2">
                    <div>
                      <Label className="text-xs">Amount (USD)</Label>
                      <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 h-8 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs">Limit Price</Label>
                      <Input type="number" placeholder="0.00" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="mt-1 h-8 text-sm" step="0.01" />
                    </div>
                </TabsContent>
              </Tabs>

              {/* Order Summary */}
              <Card className="p-2 bg-background/50 mb-2">
                <h4 className="text-xs font-semibold mb-1.5">Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-medium">{estimatedShares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg. Price</span>
                    <span className="font-medium">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fees (2%)</span>
                    <span className="font-medium">${fees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">${(investedAmount + fees).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t text-success">
                    <span className="text-muted-foreground">Potential Profit</span>
                    <span className="font-medium">+${potentialProfit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span className="text-muted-foreground">Maximum Loss</span>
                    <span className="font-medium">-${maximumLoss.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Break-Even Price</span>
                    <span className="font-medium">${breakEvenPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-muted-foreground">Risk/Reward</span>
                    <span className="font-semibold">{riskRewardRatio.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-muted-foreground">Implied Win Rate</span>
                    <span className="font-medium">{impliedWinRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Required Win Rate</span>
                    <span className="font-medium">{requiredWinRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              {/* Side Selection at bottom */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={side === "yes" ? "default" : "outline"}
                  onClick={() => { setSide("yes"); handleTradeClick(); }}
                  className={`h-9 ${side === "yes" ? "bg-success hover:bg-success/90" : ""}`}
                  disabled={!amount}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  YES {market.yesPercentage}¢
                </Button>
                <Button
                  variant={side === "no" ? "default" : "outline"}
                  onClick={() => { setSide("no"); handleTradeClick(); }}
                  className={`h-9 ${side === "no" ? "bg-destructive hover:bg-destructive/90" : ""}`}
                  disabled={!amount}
                >
                  <TrendingDown className="w-3 h-3 mr-1" />
                  NO {market.noPercentage}¢
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <div className="text-sm">
                You are about to place a <span className="font-semibold">{orderType}</span> order for <span className="font-semibold">{side.toUpperCase()}</span> on:
              </div>
              <div className="font-medium text-foreground">{market.title}</div>
              <div className="grid grid-cols-2 gap-2 text-xs mt-3 p-3 bg-secondary/30 rounded">
                <div>Amount:</div>
                <div className="font-medium text-right">${investedAmount.toFixed(2)}</div>
                <div>Shares:</div>
                <div className="font-medium text-right">{estimatedShares.toFixed(2)}</div>
                <div>Total Cost:</div>
                <div className="font-medium text-right">${(investedAmount + fees).toFixed(2)}</div>
                <div className="text-success">Potential Profit:</div>
                <div className="font-medium text-right text-success">+${potentialProfit.toFixed(2)}</div>
                <div className="text-destructive">Maximum Loss:</div>
                <div className="font-medium text-right text-destructive">-${maximumLoss.toFixed(2)}</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmTrade}>Confirm Order</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
