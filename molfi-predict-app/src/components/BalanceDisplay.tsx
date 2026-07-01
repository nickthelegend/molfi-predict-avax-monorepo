import { useWallet } from '@/hooks/useWallet';
import { useBalance } from '@/hooks/useBalance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, RefreshCw, Lock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export function BalanceDisplay() {
  const { isConnected } = useWallet();
  const { balance, isLoading, error, refresh } = useBalance();

  if (!isConnected) return null;

  if (isLoading && !balance) {
    return (
      <Card className="p-4 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-destructive/30">
        <p className="text-sm text-destructive">Failed to load balance</p>
        <Button variant="ghost" size="sm" onClick={refresh} className="mt-2">
          <RefreshCw className="w-3 h-3 mr-1" /> Retry
        </Button>
      </Card>
    );
  }

  if (!balance) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="w-4 h-4" />
          Wallet Balance
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={refresh}
          disabled={isLoading}
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div>
        <p className="text-2xl font-bold font-mono">
          ${balance.total_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
          <span className="text-muted-foreground">Available</span>
          <span className="ml-auto font-mono font-medium">
            ${balance.available_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Locked</span>
          <span className="ml-auto font-mono font-medium">
            ${balance.locked_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {(balance.pending_deposits > 0 || balance.pending_withdrawals > 0) && (
        <div className="pt-2 border-t border-border space-y-1 text-xs text-muted-foreground">
          {balance.pending_deposits > 0 && (
            <div className="flex items-center gap-1">
              <ArrowDownLeft className="w-3 h-3" />
              Pending deposit: ${balance.pending_deposits.toLocaleString()}
            </div>
          )}
          {balance.pending_withdrawals > 0 && (
            <div className="flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              Pending withdrawal: ${balance.pending_withdrawals.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
