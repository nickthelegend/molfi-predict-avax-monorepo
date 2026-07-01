import { useGmxMarkets } from '@/hooks/useGmxMarkets';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { GmxMarket } from '@/types/molfi-wallet';

interface MarketsOverviewProps {
  selectedMarket?: string | null;
  onSelectMarket: (marketAddress: string) => void;
  compact?: boolean;
}

export function MarketsOverview({
  selectedMarket,
  onSelectMarket,
  compact = false,
}: MarketsOverviewProps) {
  const { data: markets, isLoading, error, isLive } = useGmxMarkets();

  if (isLoading) {
    return (
      <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 border border-border">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-3 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border border-border">
        <p className="text-sm text-destructive">Failed to load markets</p>
      </Card>
    );
  }

  if (!markets?.length) {
    return (
      <Card className="p-4 border border-border">
        <p className="text-sm text-muted-foreground">No markets available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Live connection indicator */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          GMX V2 Markets
        </span>
        {isLive && (
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live Prices
          </span>
        )}
      </div>
      
      <div className={cn('grid gap-3', compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3')}>
        {markets.map((market) => (
          <MarketCard
            key={market.address}
            market={market}
            isSelected={selectedMarket === market.address}
            onSelect={() => onSelectMarket(market.address)}
            compact={compact}
            isLive={isLive}
          />
        ))}
      </div>
    </div>
  );
}

interface MarketCardProps {
  market: GmxMarket;
  isSelected: boolean;
  onSelect: () => void;
  compact?: boolean;
  isLive?: boolean;
}

function MarketCard({ market, isSelected, onSelect, compact, isLive }: MarketCardProps) {
  const isPositive = market.priceChange24h >= 0;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'p-4 rounded-lg border transition-all duration-150 text-left w-full',
        'hover:border-warning/50 hover:bg-muted/30',
        isSelected
          ? 'border-warning bg-warning/10'
          : 'border-border bg-background'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{market.symbol}</span>
        <Badge
          variant="outline"
          className={cn(
            'text-[10px]',
            isPositive
              ? 'text-green-400 border-green-400/30'
              : 'text-destructive border-destructive/30'
          )}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 mr-1" />
          ) : (
            <TrendingDown className="w-3 h-3 mr-1" />
          )}
          {isPositive ? '+' : ''}{market.priceChange24h.toFixed(2)}%
        </Badge>
      </div>

      <p className="text-lg font-mono font-semibold mb-1">
        ${market.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      {!compact && (
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Funding</span>
            <span className={cn(
              'font-mono',
              market.fundingRate >= 0 ? 'text-green-400' : 'text-destructive'
            )}>
              {(market.fundingRate * 100).toFixed(4)}%/8h
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>OI Long</span>
            <span className="font-mono">
              ${(market.openInterest.long / 1e6).toFixed(1)}M
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>OI Short</span>
            <span className="font-mono">
              ${(market.openInterest.short / 1e6).toFixed(1)}M
            </span>
          </div>
        </div>
      )}

      {compact && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Activity className="w-3 h-3" />
          <span className="font-mono">
            ${((market.openInterest.long + market.openInterest.short) / 1e6).toFixed(1)}M OI
          </span>
        </div>
      )}
    </button>
  );
}
