import { useState, useMemo } from 'react';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useGmxMarket, useMarketPrice } from '@/hooks/useGmxMarkets';
import { useCreateOrder, useOrderEstimate } from '@/hooks/useGmxOrders';
import { useGmxSdk } from '@/hooks/useGmxSdk';
import { GMX_CONFIG, getMarketByAddress } from '@/config/gmx';
import { MarketsOverview } from './MarketsOverview';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface TradingInterfaceProps {
  defaultMarket?: string;
}

export function TradingInterface({ defaultMarket }: TradingInterfaceProps) {
  const { currentArenaWallet, connectedWallet } = useMolfiWallet();
  const { checkNetwork, switchToArbitrum } = useGmxSdk();
  const { estimate } = useOrderEstimate();
  const createOrder = useCreateOrder();

  // Trading state
  const [selectedMarket, setSelectedMarket] = useState<string | null>(
    defaultMarket || GMX_CONFIG.markets.BTC_USD.address
  );
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [collateral, setCollateral] = useState('');
  const [leverage, setLeverage] = useState(2);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [showMarkets, setShowMarkets] = useState(false);

  // Market data
  const { data: market } = useGmxMarket(selectedMarket);
  const { price: currentPrice } = useMarketPrice(selectedMarket);
  const marketConfig = selectedMarket ? getMarketByAddress(selectedMarket) : null;

  // Calculate position estimate
  const collateralAmount = parseFloat(collateral) || 0;
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

  // Validation
  const availableBalance = currentArenaWallet?.balance ?? 0;
  const isValidCollateral = collateralAmount > 0 && collateralAmount <= availableBalance;
  const isValidOrder = isValidCollateral && selectedMarket && currentPrice > 0;

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!isValidOrder || !selectedMarket) {
      return;
    }

    // Check network
    const isCorrectNetwork = await checkNetwork();
    if (!isCorrectNetwork) {
      toast.info('Switching to Arbitrum...');
      const switched = await switchToArbitrum();
      if (!switched) {
        toast.error('Please switch to Arbitrum manually');
        return;
      }
    }

    // Create order
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

  if (!currentArenaWallet) {
    return (
      <Card className="p-6 border border-border text-center">
        <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          No arena wallet selected. Join a competition to start trading.
        </p>
      </Card>
    );
  }

  if (currentArenaWallet.isForfeited) {
    return (
      <Card className="p-6 border border-border text-center">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          This arena wallet has been forfeited. You cannot place new trades.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Selector */}
      <Card className="border border-border overflow-hidden">
        <button
          onClick={() => setShowMarkets(!showMarkets)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            {marketConfig && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold">{marketConfig.symbol.split('/')[0]}</span>
              </div>
            )}
            <div className="text-left">
              <p className="font-semibold">{marketConfig?.symbol || 'Select Market'}</p>
              {currentPrice > 0 && (
                <p className="text-sm text-muted-foreground font-mono">
                  ${currentPrice.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          {showMarkets ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {showMarkets && (
          <div className="p-4 border-t border-border">
            <MarketsOverview
              selectedMarket={selectedMarket}
              onSelectMarket={(addr) => {
                setSelectedMarket(addr);
                setShowMarkets(false);
              }}
              compact
            />
          </div>
        )}
      </Card>

      {/* Trading Form */}
      <Card className="p-4 border border-border space-y-4">
        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === 'long' ? 'default' : 'outline'}
            onClick={() => setSide('long')}
            className={cn(
              'h-12',
              side === 'long' && 'bg-green-500 hover:bg-green-600 text-white'
            )}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Long
          </Button>
          <Button
            variant={side === 'short' ? 'default' : 'outline'}
            onClick={() => setSide('short')}
            className={cn(
              'h-12',
              side === 'short' && 'bg-destructive hover:bg-destructive/90 text-white'
            )}
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            Short
          </Button>
        </div>

        {/* Order Type */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
          <TabsList className="w-full">
            <TabsTrigger value="market" className="flex-1">Market</TabsTrigger>
            <TabsTrigger value="limit" className="flex-1">Limit</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Collateral Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Collateral (USDC)</Label>
            <button
              onClick={() => setCollateral(availableBalance.toString())}
              className="text-xs text-warning hover:underline"
            >
              Max: ${availableBalance.toFixed(2)}
            </button>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={collateral}
            onChange={(e) => setCollateral(e.target.value)}
            className="font-mono text-lg"
            min={GMX_CONFIG.execution.minCollateralUsd}
            max={availableBalance}
          />
          {collateralAmount > availableBalance && (
            <p className="text-xs text-destructive">Insufficient balance</p>
          )}
        </div>

        {/* Limit Price (for limit orders) */}
        {orderType === 'limit' && (
          <div className="space-y-2">
            <Label>Limit Price</Label>
            <Input
              type="number"
              placeholder={currentPrice.toString()}
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="font-mono"
            />
          </div>
        )}

        {/* Leverage Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Leverage</Label>
            <Badge variant="outline" className="font-mono">
              {leverage}x
            </Badge>
          </div>
          <Slider
            value={[leverage]}
            onValueChange={([v]) => setLeverage(v)}
            min={GMX_CONFIG.leverage.min}
            max={GMX_CONFIG.leverage.max}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            {GMX_CONFIG.leverage.presets.map((preset) => (
              <button
                key={preset}
                onClick={() => setLeverage(preset)}
                className={cn(
                  'px-2 py-1 rounded transition-colors',
                  leverage === preset
                    ? 'bg-muted text-foreground'
                    : 'hover:bg-muted/50'
                )}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>

        {/* Position Preview */}
        {positionEstimate && (
          <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position Size</span>
              <span className="font-mono">${positionEstimate.positionSize.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entry Price</span>
              <span className="font-mono">${currentPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liquidation Price</span>
              <span className={cn(
                'font-mono',
                side === 'long' ? 'text-destructive' : 'text-green-400'
              )}>
                ${positionEstimate.liquidationPrice.toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-border/50">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees</span>
                <span className="font-mono">${positionEstimate.fees.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className={cn(
            'w-full h-12',
            side === 'long'
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-destructive hover:bg-destructive/90'
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
              {side === 'long' ? 'Open Long' : 'Open Short'} {marketConfig?.symbol}
            </>
          )}
        </Button>
      </Card>
    </div>
  );
}
