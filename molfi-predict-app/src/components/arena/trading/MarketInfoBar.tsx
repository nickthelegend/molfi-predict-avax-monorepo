import { useState, useRef, useEffect } from 'react';
import { useGmxMarkets, useMarketPrice } from '@/hooks/useGmxMarkets';
import { useGmxMarketStats, formatUsd, formatRate } from '@/hooks/useGmxMarketStats';
import { getMarketByAddress, GMX_CONFIG } from '@/config/gmx';
import { GmxConnectionBadge } from './GmxConnectionBadge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
} from 'lucide-react';

interface MarketInfoBarProps {
  selectedMarket: string | null;
  onSelectMarket: (address: string) => void;
}

export function MarketInfoBar({ selectedMarket, onSelectMarket }: MarketInfoBarProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: markets } = useGmxMarkets();
  const { price, change24h } = useMarketPrice(selectedMarket);
  const { stats, isConnected } = useGmxMarketStats(selectedMarket);
  
  const marketConfig = selectedMarket ? getMarketByAddress(selectedMarket) : null;
  const isPositive = (change24h || 0) >= 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format OI ratio display
  const oiRatio = stats 
    ? `(${Math.round(stats.longRatio)}%/${Math.round(stats.shortRatio)}%)`
    : '';

  return (
    <div className="h-11 bg-card border-b border-border flex items-center">
      {/* GMX Connection Status */}
      <div className="px-3 border-r border-border h-full flex items-center">
        <GmxConnectionBadge />
      </div>

      {/* Market Selector */}
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          className="h-11 px-4 rounded-none border-r border-border gap-2 hover:bg-muted/50"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center">
            <span className="text-[8px] font-bold text-warning">
              {marketConfig?.symbol.split('/')[0] || '?'}
            </span>
          </div>
          <span className="font-semibold text-sm">
            {marketConfig?.symbol || 'Select'} <span className="text-muted-foreground font-normal">[{marketConfig?.symbol.replace('/', '-')}-USDC]</span>
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")} />
        </Button>

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl z-50">
            <div className="p-2">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground px-2 py-1">
                Perpetual Markets
              </div>
              {markets?.map((market) => (
                <button
                  key={market.address}
                  onClick={() => {
                    onSelectMarket(market.address);
                    setShowDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-muted/50 transition-colors",
                    selectedMarket === market.address && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-[8px] font-bold">
                        {market.symbol.split('/')[0]}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{market.symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono">
                      ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={cn(
                      "text-[10px] font-mono",
                      market.priceChange24h >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {market.priceChange24h >= 0 ? '+' : ''}{market.priceChange24h.toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="px-4 border-r border-border h-full flex items-center gap-2">
        <div className="text-lg font-mono font-bold">
          ${price ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
        </div>
        <div className={cn(
          "text-xs font-mono flex items-center gap-0.5",
          isPositive ? "text-success" : "text-destructive"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{(change24h || 0).toFixed(2)}%
        </div>
      </div>

      {/* Live Stats from GMX API */}
      <div className="hidden lg:flex items-center h-full">
        <StatItem 
          label="OPEN INTEREST" 
          value={
            stats ? (
              <span>
                <span className="text-success">↗ {formatUsd(stats.longInterestUsd)}</span>
                {' / '}
                <span className="text-destructive">↘ {formatUsd(stats.shortInterestUsd)}</span>
              </span>
            ) : '--'
          }
          subLabel={oiRatio}
        />
        <StatItem 
          label="AVAILABLE LIQUIDITY" 
          value={
            stats ? (
              <span>
                <span className="text-success">↗ {formatUsd(stats.maxLongLiquidity)}</span>
                {' / '}
                <span className="text-destructive">↘ {formatUsd(stats.maxShortLiquidity)}</span>
              </span>
            ) : '--'
          }
        />
        <StatItem 
          label="NET RATE / 1H" 
          value={
            stats ? (
              <span>
                <span className={stats.netRateLong >= 0 ? "text-success" : "text-destructive"}>
                  ↗ {formatRate(stats.netRateLong)}
                </span>
                {' / '}
                <span className={stats.netRateShort >= 0 ? "text-success" : "text-destructive"}>
                  ↘ {formatRate(stats.netRateShort)}
                </span>
              </span>
            ) : '--'
          }
        />
        <StatItem 
          label="FUNDING / 1H" 
          value={
            stats ? (
              <span>
                <span className={stats.fundingRateLong >= 0 ? "text-success" : "text-destructive"}>
                  ↗ {formatRate(stats.fundingRateLong)}
                </span>
                {' / '}
                <span className={stats.fundingRateShort >= 0 ? "text-success" : "text-destructive"}>
                  ↘ {formatRate(stats.fundingRateShort)}
                </span>
              </span>
            ) : '--'
          }
        />
      </div>
    </div>
  );
}

function StatItem({ 
  label, 
  value, 
  subLabel 
}: { 
  label: string; 
  value: React.ReactNode; 
  subLabel?: string;
}) {
  return (
    <div className="px-4 border-r border-border h-full flex flex-col justify-center">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {label}
        {subLabel && <span className="text-primary">{subLabel}</span>}
      </div>
      <div className="text-xs font-mono font-medium">
        {value}
      </div>
    </div>
  );
}
