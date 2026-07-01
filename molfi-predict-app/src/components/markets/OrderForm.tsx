import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Wallet, TrendingUp, AlertCircle, ShieldAlert, Zap } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useWallet } from "@/hooks/useWallet";
import type { WalletBalance } from "@/types/wallet";
import { toast } from "sonner";
import { OrderConfirmModal } from "./OrderConfirmModal";
import { StopLossTakeProfit } from "./StopLossTakeProfit";
import { SessionTradeHistory, type TradeEntry } from "./SessionTradeHistory";
import { useTradingStore } from "@/hooks/useTradingStore";
import { localBackend } from "@/services/local-backend";
import { useMolfiWallet } from "@/contexts/MolfiWalletContext";

const MIN_ORDER = 3;
const LEVERAGE_OPTIONS = [1, 2, 3, 5] as const;

interface OrderFormProps {
  asset: string;
  yesProb: number;
  /** Canonical market ID in the backend (e.g. "btc-hourly", "eth-daily") */
  marketId?: string;
  onSideChange?: (side: "yes" | "no") => void;
  externalLimitPrice?: number | null;
  /** Whether this market supports leverage (daily markets) */
  isLeverage?: boolean;
}

export function OrderForm({ asset, yesProb, marketId, onSideChange, externalLimitPrice, isLeverage = false }: OrderFormProps) {
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("10");
  const [limitPrice, setLimitPrice] = useState("");
  const [leverage, setLeverage] = useState(1);
  const [slippage] = useState(0.5);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fastOrder, setFastOrder] = useState(false);
  const [slTp, setSlTp] = useState({ stopLoss: "", takeProfit: "" });
  const [sessionTrades, setSessionTrades] = useState<TradeEntry[]>([]);
  const [balance, setBalance] = useState<WalletBalance | null>(null);

  const { isConnected } = useWallet();
  const { openPosition } = useTradingStore();
  const { connectedWallet } = useMolfiWallet();
  const walletAddress = connectedWallet?.address ?? null;

  // Load balance — prefer real backend balance if wallet connected
  const loadBalance = useCallback(async () => {
    try {
      if (walletAddress) {
        const data = await localBackend.getBalance(walletAddress);
        setBalance({
          available: Number(data.available),
          locked: Number(data.locked),
          total: Number(data.total),
        } as WalletBalance);
      }
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadBalance();
    const interval = setInterval(loadBalance, 5000);
    return () => clearInterval(interval);
  }, [loadBalance]);

  // When a price is clicked in the order book, switch to limit and fill
  useEffect(() => {
    if (externalLimitPrice != null) {
      setLimitPrice(externalLimitPrice.toFixed(1));
      setOrderType("limit");
    }
  }, [externalLimitPrice]);

  // Reset leverage when switching to non-leverage market
  useEffect(() => {
    if (!isLeverage) setLeverage(1);
  }, [isLeverage]);

  const noProb = 100 - yesProb;
  const currentPrice = side === "yes" ? yesProb : noProb;
  const effectivePrice = orderType === "limit" && limitPrice ? Number(limitPrice) : currentPrice;
  const numAmount = Number(amount) || 0;
  const effectiveAmount = numAmount * leverage;
  const estimatedShares = effectivePrice > 0 ? effectiveAmount / (effectivePrice / 100) : 0;
  const possibleWin = isFinite(estimatedShares) ? Math.max(0, estimatedShares - numAmount) : 0;

  // Liquidation price: margin = numAmount, position size = effectiveAmount
  // Liquidated when loss = margin → price moves (1/leverage)*100 against entry
  const liquidationPrice = useMemo(() => {
    if (leverage <= 1) return null;
    const movePercent = (1 / leverage) * effectivePrice;
    // If buying YES, liq is below entry; if NO, liq is above entry
    const liq = side === "yes" ? effectivePrice - movePercent : effectivePrice + movePercent;
    return Math.max(0, Math.min(100, liq));
  }, [leverage, effectivePrice, side]);

  const amountError = useMemo(() => {
    if (numAmount > 0 && numAmount < MIN_ORDER) return `Minimum order is $${MIN_ORDER}`;
    if (balance && numAmount > balance.available) return "Insufficient balance";
    return null;
  }, [numAmount, balance]);

  const handleSideChange = (s: "yes" | "no") => {
    setSide(s);
    onSideChange?.(s);
  };

  const executeOrder = useCallback(async () => {
    const marginAmount = numAmount;
    const sideUpper = side.toUpperCase() as 'YES' | 'NO';

    // ── Real backend call (when market ID + wallet address available) ────────
    if (marketId && walletAddress) {
      try {
        await localBackend.openPosition({
          walletAddress: walletAddress,
          marketId,
          side: sideUpper,
          amount: marginAmount,
        });
        await loadBalance();
      } catch (err: any) {
        toast.error(err.message || 'Trade failed');
        return;
      }
    }

    const timeframe = isLeverage ? 'daily' : 'hourly';
    const marketLabel = `${asset} ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`;
    const shares = effectivePrice > 0 ? effectiveAmount / (effectivePrice / 100) : 0;

    // Also update the local position store (notifications + UI)
    openPosition({
      id: crypto.randomUUID(),
      asset,
      timeframe,
      market: marketLabel,
      side: sideUpper,
      size: marginAmount,
      shares,
      entryPrice: effectivePrice,
      leverage,
      openedAt: Date.now(),
    });

    const entry: TradeEntry = {
      id: crypto.randomUUID(),
      asset,
      side,
      orderType,
      amount: marginAmount,
      leverage,
      price: effectivePrice,
      timestamp: Date.now(),
      stopLoss: slTp.stopLoss || undefined,
      takeProfit: slTp.takeProfit || undefined,
    };
    setSessionTrades((prev) => [entry, ...prev]);
    const slTpLabel = leverage > 1 && (slTp.stopLoss || slTp.takeProfit)
      ? ` · SL:${slTp.stopLoss || "—"} TP:${slTp.takeProfit || "—"}`
      : "";
    toast.success(`${orderType === "market" ? "Market" : "Limit"} order filled: ${shares.toFixed(1)} ${sideUpper} shares at ${effectivePrice.toFixed(1)}¢ for $${marginAmount.toFixed(2)} USDC${leverage > 1 ? ` (${leverage}x)` : ""}${slTpLabel}`);
  }, [asset, side, orderType, numAmount, leverage, effectivePrice, effectiveAmount, slTp, loadBalance, isLeverage, openPosition, marketId, walletAddress]);

  const handlePlaceOrder = () => {
    if (numAmount < MIN_ORDER) {
      toast.error(`Minimum order amount is $${MIN_ORDER}`);
      return;
    }
    if (!isConnected) {
      toast.error("Connect your wallet to place orders");
      return;
    }
    if (balance && numAmount > balance.available) {
      toast.error(`Insufficient balance. Available: $${balance.available.toFixed(2)}`);
      return;
    }
    if (fastOrder) {
      executeOrder();
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirmOrder = () => {
    setShowConfirm(false);
    executeOrder();
  };

  return (
    <div className="p-3 space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</span>

      {/* Balance display */}
      <div className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Wallet className="w-3 h-3" />
          <span>Balance</span>
        </div>
        <span className="text-xs font-bold tabular-nums">
          {isConnected
            ? balance
              ? `$${balance.available.toFixed(2)}`
              : "Loading..."
            : "—"}
        </span>
      </div>

      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
        <TabsList className="w-full h-7">
          <TabsTrigger value="market" className="flex-1 text-[10px] h-6">Market</TabsTrigger>
          <TabsTrigger value="limit" className="flex-1 text-[10px] h-6">Limit</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-1">
        <Button
          size="sm"
          variant={side === "yes" ? "default" : "outline"}
          className={cn("h-7 text-xs", side === "yes" && "bg-emerald-500 hover:bg-emerald-600 text-white")}
          onClick={() => handleSideChange("yes")}
        >
          Buy Yes {yesProb.toFixed(0)}¢
        </Button>
        <Button
          size="sm"
          variant={side === "no" ? "default" : "outline"}
          className={cn("h-7 text-xs", side === "no" && "bg-red-500 hover:bg-red-600 text-white")}
          onClick={() => handleSideChange("no")}
        >
          Buy No {noProb.toFixed(0)}¢
        </Button>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">Amount (USDC)</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={cn("h-8 text-sm", amountError && "border-destructive")}
          placeholder="0.00"
          min={MIN_ORDER}
        />
        {amountError && (
          <p className="text-[9px] text-destructive flex items-center gap-1">
            <AlertCircle className="w-2.5 h-2.5" />
            {amountError}
          </p>
        )}
        <div className="flex gap-1">
          {[5, 10, 25, 50].map((v) => (
            <Button key={v} variant="outline" size="sm" className="h-5 text-[9px] flex-1 px-0" onClick={() => setAmount(String(v))}>
              ${v}
            </Button>
          ))}
        </div>
      </div>

      {/* Leverage selector — only for daily markets */}
      {isLeverage && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Leverage
            </Label>
            <span className="text-xs font-bold text-primary">{leverage}x</span>
          </div>
          <div className="flex gap-1">
            {LEVERAGE_OPTIONS.map((lev) => (
              <Button
                key={lev}
                variant={leverage === lev ? "default" : "outline"}
                size="sm"
                className={cn("h-6 text-[10px] flex-1 px-0", leverage === lev && "bg-primary text-primary-foreground")}
                onClick={() => setLeverage(lev)}
              >
                {lev}x
              </Button>
            ))}
          </div>
          <Slider
            value={[leverage]}
            onValueChange={([v]) => setLeverage(v)}
            min={1}
            max={5}
            step={1}
            className="py-1"
          />
          {leverage > 1 && (
            <p className="text-[9px] text-warning flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" />
              {leverage}x leverage increases both potential gains and losses
            </p>
          )}
        </div>
      )}

      {/* SL/TP — always visible */}
      <StopLossTakeProfit
        entryPrice={effectivePrice}
        leverage={leverage}
        side={side}
        liquidationPrice={liquidationPrice}
        onValuesChange={setSlTp}
      />

      {/* Fixed-height slot for limit price */}
      <div className={cn("space-y-1", orderType !== "limit" && "hidden")}>
        <Label className="text-[10px] text-muted-foreground">Limit Price (¢)</Label>
        <Input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className="h-8 text-sm" placeholder={currentPrice.toFixed(1)} />
      </div>

      {/* Order summary */}
      <div className="rounded-md bg-muted/50 p-2 space-y-1 text-[10px]">
        {orderType === "limit" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Limit Price</span>
            <span className="font-medium tabular-nums">{limitPrice || currentPrice.toFixed(1)}¢</span>
          </div>
        )}
        {leverage > 1 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Effective Size</span>
            <span className="font-medium tabular-nums">${effectiveAmount.toFixed(2)}</span>
          </div>
        )}
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
        <div className="flex justify-between border-t border-border pt-1 mt-1">
          <span className="text-muted-foreground font-semibold">Est. Profit</span>
          <span className="font-bold tabular-nums text-emerald-500">
            {possibleWin > 0 ? `+$${possibleWin.toFixed(2)}` : "—"}
          </span>
        </div>
        {liquidationPrice !== null && (
          <div className="flex justify-between">
            <span className="text-destructive flex items-center gap-1 font-semibold">
              <ShieldAlert className="w-2.5 h-2.5" /> Liq. Price
            </span>
            <span className="font-bold tabular-nums text-destructive">{liquidationPrice.toFixed(1)}¢</span>
          </div>
        )}
      </div>

      {/* Fast order toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={fastOrder} onCheckedChange={(v) => setFastOrder(v === true)} className="h-3.5 w-3.5" />
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" /> Fast order (skip confirmation)
        </span>
      </label>

      <Button
        className={cn(
          "w-full h-9 text-xs font-bold",
          side === "yes" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"
        )}
        onClick={handlePlaceOrder}
        disabled={!!amountError || numAmount <= 0}
      >
        {orderType === "market" ? "Place Market Order" : "Place Limit Order"}
      </Button>

      <p className="text-[9px] text-muted-foreground text-center">
        Slippage tolerance: {slippage}% · Min order: ${MIN_ORDER}
      </p>

      <OrderConfirmModal
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleConfirmOrder}
        side={side}
        orderType={orderType}
        amount={numAmount}
        leverage={leverage}
        effectiveAmount={effectiveAmount}
        effectivePrice={effectivePrice}
        estimatedShares={estimatedShares}
        possibleWin={possibleWin}
        liquidationPrice={liquidationPrice}
        asset={asset}
      />

      <SessionTradeHistory trades={sessionTrades} />
    </div>
  );
}
