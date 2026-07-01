import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useTotalUnrealizedPnl } from '@/hooks/useGmxPositions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Trophy, Clock, Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { useCountdown } from '@/hooks/useCountdown';

interface CompetitionStatusProps {
  competitionEnd?: string;
  totalParticipants?: number;
}

export function CompetitionStatus({ competitionEnd, totalParticipants = 50 }: CompetitionStatusProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const { totalPnl } = useTotalUnrealizedPnl(currentArenaWallet?.address);
  const countdown = useCountdown(competitionEnd || null);

  if (!currentArenaWallet) {
    return null;
  }

  // Calculate equity including unrealized PnL
  const equity = currentArenaWallet.balance + totalPnl;
  const roi = currentArenaWallet.initialDeposit > 0
    ? ((equity - currentArenaWallet.initialDeposit) / currentArenaWallet.initialDeposit) * 100
    : 0;

  return (
    <Card className="p-4 border border-border bg-muted/20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Competition Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-warning" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Competition #{currentArenaWallet.competitionNumber}</span>
              {currentArenaWallet.depositsLocked && (
                <Badge variant="outline" className="text-[9px] border-warning/30 text-warning">
                  <Lock className="w-3 h-3 mr-1" />
                  LIVE
                </Badge>
              )}
            </div>
            {countdown && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Ends in: {countdown.days}d {countdown.hours}h {countdown.minutes}m
              </p>
            )}
          </div>
        </div>

        {/* User Stats */}
        <div className="flex items-center gap-6">
          {/* Rank */}
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              #{currentArenaWallet.rank || '--'}
            </p>
            <p className="text-xs text-muted-foreground">
              of {totalParticipants}
            </p>
          </div>

          {/* ROI */}
          <div className="text-center">
            <div className={cn(
              'text-2xl font-bold font-mono flex items-center gap-1',
              roi >= 0 ? 'text-green-500' : 'text-destructive'
            )}>
              {roi >= 0 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">ROI</p>
          </div>

          {/* Equity */}
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">
              ${equity.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Equity</p>
          </div>
        </div>

        {/* Deposit Lock Banner */}
        {currentArenaWallet.depositsLocked && (
          <Badge variant="secondary" className="text-xs">
            <Lock className="w-3 h-3 mr-1" />
            Deposits locked
          </Badge>
        )}
      </div>
    </Card>
  );
}
