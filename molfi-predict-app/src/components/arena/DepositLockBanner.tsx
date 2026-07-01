import { Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepositLockBannerProps {
  balance: number;
  className?: string;
}

export function DepositLockBanner({ balance, className }: DepositLockBannerProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg',
      'bg-warning/10 border border-warning/30',
      className
    )}>
      <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
        <Lock className="w-5 h-5 text-warning" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-warning" />
          Deposits Locked
        </p>
        <p className="text-sm text-muted-foreground">
          Competition has started. Additional deposits are not allowed.
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          You can still trade with your current balance:{' '}
          <span className="font-mono font-medium text-foreground">
            ${balance.toFixed(2)}
          </span>
        </p>
      </div>
    </div>
  );
}
