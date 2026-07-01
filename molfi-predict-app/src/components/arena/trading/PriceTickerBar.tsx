import { useGmxMarkets } from '@/hooks/useGmxMarkets';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PriceTickerBarProps {
  selectedMarket: string | null;
  onSelectMarket: (address: string) => void;
}

export function PriceTickerBar({ selectedMarket, onSelectMarket }: PriceTickerBarProps) {
  const { data: markets, isLive } = useGmxMarkets();

  if (!markets?.length) {
    return (
      <div className="h-12 bg-background border-b border-border flex items-center px-4">
        <span className="text-xs text-muted-foreground">Loading markets...</span>
      </div>
    );
  }

  return (
    <div className="h-12 bg-background/80 backdrop-blur-sm border-b border-border flex items-center overflow-x-auto scrollbar-hide">
      {/* Live indicator */}
      <div className="flex-shrink-0 px-4 border-r border-border h-full flex items-center gap-2">
        {isLive ? (
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-success font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            <Activity className="w-3 h-3" />
            OFFLINE
          </span>
        )}
      </div>

      {/* Market tickers */}
      <div className="flex items-center">
        {markets.map((market) => {
          const isSelected = selectedMarket === market.address;
          const isPositive = market.priceChange24h >= 0;

          return (
            <button
              key={market.address}
              onClick={() => onSelectMarket(market.address)}
              className={cn(
                "flex-shrink-0 h-12 px-4 border-r border-border flex items-center gap-3 transition-colors",
                isSelected 
                  ? "bg-muted/50" 
                  : "hover:bg-muted/30"
              )}
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs font-semibold",
                    isSelected ? "text-warning" : "text-foreground"
                  )}>
                    {market.symbol}
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-mono font-semibold">
                  ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={cn(
                  "text-[10px] font-mono flex items-center justify-end gap-0.5",
                  isPositive ? "text-success" : "text-destructive"
                )}>
                  {isPositive ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : (
                    <TrendingDown className="w-2.5 h-2.5" />
                  )}
                  {isPositive ? '+' : ''}{market.priceChange24h.toFixed(2)}%
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
