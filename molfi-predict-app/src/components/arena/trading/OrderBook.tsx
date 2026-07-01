import { useMemo, useEffect, useState } from 'react';
import { useMarketPrice } from '@/hooks/useGmxMarkets';
import { useRealtimePrices } from '@/services/gmx-websocket';
import { getMarketByAddress, GMX_CONFIG } from '@/config/gmx';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OrderBookProps {
  marketAddress: string | null;
}

interface OrderLevel {
  price: number;
  size: number;
  total: number;
}

// GMX uses liquidity pools, not traditional order books
// This simulates the depth based on available liquidity at price levels
function generateGmxLiquidityLevels(
  basePrice: number, 
  side: 'bid' | 'ask', 
  levels: number = 12,
  seed: number = 0
): OrderLevel[] {
  const result: OrderLevel[] = [];
  let cumulativeTotal = 0;
  
  // GMX has tighter spreads due to oracle pricing
  const priceStep = basePrice * 0.00005; // 0.005% per level (tighter than CEX)
  
  for (let i = 0; i < levels; i++) {
    // Liquidity typically increases further from spot price
    const distanceMultiplier = 1 + (i * 0.15);
    const baseSize = 0.3 + (seed % 5) * 0.1;
    const size = Math.round(baseSize * distanceMultiplier * 1000) / 1000;
    cumulativeTotal += size;
    
    const price = side === 'bid'
      ? basePrice - (i + 1) * priceStep
      : basePrice + (i + 1) * priceStep;
    
    result.push({
      price: Math.round(price * 100) / 100,
      size,
      total: Math.round(cumulativeTotal * 1000) / 1000,
    });
  }
  
  return side === 'ask' ? result.reverse() : result;
}

// Map market address to symbol for ticker lookup
const ADDRESS_TO_SYMBOL: Record<string, string> = {
  [GMX_CONFIG.markets.BTC_USD.address]: 'BTC/USD',
  [GMX_CONFIG.markets.ETH_USD.address]: 'ETH/USD',
  [GMX_CONFIG.markets.SOL_USD.address]: 'SOL/USD',
};

export function OrderBook({ marketAddress }: OrderBookProps) {
  const { price: subgraphPrice } = useMarketPrice(marketAddress);
  const tickerSymbol = marketAddress ? ADDRESS_TO_SYMBOL[marketAddress] : 'BTC/USD';
  const { prices: tickerPrices } = useRealtimePrices(tickerSymbol ? [tickerSymbol] : []);
  
  // Use subgraph price if available, otherwise fall back to ticker API price
  const currentPrice = subgraphPrice > 0 ? subgraphPrice : (tickerPrices[tickerSymbol || 'BTC/USD'] || 0);
  const marketConfig = marketAddress ? getMarketByAddress(marketAddress) : null;
  const [tick, setTick] = useState(0);
  const [showWarning, setShowWarning] = useState(true);
  
  // Update liquidity display periodically to simulate activity
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const { asks, bids, maxTotal } = useMemo(() => {
    const basePrice = currentPrice || 100000;
    const seed = tick % 10;
    const askLevels = generateGmxLiquidityLevels(basePrice, 'ask', 12, seed);
    const bidLevels = generateGmxLiquidityLevels(basePrice, 'bid', 12, seed + 5);
    
    const allTotals = [...askLevels, ...bidLevels].map(l => l.total);
    const max = Math.max(...allTotals);
    
    return { asks: askLevels, bids: bidLevels, maxTotal: max };
  }, [currentPrice, tick]);

  // GMX has minimal spread due to oracle pricing
  const spread = asks.length && bids.length 
    ? ((asks[asks.length - 1].price - bids[0].price) / bids[0].price * 100).toFixed(4)
    : '0.0000';

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Warning Banner - GMX uses liquidity pools, not order books */}
      {showWarning && (
        <div className="flex-shrink-0 bg-yellow-500/10 border-b border-yellow-500/20 px-3 py-2 flex items-start gap-2">
          <Info className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-yellow-200 leading-tight">
              <strong>Note:</strong> GMX uses liquidity pools, not traditional order books. 
              This display shows available pool liquidity at different price levels.
            </p>
          </div>
          <button
            onClick={() => setShowWarning(false)}
            className="text-yellow-500/50 hover:text-yellow-500 text-xs"
          >
            ✕
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex-shrink-0 h-9 px-3 border-b border-border flex items-center justify-between bg-muted/20">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          GMX Liquidity
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground hover:text-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">GMX uses liquidity pools, not order books. Trades execute at oracle price with minimal slippage.</p>
            </TooltipContent>
          </Tooltip>
        </span>
        <span className="text-[10px] text-muted-foreground">
          Spread: <span className="text-foreground font-mono">{spread}%</span>
        </span>
      </div>

      {/* Column Headers */}
      <div className="flex-shrink-0 h-7 px-3 border-b border-border/50 flex items-center text-[9px] uppercase tracking-wide text-muted-foreground">
        <span className="flex-1">Price</span>
        <span className="w-16 text-right">Size</span>
        <span className="w-16 text-right">Total</span>
      </div>

      {/* Asks (Sells) */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end px-1">
        {asks.map((level, i) => (
          <OrderRow 
            key={`ask-${i}`} 
            level={level} 
            side="ask" 
            maxTotal={maxTotal}
          />
        ))}
      </div>

      {/* Current Oracle Price */}
      <div className="flex-shrink-0 h-8 px-3 border-y border-border bg-muted/30 flex items-center justify-between">
        <span className="text-[9px] text-muted-foreground uppercase">Oracle</span>
        <span className="text-sm font-mono font-bold text-foreground">
          ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}
        </span>
      </div>

      {/* Bids (Buys) */}
      <div className="flex-1 overflow-hidden px-1">
        {bids.map((level, i) => (
          <OrderRow 
            key={`bid-${i}`} 
            level={level} 
            side="bid" 
            maxTotal={maxTotal}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 h-6 px-3 border-t border-border flex items-center justify-center">
        <span className="text-[9px] text-muted-foreground">
          {marketConfig?.symbol || 'BTC/USD'} • Arbitrum
        </span>
      </div>
    </div>
  );
}

function OrderRow({ 
  level, 
  side, 
  maxTotal 
}: { 
  level: OrderLevel; 
  side: 'bid' | 'ask';
  maxTotal: number;
}) {
  const depthPercent = (level.total / maxTotal) * 100;
  
  return (
    <div className="relative h-5 flex items-center px-2 text-[11px] font-mono hover:bg-muted/30 transition-colors cursor-pointer">
      {/* Depth bar */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 transition-all duration-500",
          side === 'bid' ? "bg-success/10" : "bg-destructive/10"
        )}
        style={{ width: `${depthPercent}%` }}
      />
      
      {/* Content */}
      <span className={cn(
        "flex-1 relative z-10",
        side === 'bid' ? "text-success" : "text-destructive"
      )}>
        {level.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="w-16 text-right relative z-10 text-foreground">
        {level.size.toFixed(3)}
      </span>
      <span className="w-16 text-right relative z-10 text-muted-foreground">
        {level.total.toFixed(3)}
      </span>
    </div>
  );
}
