import { useState, useMemo } from 'react';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useMarketPrice } from '@/hooks/useGmxMarkets';
import { useOrderEstimate } from '@/hooks/useGmxOrders';
import { GMX_CONFIG, getMarketByAddress } from '@/config/gmx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { WalletButton } from '@/components/WalletButton';
import { cn } from '@/lib/utils';
import { useWallet } from '@/hooks/useWallet';
import {
  ChevronDown,
  Settings2,
  Info,
} from 'lucide-react';

interface GmxOrderPanelProps {
  selectedMarket: string | null;
}

type OrderSide = 'long' | 'short' | 'swap';
type OrderType = 'market' | 'limit';

export function GmxOrderPanel({ selectedMarket }: GmxOrderPanelProps) {
  const { isConnected } = useWallet();
  const { currentArenaWallet } = useMolfiWallet();
  const { estimate } = useOrderEstimate();

  const [side, setSide] = useState<OrderSide>('long');
  const [orderType, setOrderType] = useState<OrderType>('market');
  const [payAmount, setPayAmount] = useState('');
  const [leverage, setLeverage] = useState([2]);
  const [showTPSL, setShowTPSL] = useState(false);

  const { price: currentPrice } = useMarketPrice(selectedMarket);
  const marketConfig = selectedMarket ? getMarketByAddress(selectedMarket) : null;

  const payValue = parseFloat(payAmount) || 0;
  const positionSize = payValue * leverage[0];
  const availableBalance = currentArenaWallet?.balance ?? 0;

  const positionEstimate = useMemo(() => {
    if (!selectedMarket || payValue <= 0 || currentPrice <= 0 || side === 'swap') {
      return null;
    }
    return estimate({
      marketAddress: selectedMarket,
      side: side as 'long' | 'short',
      collateral: payValue,
      leverage: leverage[0],
      entryPrice: currentPrice,
    });
  }, [selectedMarket, side, payValue, leverage, currentPrice, estimate]);

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Side Tabs - GMX Style */}
      <div className="flex-shrink-0 grid grid-cols-3 h-11 border-b border-border">
        <button
          onClick={() => setSide('long')}
          className={cn(
            "text-sm font-medium transition-colors",
            side === 'long' 
              ? "bg-success text-success-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Long
        </button>
        <button
          onClick={() => setSide('short')}
          className={cn(
            "text-sm font-medium transition-colors border-x border-border",
            side === 'short' 
              ? "bg-destructive text-destructive-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Short
        </button>
        <button
          onClick={() => setSide('swap')}
          className={cn(
            "text-sm font-medium transition-colors",
            side === 'swap' 
              ? "bg-primary text-primary-foreground" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Swap
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex-shrink-0 flex items-center h-10 px-4 border-b border-border gap-4">
        <button
          onClick={() => setOrderType('market')}
          className={cn(
            "text-sm font-medium transition-colors",
            orderType === 'market' 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Market
        </button>
        <button
          onClick={() => setOrderType('limit')}
          className={cn(
            "text-sm font-medium transition-colors",
            orderType === 'limit' 
              ? "text-foreground" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Limit
        </button>
        <span className="text-sm text-muted-foreground flex items-center gap-1 cursor-pointer hover:text-foreground">
          More <ChevronDown className="w-3 h-3" />
        </span>
        <div className="flex-1" />
        <button className="text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Pay Input */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Pay</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="0.0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="h-12 text-lg font-mono pr-24"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                <span className="text-[8px] font-bold text-success-foreground">$</span>
              </div>
              <span className="text-sm font-medium">USDC</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground text-right">
            $0.00
          </div>
        </div>

        {/* Position Size Display */}
        {side !== 'swap' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">{side === 'long' ? 'Long' : 'Short'}</Label>
            <div className="relative">
              <Input
                type="text"
                value={positionSize > 0 ? positionSize.toFixed(2) : '0.0'}
                readOnly
                className="h-12 text-lg font-mono pr-32 bg-muted/30"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-warning flex items-center justify-center">
                  <span className="text-[8px] font-bold text-warning-foreground">
                    {marketConfig?.symbol.split('/')[0] || '?'}
                  </span>
                </div>
                <span className="text-sm font-medium">{marketConfig?.symbol || 'BTC/USD'}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Leverage: {leverage[0].toFixed(2)}x</span>
              <span>${positionSize.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Leverage Slider */}
        {side !== 'swap' && (
          <div className="space-y-3">
            <div className="flex justify-between text-[11px]">
              {[0.1, 1, 2, 5, 10, 25, 50, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => setLeverage([Math.min(val, 50)])}
                  className={cn(
                    "text-muted-foreground hover:text-foreground transition-colors",
                    leverage[0] === val && "text-foreground font-medium"
                  )}
                >
                  {val}x
                </button>
              ))}
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={50}
              step={0.1}
              className="py-2"
            />
            <div className="flex justify-end">
              <span className="text-sm font-mono font-medium">{leverage[0].toFixed(1)}x</span>
            </div>
          </div>
        )}

        {/* Pool & Collateral Info */}
        {side !== 'swap' && (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pool</span>
              <span className="flex items-center gap-1">
                {marketConfig?.symbol.replace('/', '-')}-USDC
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                Collateral In
                <Info className="w-3 h-3" />
              </span>
              <span className="flex items-center gap-1">
                USDC
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </span>
            </div>
          </div>
        )}

        {/* Take Profit / Stop Loss Toggle */}
        {side !== 'swap' && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Take Profit / Stop Loss</span>
            <Switch
              checked={showTPSL}
              onCheckedChange={setShowTPSL}
            />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border">
        {!isConnected ? (
          <div className="w-full">
            <WalletButton />
          </div>
        ) : (
          <Button
            className={cn(
              "w-full h-12 text-base font-semibold",
              side === 'long' && "bg-success hover:bg-success/90",
              side === 'short' && "bg-destructive hover:bg-destructive/90",
              side === 'swap' && "bg-primary hover:bg-primary/90"
            )}
            disabled={payValue <= 0}
          >
            {payValue <= 0 ? 'Enter Amount' : `${side === 'long' ? 'Long' : side === 'short' ? 'Short' : 'Swap'} ${marketConfig?.symbol || 'BTC/USD'}`}
          </Button>
        )}
      </div>

      {/* Position Details */}
      {positionEstimate && side !== 'swap' && (
        <div className="flex-shrink-0 px-4 pb-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Liquidation Price</span>
            <span className="font-mono">—</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Price Impact / Fees</span>
            <span className="font-mono">0.000% / 0.000%</span>
          </div>
          <details className="group">
            <summary className="flex justify-between cursor-pointer list-none">
              <span className="text-muted-foreground flex items-center gap-1">
                Execution Details
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
              </span>
            </summary>
            <div className="pt-2 space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Entry Price</span>
                <span className="font-mono text-foreground">
                  ${currentPrice?.toLocaleString() || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Size</span>
                <span className="font-mono text-foreground">
                  ${positionSize.toFixed(2)}
                </span>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
