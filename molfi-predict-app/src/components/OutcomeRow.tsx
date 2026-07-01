import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GroupOutcome } from '@/types/market-group';

interface OutcomeRowProps {
  outcome: GroupOutcome;
  onBuyYes: () => void;
  onBuyNo: () => void;
  priceChanged?: 'up' | 'down' | null;
  index: number;
}

export function OutcomeRow({ outcome, onBuyYes, onBuyNo, priceChanged, index }: OutcomeRowProps) {
  const isSuspended = outcome.status !== 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        backgroundColor: priceChanged === 'up' 
          ? 'rgba(34, 197, 94, 0.1)' 
          : priceChanged === 'down' 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'transparent'
      }}
      transition={{ 
        delay: index * 0.03,
        backgroundColor: { duration: 0.5 }
      }}
      className={cn(
        "relative flex items-center gap-3 p-3 rounded-lg border bg-card",
        "hover:bg-accent/5 transition-colors"
      )}
      role="option"
      aria-selected={false}
    >
      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate" title={outcome.label}>
          {outcome.label}
        </p>
        {outcome.volume24h && (
          <p className="text-xs text-muted-foreground">
            ${(outcome.volume24h / 1000).toFixed(1)}K vol
          </p>
        )}
      </div>

      {/* Probability Bar */}
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${outcome.impliedProbability}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-primary to-primary/60"
          />
        </div>
        <motion.span 
          className="text-sm font-medium min-w-[3rem] text-right"
          animate={{ 
            scale: priceChanged ? [1, 1.1, 1] : 1,
            color: priceChanged === 'up' 
              ? 'rgb(34, 197, 94)' 
              : priceChanged === 'down' 
              ? 'rgb(239, 68, 68)' 
              : 'inherit'
          }}
          transition={{ duration: 0.3 }}
        >
          ${(outcome.yesPrice / 100).toFixed(3)}
        </motion.span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={onBuyYes}
          disabled={isSuspended}
          className="min-w-[70px] flex flex-col items-center py-1 h-auto"
          aria-label={`Buy YES on ${outcome.label}`}
        >
          <span className="text-[10px] font-bold">YES</span>
          <span className="text-xs font-semibold">${(outcome.yesPrice / 100).toFixed(3)}</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onBuyNo}
          disabled={isSuspended}
          className="min-w-[70px] flex flex-col items-center py-1 h-auto"
          aria-label={`Buy NO on ${outcome.label}`}
        >
          <span className="text-[10px] font-bold">NO</span>
          <span className="text-xs font-semibold">${(outcome.noPrice / 100).toFixed(3)}</span>
        </Button>
      </div>

      {isSuspended && (
        <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
          <span className="text-xs font-medium px-2 py-1 bg-muted rounded">
            {outcome.status === 'settled' ? 'Settled' : 'Suspended'}
          </span>
        </div>
      )}
    </motion.div>
  );
}
