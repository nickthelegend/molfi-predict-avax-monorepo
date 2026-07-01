import { useState, useMemo } from 'react';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useMarketPrice } from '@/hooks/useGmxMarkets';
import { useCreateOrder, useOrderEstimate } from '@/hooks/useGmxOrders';
import { useGmxSdk } from '@/hooks/useGmxSdk';
import { GMX_CONFIG, getMarketByAddress } from '@/config/gmx';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Zap,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderPanelProps {
  selectedMarket: string | null;
}

export function OrderPanel({ selectedMarket }: OrderPanelProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const { checkNetwork, switchToArbitrum } = useGmxSdk();
  const { estimate } = useOrderEstimate();
  const createOrder = useCreateOrder();

  const [side, setSide] = useState<'long' | 'short'>('long');
  const [collateral, setCollateral] = useState('');
  const [leverage, setLeverage] = useState(5);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const { price: currentPrice } = useMarketPrice(selectedMarket);
  const marketConfig = selectedMarket ? getMarketByAddress(selectedMarket) : null;

  const collateralAmount = parseFloat(collateral) || 0;
  const availableBalance = currentArenaWallet?.balance ?? 0;

  const positionEstimate = useMemo(() => {
    if (!selectedMarket || collateralAmount <= 0 || currentPrice <= 0) {
      return null;
    }
    return estimate({
      marketAddress: selectedMarket,
      side,
      collateral: collateralAmount,
      leverage,
      entryPrice: currentPrice,
    });
  }, [selectedMarket, side, collateralAmount, leverage, currentPrice, estimate]);

  const isValidOrder = collateralAmount > 0 && 
    collateralAmount <= availableBalance && 
    selectedMarket && 
    currentPrice > 0;

  const handleSubmitOrder = async () => {
    if (!isValidOrder || !selectedMarket) return;

    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      toast.info('Switching to Arbitrum...');
      const switched = await switchToArbitrum();
      if (!switched) {
        toast.error('Please switch to Arbitrum manually');
        return;
      }
    }

    createOrder.mutate({
      marketAddress: selectedMarket,
      side,
      collateralAmount: BigInt(Math.floor(collateralAmount * 1e6)),
      leverage,
      orderType,
      limitPrice: orderType === 'limit' ? parseFloat(limitPrice) : undefined,
      slippageBps: GMX_CONFIG.defaultSlippageBps,
    });
  };

  const handleQuickAmount = (percent: number) => {
    setCollateral((availableBalance * percent / 100).toFixed(2));
  };

  return (
    <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 h-10 px-3 border-b border-border flex items-center justify-between bg-muted/20">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Place Order
        </span>
        <Badge variant="outline" className="text-[9px]">
          {marketConfig?.symbol || 'Select Market'}
        </Badge>
      </div>

      {/* Order Form */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setSide('long')}
            className={cn(
              "h-10 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              side === 'long'
                ? "bg-success text-success-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            Long
          </button>
          <button
            onClick={() => setSide('short')}
            className={cn(
              "h-10 rounded-md font-semibold text-sm flex items-center justify-center gap-2 transition-all",
              side === 'short'
                ? "bg-destructive text-destructive-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            Short
          </button>
        </div>

        {/* Order Type */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
          <TabsList className="w-full h-8 p-0.5">
            <TabsTrigger value="market" className="flex-1 text-xs h-full gap-1">
              <Zap className="w-3 h-3" />
              Market
            </TabsTrigger>
            <TabsTrigger value="limit" className="flex-1 text-xs h-full gap-1">
              <Target className="w-3 h-3" />
              Limit
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Collateral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Collateral (USDC)</Label>
            <span className="text-[10px] text-muted-foreground">
              Avail: <span className="text-foreground font-mono">${availableBalance.toFixed(2)}</span>
            </span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            className="font-mono text-base h-10"
          />
          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handleQuickAmount(pct)}
                className="h-6 text-[10px] bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Limit Price</Label>
            <Input
              type="number"
              placeholder={currentPrice.toString()}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="font-mono h-10"
            />
          </div>
        )}

        {/* Leverage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Leverage</Label>
            <Badge variant="outline" className="font-mono text-xs">
              {leverage}x
            </Badge>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={([v]) => setLeverage(v)}
            min={1}
            max={50}
            step={1}
            className="my-2"
          />
          <div className="flex justify-between">
            {[1, 5, 10, 25, 50].map((preset) => (
              <button
                key={preset}
                onClick={() => setLeverage(preset)}
                className={cn(
                  "px-2 py-0.5 text-[10px] rounded transition-colors",
                  leverage === preset
                    ? "bg-warning/20 text-warning"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>

        {/* Position Preview */}
        {positionEstimate && (
          <div className="p-2 rounded bg-muted/30 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-mono">${positionEstimate.positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liq. Price</span>
              <span className={cn(
                "font-mono",
                side === 'long' ? "text-destructive" : "text-success"
              )}>
                ${positionEstimate.liquidationPrice.toFixed(2)}
              </span>
            </div>
            <div className="pt-1.5 border-t border-border/50 flex justify-between">
              <span className="text-muted-foreground">Fees</span>
              <span className="font-mono text-muted-foreground">
                ~${positionEstimate.fees.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex-shrink-0 p-3 border-t border-border">
        <Button
          className={cn(
            "w-full h-11 font-semibold text-sm",
            side === 'long'
              ? "bg-success hover:bg-success/90"
              : "bg-destructive hover:bg-destructive/90"
          )}
          disabled={!isValidOrder || createOrder.isPending}
          onClick={handleSubmitOrder}
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              {side === 'long' ? (
                <TrendingUp className="w-4 h-4 mr-2" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2" />
              )}
              {side === 'long' ? 'Long' : 'Short'} {marketConfig?.symbol || 'Market'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
