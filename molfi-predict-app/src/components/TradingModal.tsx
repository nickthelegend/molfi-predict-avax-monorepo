import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { SuccessConfetti } from "./SuccessConfetti";
import { AnimatedButton } from "./AnimatedButton";
import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_URL || "https://api.molfi.com";

const tradeSchema = z.object({
  amount: z.number().min(1, "Minimum trade amount is $1").max(10000, "Maximum trade amount is $10,000"),
  shares: z.number().min(0.01, "Minimum shares is 0.01"),
});

interface TradingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    id: string;
    title: string;
    outcomeLabel?: string;
    yesPercentage: number;
    noPercentage: number;
    venue?: string;  // 'molfi' | 'polymarket' | 'limitless' — determines real vs simulated trade
  };
  preselectedSide?: 'yes' | 'no';
}

export const TradingModal = ({ open, onOpenChange, market, preselectedSide }: TradingModalProps) => {
  const [side, setSide] = useState<"yes" | "no">(preselectedSide || "yes");
  const [amount, setAmount] = useState("10");
  const [walletConnected, setWalletConnected] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { trackActivity } = useActivityTracking();

  const isExternalVenue = market.venue && market.venue !== "molfi";
  // 0.1% fee on external venue trades; no taker fee on native markets (3% deducted from winnings at settlement)
  const feeRate = isExternalVenue ? 0.001 : 0;

  const price = side === "yes" ? market.yesPercentage / 100 : market.noPercentage / 100;
  const amountNum = parseFloat(amount) || 0;
  const shares = amountNum / price;
  const potentialProfit = amountNum * (1 / price - 1);
  const tradeFee = amountNum * feeRate;

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setWalletConnected(true);
    toast({
      title: "Wallet Connected",
      description: "Your wallet has been connected successfully",
    });
  };

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      const amountValue = parseFloat(amount);
      tradeSchema.parse({ amount: amountValue, shares });

      // ── External venue (Polymarket / Limitless) — call real backend ────────
      if (isExternalVenue) {
        setIsLoading(true);
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            toast({
              title: "Authentication Required",
              description: "Please sign in to trade on external markets",
              variant: "destructive",
            });
            return;
          }

          const response = await fetch(`${API_BASE}/api/external-positions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              userId: user.id,
              marketId: market.id,
              side: side.toUpperCase(),
              dollarAmount: amountValue,
            }),
          });

          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data.error || "Trade execution failed");
          }

          const pos = data.position;

          trackActivity({
            activityType: "trade_executed",
            details: {
              marketId: market.id,
              marketTitle: market.title,
              side,
              amount: amountValue,
              shares: pos.shares,
              pricePerShare: pos.avgPrice,
              venue: market.venue,
              feePaid: pos.feePaid,
            },
          });

          setShowConfetti(true);
          toast({
            title: "Trade Executed! 🎉",
            description: `Bought ${pos.shares.toFixed(2)} ${side.toUpperCase()} shares @ $${pos.avgPrice.toFixed(3)} · Fee: $${pos.feePaid.toFixed(3)}`,
          });

          setTimeout(() => {
            onOpenChange(false);
            setShowConfetti(false);
          }, 2000);

        } finally {
          setIsLoading(false);
        }
        return;
      }

      // ── Molfi native market — current simulated path (TODO: wire CLOB) ──
      trackActivity({
        activityType: "trade_executed",
        details: {
          marketId: market.id,
          marketTitle: market.title,
          side,
          amount: amountValue,
          shares,
          pricePerShare: price,
        },
      });

      // Show success confetti
      setShowConfetti(true);
      
      // Simulate trade execution
      toast({
        title: "Trade Executed! 🎉",
        description: `Successfully bought ${shares.toFixed(2)} ${side.toUpperCase()} shares`,
      });
      
      setTimeout(() => {
        onOpenChange(false);
        setShowConfetti(false);
      }, 2000);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Invalid Input",
          description: err.errors[0].message,
          variant: "destructive",
        });
      } else if (err instanceof Error) {
        toast({
          title: "Trade Failed",
          description: err.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trade Market</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {market.title}
            {market.outcomeLabel && (
              <span className="block text-primary mt-1">Trading on: {market.outcomeLabel}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={side} onValueChange={(v) => setSide(v as "yes" | "no")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="yes" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              YES {market.yesPercentage}%
            </TabsTrigger>
            <TabsTrigger value="no" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              NO {market.noPercentage}%
            </TabsTrigger>
          </TabsList>

          <TabsContent value={side} className="space-y-6 mt-6">
            <form onSubmit={handleTrade} className="space-y-6">
              {/* Wallet Connection */}
              {!walletConnected ? (
                <Card className="p-4 border-primary/50">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">Wallet Required</p>
                      <p className="text-sm text-muted-foreground">Connect your wallet to trade</p>
                    </div>
                    <Button onClick={handleConnectWallet} size="sm">
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 bg-success/10 border-success/50">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium">Wallet Connected</p>
                      <p className="text-sm text-muted-foreground">0x1234...5678</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Amount Input */}
              <div className="space-y-3">
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="1"
                  min="1"
                  max="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  disabled={!walletConnected}
                />
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(preset.toString())}
                      disabled={!walletConnected}
                    >
                      ${preset}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Trade Summary */}
              <Card className="p-4 bg-secondary/50">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per share</span>
                    <span className="font-semibold">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="font-semibold">{shares.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Potential Profit</span>
                    <span className="font-semibold text-success">+${potentialProfit.toFixed(2)}</span>
                  </div>
                  {isExternalVenue && tradeFee > 0 && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Platform fee (0.1%)</span>
                      <span>${tradeFee.toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="font-medium">Total Cost</span>
                    <span className="font-bold text-lg">${(amountNum + tradeFee).toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!walletConnected || isLoading}
                  variant={side === "yes" ? "default" : "destructive"}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing…
                    </>
                  ) : (
                    `Buy ${side.toUpperCase()} Shares`
                  )}
                </Button>
              </div>
             </form>
           </TabsContent>
         </Tabs>
       </DialogContent>
       
       <SuccessConfetti 
         show={showConfetti} 
         onComplete={() => setShowConfetti(false)}
         message="Trade Success! 🎉"
         type="trade"
       />
     </Dialog>
   );
 };
