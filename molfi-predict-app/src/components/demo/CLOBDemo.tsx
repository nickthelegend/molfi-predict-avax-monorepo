import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Loader2, TrendingUp, ExternalLink, Wallet } from "lucide-react";
import { toast } from "sonner";
import { OrderBookDisplay } from "./OrderBookDisplay";
import { WalletBalance } from "./WalletBalance";
import Confetti from "react-confetti";
import { Order } from "@/types/demo";
import { ShareResult } from "./ShareResult";
import { useEIP712Signature } from "@/hooks/useEIP712Signature";
import { useWallet } from "@/hooks/useWallet";
import { submitOrder } from "@/services/orders-api";

interface CLOBDemoProps {
  onBack: () => void;
}

export function CLOBDemo({ onBack }: CLOBDemoProps) {
  const [step, setStep] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [orderSide, setOrderSide] = useState<"YES" | "NO">("YES");
  const [price, setPrice] = useState("0.65");
  const [quantity, setQuantity] = useState("100");
  const [usdcBalance, setUsdcBalance] = useState(1000);
  const [yesTokens, setYesTokens] = useState(0);
  const [txHash, setTxHash] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [settlementProgress, setSettlementProgress] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0.67);
  const [buyOrdersState, setBuyOrdersState] = useState<Order[]>([]);
  const [sellOrdersState, setSellOrdersState] = useState<Order[]>([]);
  const [orderbookOutcome, setOrderbookOutcome] = useState<"YES" | "NO">("YES");
  const [nonceCounter, setNonceCounter] = useState(1);

  // EIP-712 signing hooks
  const { signOrder, createOrder, isSigningOrder } = useEIP712Signature();
  const { address, isConnected, connect } = useWallet();

  const markets = [
    {
      id: "btc-100k",
      title: "Will BTC reach $100k by Dec 31, 2026?",
      yesOdds: 65,
      noOdds: 35,
      liquidity: 125000,
      volume24h: 45230,
      resolutionDate: "Dec 31, 2026",
      oracle: "Stork.network",
    },
    {
      id: "eth-5k",
      title: "Will ETH reach $5000 by Feb 2026?",
      yesOdds: 42,
      noOdds: 58,
      liquidity: 85000,
      volume24h: 32100,
      resolutionDate: "Feb 1, 2026",
      oracle: "Stork.network",
    },
  ];

  // Initialize orderbook with base data
  useEffect(() => {
    const initialBuyOrders: Order[] = [
      { price: 0.67, size: 150, total: 100.5 },
      { price: 0.66, size: 300, total: 198.0 },
      { price: 0.65, size: 450, total: 292.5 },
      { price: 0.64, size: 200, total: 128.0 },
      { price: 0.63, size: 350, total: 220.5 },
      { price: 0.62, size: 180, total: 111.6 },
      { price: 0.61, size: 220, total: 134.2 },
      { price: 0.60, size: 400, total: 240.0 },
    ];

    const initialSellOrders: Order[] = [
      { price: 0.68, size: 200, total: 136.0 },
      { price: 0.69, size: 180, total: 124.2 },
      { price: 0.70, size: 250, total: 175.0 },
      { price: 0.71, size: 150, total: 106.5 },
      { price: 0.72, size: 280, total: 201.6 },
      { price: 0.73, size: 190, total: 138.7 },
      { price: 0.74, size: 160, total: 118.4 },
      { price: 0.75, size: 300, total: 225.0 },
    ];

    setBuyOrdersState(initialBuyOrders);
    setSellOrdersState(initialSellOrders);
  }, []);

  // Real-time price fluctuations - faster and more noticeable
  useEffect(() => {
    if (step < 2 || step > 6) {
      console.log('Price update skipped - step:', step);
      return;
    }

    console.log('Starting price updates...');
    const priceInterval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 0.04; // ±2% change for more visibility
        const newPrice = Math.max(0.55, Math.min(0.75, prev + change));
        const rounded = Math.round(newPrice * 100) / 100;
        console.log('Price updated:', prev, '->', rounded);
        return rounded;
      });
    }, 800); // Update every 800ms

    return () => {
      console.log('Stopping price updates');
      clearInterval(priceInterval);
    };
  }, [step]);

  // Animate orderbook updates - much faster and more dynamic
  useEffect(() => {
    if (step !== 2) {
      console.log('Orderbook update skipped - step:', step);
      return;
    }

    console.log('Starting orderbook updates...');
    const orderbookInterval = setInterval(() => {
      console.log('Updating orderbook...');
      // Update multiple orders for more activity
      setBuyOrdersState(prev => {
        const newOrders = [...prev];
        // Update 2-3 random orders
        const numUpdates = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * newOrders.length);
          const sizeChange = Math.floor((Math.random() - 0.5) * 150);
          const newSize = Math.max(100, newOrders[randomIndex].size + sizeChange);
          newOrders[randomIndex] = {
            ...newOrders[randomIndex],
            size: newSize,
            total: Math.round(newOrders[randomIndex].price * newSize * 100) / 100
          };
        }
        return newOrders;
      });

      // Update sell orders
      setSellOrdersState(prev => {
        const newOrders = [...prev];
        const numUpdates = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < numUpdates; i++) {
          const randomIndex = Math.floor(Math.random() * newOrders.length);
          const sizeChange = Math.floor((Math.random() - 0.5) * 150);
          const newSize = Math.max(100, newOrders[randomIndex].size + sizeChange);
          newOrders[randomIndex] = {
            ...newOrders[randomIndex],
            size: newSize,
            total: Math.round(newOrders[randomIndex].price * newSize * 100) / 100
          };
        }
        return newOrders;
      });
    }, 500); // Update every 500ms for faster, more realistic orderbook

    return () => {
      console.log('Stopping orderbook updates');
      clearInterval(orderbookInterval);
    };
  }, [step]);

  // Calculate real-time PnL
  const calculatePnL = () => {
    if (yesTokens === 0) return { pnl: 0, pnlPercent: 0 };
    const entryPrice = parseFloat(price);
    const pnl = yesTokens * (currentPrice - entryPrice);
    const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100;
    return { pnl, pnlPercent };
  };

  const { pnl, pnlPercent } = calculatePnL();

  const generateTxHash = () => {
    return "0x" + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
  };

  const executeOrder = async () => {
    // Check wallet connection
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      connect();
      return;
    }

    setIsExecuting(true);
    setStep(3);

    try {
      // Step 3: Off-chain signing with EIP-712
      toast.info("Please sign the order in your wallet...");
      
      const order = createOrder({
        marketId: selectedMarket || "btc-100k",
        outcome: orderSide,
        price: parseFloat(price),
        size: parseInt(quantity),
        nonce: nonceCounter,
        expiryMinutes: 60,
      });

      const signedOrder = await signOrder(order);
      
      if (!signedOrder) {
        toast.error("Order signing failed");
        setIsExecuting(false);
        setStep(2);
        return;
      }

      setNonceCounter(prev => prev + 1);
      toast.success("Order signed successfully!");
      setStep(4);

      // Step 4: Submit order to backend
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.info("Submitting order to orderbook...");
      
      try {
        await submitOrder(signedOrder);
        toast.success("Order submitted to orderbook!");
      } catch (error: any) {
        console.error("Failed to submit order:", error);
        toast.error("Failed to submit order to backend");
        // Continue with demo flow anyway
      }
      
      setStep(5);

      // Step 5: Settlement (simulated for demo)
      const steps = [
        "Matching order with counterparties...",
        "Verifying signatures...",
        "Reserving funds from escrow...",
        "Executing batch settlement...",
        "Minting YES/NO tokens...",
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setSettlementProgress((i + 1) * 20);
        toast.info(steps[i]);
      }

      const hash = generateTxHash();
      setTxHash(hash);
      const orderQuantity = parseInt(quantity);
      const orderPrice = parseFloat(price);
      setUsdcBalance(prev => prev - (orderQuantity * orderPrice));
      setYesTokens(prev => prev + orderQuantity);
      
      toast.success("Settlement complete!");
      setIsExecuting(false);
      setStep(6);
    } catch (error: any) {
      console.error("Error executing order:", error);
      toast.error("Order execution failed");
      setIsExecuting(false);
      setStep(2);
    }
  };

  const resolveMarket = async () => {
    setIsExecuting(true);
    setStep(7);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.info("Fetching BTC price from Stork.network...");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("BTC Price: $105,450 - Market resolved: YES wins! 🎉");
    
    const winnings = yesTokens - 2; // Protocol fee
    setUsdcBalance(prev => prev + winnings);
    setYesTokens(0);
    
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
    
    setIsExecuting(false);
  };

  const reset = () => {
    setStep(1);
    setSelectedMarket(null);
    setUsdcBalance(1000);
    setYesTokens(0);
    setTxHash("");
    setSettlementProgress(0);
  };

  return (
    <div className="space-y-6">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <div className="flex items-center justify-between">
        <div>
          <Button onClick={onBack} variant="ghost">← Back to Home</Button>
          <h2 className="text-3xl font-bold mt-2">Native CLOB Demo</h2>
          <p className="text-muted-foreground">Step {step} of 7</p>
        </div>
        <WalletBalance usdcBalance={usdcBalance} yesTokens={yesTokens} />
      </div>

      <Progress value={(step / 7) * 100} className="h-2" />

      <AnimatePresence mode="wait">
        {/* Step 1: Market Selection */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-xl font-semibold">Select a Market</h3>
            {markets.map((market) => (
              <Card
                key={market.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => {
                  setSelectedMarket(market.id);
                  setStep(2);
                }}
              >
                <CardHeader>
                  <CardTitle>{market.title}</CardTitle>
                  <CardDescription>
                    Resolution: {market.resolutionDate} • Oracle: {market.oracle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">YES Odds</div>
                      <div className="text-lg font-bold text-success">{market.yesOdds}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">NO Odds</div>
                      <div className="text-lg font-bold text-destructive">{market.noOdds}%</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Liquidity</div>
                      <div className="text-lg font-bold">${(market.liquidity / 1000).toFixed(0)}k</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">24h Volume</div>
                      <div className="text-lg font-bold">${(market.volume24h / 1000).toFixed(1)}k</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Step 2: Trading Interface */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <OrderBookDisplay 
              buyOrders={buyOrdersState} 
              sellOrders={sellOrdersState} 
              currentPrice={currentPrice}
              outcome={orderbookOutcome}
              onOutcomeChange={setOrderbookOutcome}
            />

            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
                {!isConnected && (
                  <CardDescription className="text-warning flex items-center gap-2 mt-2">
                    <Wallet className="w-4 h-4" />
                    Connect wallet to sign orders with EIP-712
                  </CardDescription>
                )}
                {isConnected && address && (
                  <CardDescription className="text-success flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {!isConnected && (
                  <div className="p-6 border-2 border-dashed border-muted rounded-lg text-center space-y-4">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold mb-2">Connect Wallet Required</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sign orders securely using EIP-712 signatures
                      </p>
                      <Button onClick={connect} size="lg" className="w-full">
                        Connect Wallet
                      </Button>
                    </div>
                  </div>
                )}

                {isConnected && (
                  <>
                    <div>
                      <Label>Side</Label>
                      <Tabs value={orderSide} onValueChange={(v) => setOrderSide(v as "YES" | "NO")}>
                        <TabsList className="w-full">
                          <TabsTrigger value="YES" className="flex-1">Buy YES</TabsTrigger>
                          <TabsTrigger value="NO" className="flex-1">Buy NO</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div>
                      <Label htmlFor="price">Price (USDC)</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${(parseFloat(price) * parseInt(quantity)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Trading Fee:</span>
                        <span>0 USDC (No fees on trades)</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span>${(parseFloat(price) * parseInt(quantity)).toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        Nonce: {nonceCounter} • Expires in 60 minutes
                      </div>
                    </div>

                    <Button 
                      onClick={executeOrder} 
                      className="w-full" 
                      size="lg"
                      disabled={isSigningOrder || isExecuting}
                    >
                      {isSigningOrder || isExecuting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {isSigningOrder ? "Signing..." : "Processing..."}
                        </>
                      ) : (
                        "Sign & Submit Order"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Steps 3-5: Execution Flow */}
        {step >= 3 && step <= 5 && (
          <motion.div
            key="step3-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Execution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step 3: Signing */}
                <div className={`p-4 rounded-lg ${step >= 3 ? 'bg-success/10 border border-success/20' : 'bg-muted'}`}>
                  <div className="flex items-center gap-3">
                    {step > 3 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">Off-Chain Order Signing</div>
                      <div className="text-sm text-muted-foreground">EIP-712 signature - No gas cost!</div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Matching */}
                <div className={`p-4 rounded-lg ${step >= 4 ? 'bg-success/10 border border-success/20' : 'bg-muted'}`}>
                  <div className="flex items-center gap-3">
                    {step > 4 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : step === 4 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">Order Matching</div>
                      <div className="text-sm text-muted-foreground">Batching with 4 other orders</div>
                    </div>
                  </div>
                </div>

                {/* Step 5: Settlement */}
                <div className={`p-4 rounded-lg ${step >= 5 ? 'bg-success/10 border border-success/20' : 'bg-muted'}`}>
                  <div className="flex items-center gap-3">
                    {step > 5 ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : step === 5 ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">Batch Settlement</div>
                      <div className="text-sm text-muted-foreground">Executing on-chain</div>
                      {step === 5 && <Progress value={settlementProgress} className="mt-2" />}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 6: Position Display */}
        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {txHash && (
              <Card className="border-success/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="font-mono">{txHash.slice(0, 20)}...{txHash.slice(-18)}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-success" />
                  Your Position
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Position</div>
                    <div className="text-2xl font-bold text-success">{yesTokens} YES</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Entry Price</div>
                    <div className="text-2xl font-bold">${price}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Current Price</div>
                    <motion.div 
                      key={currentPrice}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className="text-2xl font-bold"
                    >
                      ${currentPrice.toFixed(2)}
                    </motion.div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Unrealized P&L</div>
                    <motion.div 
                      key={pnl}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      className={`text-2xl font-bold ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%)
                    </motion.div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={resolveMarket} className="flex-1" disabled={isExecuting}>
                    {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fast-forward to Resolution"}
                  </Button>
                  <Button onClick={reset} variant="outline">Reset Demo</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 7: Market Resolution */}
        {step === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6"
          >
            <Card className="border-success/20">
              <CardHeader>
                <CardTitle className="text-4xl">🎉 You Won!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  BTC Price: <span className="text-success">$105,450</span>
                </div>
                <div className="text-lg text-muted-foreground">Market resolved: YES wins!</div>

                <div className="p-6 bg-success/10 rounded-lg space-y-2">
                  <div className="flex justify-between text-lg">
                    <span>{yesTokens} YES tokens →</span>
                    <span className="font-bold">{yesTokens} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Market Resolve Fee (2%):</span>
                    <span>{(yesTokens * 0.02).toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-success">
                    <span>You Receive:</span>
                    <span>{(yesTokens * 0.98).toFixed(2)} USDC</span>
                  </div>
                  <div className="text-2xl font-bold text-success pt-2">
                    ROI: +{(((yesTokens * 0.98) / (parseFloat(price) * yesTokens) - 1) * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={reset} className="flex-1" size="lg">Start New Demo</Button>
                    <Button onClick={onBack} variant="outline" size="lg">Back to Home</Button>
                  </div>
                  <ShareResult 
                    roi={((yesTokens * 0.98) / (parseFloat(price) * yesTokens) - 1) * 100}
                    profit={(yesTokens * 0.98) - (parseFloat(price) * yesTokens)}
                    model="CLOB"
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
