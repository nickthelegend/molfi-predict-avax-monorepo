import { useState, useEffect, useMemo } from 'react';
import { useMarketPrice } from '@/hooks/useGmxMarkets';
import { getMarketByAddress } from '@/config/gmx';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Maximize2,
  Settings2,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ChartPlaceholderProps {
  marketAddress: string | null;
}

export function ChartPlaceholder({ marketAddress }: ChartPlaceholderProps) {
  const marketConfig = marketAddress ? getMarketByAddress(marketAddress) : null;
  const { price, change24h: priceChange24h, isLive } = useMarketPrice(marketAddress);
  
  // Simulate price history for chart visualization
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  
  useEffect(() => {
    if (price > 0) {
      setPriceHistory(prev => {
        const newHistory = [...prev, price];
        // Keep last 60 data points
        return newHistory.slice(-60);
      });
    }
  }, [price]);

  // Generate mock chart path
  const chartPath = useMemo(() => {
    if (priceHistory.length < 2) {
      // Generate initial mock data
      const mockData = Array.from({ length: 60 }, (_, i) => {
        const basePrice = price || 100000;
        const volatility = basePrice * 0.02;
        return basePrice + (Math.sin(i * 0.3) * volatility) + (Math.random() - 0.5) * volatility * 0.5;
      });
      return mockData;
    }
    return priceHistory;
  }, [priceHistory, price]);

  const minPrice = Math.min(...chartPath);
  const maxPrice = Math.max(...chartPath);
  const priceRange = maxPrice - minPrice || 1;

  const svgPath = chartPath
    .map((p, i) => {
      const x = (i / (chartPath.length - 1)) * 100;
      const y = 100 - ((p - minPrice) / priceRange) * 80;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaPath = `${svgPath} L 100 100 L 0 100 Z`;

  const isPositive = (priceChange24h || 0) >= 0;

  return (
    <div className="h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex-shrink-0 h-14 px-4 border-b border-border flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-4">
          {/* Market Info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-[10px] font-bold text-foreground">
                {marketConfig?.symbol.split('/')[0] || '?'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {marketConfig?.symbol || 'Select Market'}
                </span>
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                PERPETUAL
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="pl-4 border-l border-border">
            <div className="text-xl font-mono font-bold text-foreground">
              ${price ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '--'}
            </div>
            <div className={cn(
              "text-xs font-mono flex items-center gap-1",
              isPositive ? "text-success" : "text-destructive"
            )}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}{(priceChange24h || 0).toFixed(2)}%
              <span className="text-muted-foreground ml-1">24h</span>
            </div>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-0.5">
            {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf) => (
              <button
                key={tf}
                className={cn(
                  "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                  tf === '15m' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <BarChart3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Settings2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 relative p-4">
        {/* Y-axis labels */}
        <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-[9px] font-mono text-muted-foreground">
          <span>${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span>${((maxPrice + minPrice) / 2).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          <span>${minPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>

        {/* Chart SVG */}
        <svg
          className="absolute inset-4 left-12"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 10 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.2"
                className="text-border"
              />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />

          {/* Area fill */}
          <path
            d={areaPath}
            fill={isPositive ? "hsl(var(--success) / 0.1)" : "hsl(var(--destructive) / 0.1)"}
          />

          {/* Line */}
          <path
            d={svgPath}
            fill="none"
            stroke={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Current price dot */}
          {chartPath.length > 0 && (
            <circle
              cx="100"
              cy={100 - ((chartPath[chartPath.length - 1] - minPrice) / priceRange) * 80}
              r="1"
              fill={isPositive ? "hsl(var(--success))" : "hsl(var(--destructive))"}
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Current price line */}
        <div 
          className="absolute right-4 left-12 h-px border-t border-dashed"
          style={{ 
            top: `calc(${4 + (1 - (((chartPath[chartPath.length - 1] || price || 0) - minPrice) / priceRange) * 0.8) * 92}%)`,
            borderColor: isPositive ? 'hsl(var(--success) / 0.5)' : 'hsl(var(--destructive) / 0.5)'
          }}
        >
          <Badge 
            className={cn(
              "absolute right-0 -top-2.5 text-[9px] font-mono px-1 py-0",
              isPositive ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
            )}
          >
            ${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '--'}
          </Badge>
        </div>

        {/* Crosshair hint */}
        <div className="absolute bottom-2 right-2 text-[9px] text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Live Chart</span>
        </div>
      </div>
    </div>
  );
}
