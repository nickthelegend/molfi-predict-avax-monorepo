import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useTotalUnrealizedPnl } from '@/hooks/useGmxPositions';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trophy, TrendingUp, TrendingDown } from 'lucide-react';

interface ArenaEquityBadgeProps {
  compact?: boolean;
  onClick?: () => void;
}

export function ArenaEquityBadge({ compact = false, onClick }: ArenaEquityBadgeProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const { totalPnl } = useTotalUnrealizedPnl(currentArenaWallet?.address);

  if (!currentArenaWallet) {
    return null;
  }

  // Calculate equity including unrealized PnL
  const equity = currentArenaWallet.balance + totalPnl;
  const roi = currentArenaWallet.initialDeposit > 0
    ? ((equity - currentArenaWallet.initialDeposit) / currentArenaWallet.initialDeposit) * 100
    : 0;

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
          'hover:bg-muted/50 cursor-pointer'
        )}
      >
        <Trophy className="w-3.5 h-3.5 text-warning" />
        <span className="font-mono text-sm font-medium">
          ${equity.toFixed(2)}
        </span>
        <span className={cn(
          'text-xs font-mono',
          roi >= 0 ? 'text-green-400' : 'text-destructive'
        )}>
          ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border border-border bg-background/50',
        'hover:border-warning/50 hover:bg-muted/30 transition-all duration-150',
        'cursor-pointer text-left w-full'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          <span className="text-xs text-muted-foreground">
            Arena #{currentArenaWallet.competitionNumber}
          </span>
        </div>
        {currentArenaWallet.rank > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            #{currentArenaWallet.rank}
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-mono font-semibold">
            ${equity.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">Equity</p>
        </div>

        <div className="text-right">
          <div className={cn(
            'flex items-center gap-1 text-sm font-mono',
            roi >= 0 ? 'text-green-400' : 'text-destructive'
          )}>
            {roi >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">ROI</p>
        </div>
      </div>

      {totalPnl !== 0 && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Unrealized PnL</span>
            <span className={cn(
              'font-mono',
              totalPnl >= 0 ? 'text-green-400' : 'text-destructive'
            )}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}
