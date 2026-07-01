import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useTotalUnrealizedPnl } from '@/hooks/useGmxPositions';
import { cn } from '@/lib/utils';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Trophy,
  Clock,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCountdown } from '@/hooks/useCountdown';

interface AccountSummaryBarProps {
  competitionEnd?: string;
  isDevMode?: boolean;
}

export function AccountSummaryBar({ competitionEnd, isDevMode }: AccountSummaryBarProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const { totalPnl } = useTotalUnrealizedPnl(currentArenaWallet?.address);
  const countdown = useCountdown(competitionEnd || null);

  if (!currentArenaWallet) return null;

  const equity = currentArenaWallet.balance + totalPnl;
  const roi = currentArenaWallet.initialDeposit > 0
    ? ((equity - currentArenaWallet.initialDeposit) / currentArenaWallet.initialDeposit) * 100
    : 0;

  return (
    <div className="h-10 bg-muted/30 border-b border-border flex items-center px-4 gap-6 text-xs overflow-x-auto scrollbar-hide">
      {/* Competition Info */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Trophy className="w-3.5 h-3.5 text-warning" />
        <span className="text-muted-foreground uppercase tracking-wide">
          Competition #{currentArenaWallet.competitionNumber}
        </span>
        {currentArenaWallet.depositsLocked && (
          <Badge variant="outline" className="text-[8px] border-warning/30 text-warning px-1 py-0">
            <Lock className="w-2.5 h-2.5 mr-0.5" />
            LIVE
          </Badge>
        )}
        {isDevMode && (
          <Badge variant="outline" className="text-[8px] border-warning/30 text-warning px-1 py-0">
            DEV
          </Badge>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Countdown */}
      {countdown && (
        <>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-mono text-foreground">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
            <span className="text-muted-foreground">remaining</span>
          </div>
          <div className="w-px h-5 bg-border flex-shrink-0" />
        </>
      )}

      {/* Balance */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-muted-foreground">Balance</span>
        <span className="font-mono font-semibold text-foreground">
          ${currentArenaWallet.balance.toFixed(2)}
        </span>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Equity */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-muted-foreground">Equity</span>
        <span className="font-mono font-semibold text-foreground">
          ${equity.toFixed(2)}
        </span>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Unrealized PnL */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-muted-foreground">Unrealized</span>
        <span className={cn(
          "font-mono font-semibold flex items-center gap-1",
          totalPnl >= 0 ? "text-success" : "text-destructive"
        )}>
          {totalPnl >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
        </span>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* ROI */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-muted-foreground">ROI</span>
        <span className={cn(
          "font-mono font-semibold",
          roi >= 0 ? "text-success" : "text-destructive"
        )}>
          {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
        </span>
      </div>

      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Rank */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-muted-foreground">Rank</span>
        <span className="font-mono font-semibold text-warning">
          #{currentArenaWallet.rank || '--'}
        </span>
      </div>
    </div>
  );
}
