import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, ExternalLink, Network, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { WalletBalance } from "./WalletBalance";
import Confetti from "react-confetti";
import { ShareResult } from "./ShareResult";

interface AggregatorDemoProps {
  onBack: () => void;
}

export function AggregatorDemo({ onBack }: AggregatorDemoProps) {
  const [step, setStep] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [betSide, setBetSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("50");
  const [usdcBalance, setUsdcBalance] = useState(1000);
  const [yesTokens, setYesTokens] = useState(0);
  const [optimismTxHash, setOptimismTxHash] = useState("");
  const [baseTxHash, setBaseTxHash] = useState("");
  const [flowStep, setFlowStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const markets = [
    {
      id: "eth-5k-poly",
      title: "Will ETH reach $5000?",
      venue: "Polymarket",
      chain: "Base Sepolia",
      yesPrice: 0.42,
      noPrice: 0.58,
      liquidity: 850000,
      spread: 0.02,
    },
    {
      id: "btc-100k-limit",
      title: "Will BTC reach $100k?",
      venue: "Limitless",
      chain: "Polygon",
      yesPrice: 0.68,
      noPrice: 0.32,
      liquidity: 450000,
      spread: 0.015,
    },
  ];

  const generateTxHash = () => {
    return "0x" + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  const executeCrossChain = async () => {
    setIsExecuting(true);
    setStep(3);

    // Intent signing
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success("Intent signed on Optimism!");
    setStep(4);

    // Cross-chain flow
    const steps = [
      { msg: "Intent signed on Optimism", delay: 1000 },
      { msg: "Funds reserved in escrow (50 USDC locked)", delay: 1500 },
      { msg: "Sending cross-chain message via ViaLabs...", delay: 2000 },
      { msg: "Message received on Base", delay: 1500 },
      { msg: "BetManager processing...", delay: 1500 },
      { msg: "Executing on Polymarket via CLOB API", delay: 2000 },
      { msg: "119 YES tokens received!", delay: 1500 },
      { msg: "Receipt generated", delay: 1000 },
      { msg: "Attestation bridging back to Hub...", delay: 2000 },
      { msg: "Attestation verified on Optimism", delay: 1500 },
      { msg: "Escrow released", delay: 1000 },
      { msg: "Position minted to user", delay: 1000 },
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, steps[i].delay));
      setFlowStep(i + 1);
      toast.info(steps[i].msg);
      
      if (i === 2) {
        setOptimismTxHash(generateTxHash());
      }
      if (i === 5) {
        setBaseTxHash(generateTxHash());
      }
    }

    const betAmount = parseFloat(amount);
    setUsdcBalance(prev => prev - betAmount);
    setYesTokens(119);
    
    toast.success("Cross-chain bet executed successfully!");
    setIsExecuting(false);
    setStep(5);
  };

  const reset = () => {
    setStep(1);
    setSelectedMarket(null);
    setUsdcBalance(1000);
    setYesTokens(0);
    setOptimismTxHash("");
    setBaseTxHash("");
    setFlowStep(0);
  };

  const selectedMarketData = markets.find(m => m.id === selectedMarket);

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="ghost">← Back to Home</Button>
          <h2 className="text-3xl font-bold mt-2">Cross-Chain Aggregator Demo</h2>
          <p className="text-muted-foreground">Step {step} of 5</p>
        </div>
        <WalletBalance usdcBalance={usdcBalance} yesTokens={yesTokens} />
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Market Browser */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Select a Market</h3>
              <div className="flex gap-2">
                <Badge variant="outline">All Venues</Badge>
                <Badge variant="outline">All Chains</Badge>
              </div>
            </div>
            
            {markets.map((market) => (
              <Card
                key={market.id}
                className="cursor-pointer hover:border-secondary transition-colors"
                onClick={() => {
                  setSelectedMarket(market.id);
                  setStep(2);
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{market.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{market.venue}</Badge>
                        <Badge variant="outline">{market.chain}</Badge>
                      </CardDescription>
                    </div>
                    <Network className="w-8 h-8 text-secondary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">YES Price</div>
                      <div className="text-lg font-bold text-success">${market.yesPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">NO Price</div>
                      <div className="text-lg font-bold text-destructive">${market.noPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Liquidity</div>
                      <div className="text-lg font-bold">${(market.liquidity / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Venue Spread</div>
                      <div className="text-lg font-bold">${market.spread.toFixed(3)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Step 2: Bet Form */}
        {step === 2 && selectedMarketData && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Place Bet</CardTitle>
                <CardDescription>
                  {selectedMarketData.title} • {selectedMarketData.venue} on {selectedMarketData.chain}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Outcome</Label>
                  <Tabs value={betSide} onValueChange={(v) => setBetSide(v as "YES" | "NO")}>
                    <TabsList className="w-full">
                      <TabsTrigger value="YES" className="flex-1">YES ${selectedMarketData.yesPrice}</TabsTrigger>
                      <TabsTrigger value="NO" className="flex-1">NO ${selectedMarketData.noPrice}</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (USDC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Expected Tokens:</span>
                    <span className="font-bold">~119 YES tokens</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Protocol Fee (0.1%):</span>
                    <span>{(parseFloat(amount) * 0.001).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total Cost:</span>
                    <span>{(parseFloat(amount) * 1.001).toFixed(2)} USDC</span>
                  </div>
                </div>

                <Button onClick={executeCrossChain} className="w-full" size="lg">
                  Place Bet
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Steps 3-4: Cross-Chain Flow */}
        {step >= 3 && step <= 4 && (
          <motion.div
            key="step3-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle>Cross-Chain Execution</CardTitle>
                <CardDescription>Following your bet across chains...</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Optimism Hub */}
                <div className={`p-4 rounded-lg border-2 ${flowStep >= 3 ? 'border-success bg-success/10' : 'border-muted bg-muted'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge>Optimism Hub</Badge>
                    {flowStep >= 3 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : flowStep >= 0 && flowStep < 3 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {flowStep >= 1 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Intent signed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 2 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Funds reserved in escrow (50 USDC)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 3 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Sending cross-chain message</span>
                    </div>
                  </div>
                  {optimismTxHash && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground">TX:</span>
                      <span>{optimismTxHash.slice(0, 10)}...{optimismTxHash.slice(-8)}</span>
                      <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                        <a href={`https://sepolia-optimism.etherscan.io/tx/${optimismTxHash}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bridge Animation */}
                {flowStep >= 3 && flowStep < 6 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center"
                  >
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-2" />
                      <div className="text-sm text-muted-foreground">ViaLabs Bridge</div>
                    </div>
                  </motion.div>
                )}

                {/* Base Venue */}
                <div className={`p-4 rounded-lg border-2 ${flowStep >= 9 ? 'border-success bg-success/10' : flowStep >= 4 ? 'border-secondary bg-secondary/10' : 'border-muted bg-muted'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary">Base Venue</Badge>
                    {flowStep >= 9 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : flowStep >= 4 && flowStep < 9 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-secondary" />
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {flowStep >= 4 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Message received</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 5 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>BetManager processing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 6 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Executing on Polymarket via CLOB API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 7 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>119 YES tokens received</span>
                    </div>
                  </div>
                  {baseTxHash && (
                    <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs font-mono">
                      <span className="text-muted-foreground">TX:</span>
                      <span>{baseTxHash.slice(0, 10)}...{baseTxHash.slice(-8)}</span>
                      <Button variant="ghost" size="sm" asChild className="h-6 w-6 p-0">
                        <a href={`https://sepolia.basescan.org/tx/${baseTxHash}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Settlement */}
                <div className={`p-4 rounded-lg border-2 ${flowStep >= 12 ? 'border-success bg-success/10' : 'border-muted bg-muted'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge>Settlement</Badge>
                    {flowStep >= 12 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : flowStep >= 9 && flowStep < 12 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : null}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {flowStep >= 10 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Attestation verified</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 11 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Escrow released</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {flowStep >= 12 ? <CheckCircle2 className="w-4 h-4 text-success" /> : <div className="w-4 h-4 rounded-full border-2" />}
                      <span>Position minted to user</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 5: Position Display */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <Card className="border-success/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Cross-Chain Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Venue</div>
                    <div className="text-lg font-bold">{selectedMarketData?.venue}</div>
                    <Badge variant="outline" className="mt-1">{selectedMarketData?.chain}</Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="text-2xl font-bold text-success">{yesTokens} YES</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cost Basis</div>
                    <div className="text-lg font-bold">${amount} USDC</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Value</div>
                    <div className="text-lg font-bold text-success">$55 USDC (+10%)</div>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-semibold mb-2">LP Vault Stats</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">TVL:</div>
                    <div className="font-medium">$2.4M</div>
                    <div className="text-muted-foreground">APY:</div>
                    <div className="font-medium text-success">18.5%</div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={reset} className="flex-1">Start New Demo</Button>
                    <Button onClick={onBack} variant="outline">Back to Home</Button>
                  </div>
                  <ShareResult 
                    roi={((55 - parseFloat(amount)) / parseFloat(amount)) * 100}
                    profit={55 - parseFloat(amount)}
                    model="Aggregator"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
