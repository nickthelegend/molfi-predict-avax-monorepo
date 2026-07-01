import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoIcon, ArrowDownIcon, ArrowUpIcon, Loader2, RefreshCw } from 'lucide-react';
import { walletAPI } from '@/services/wallet-provider';
import type { WalletBalance } from '@/types/wallet';
import { DepositDialog } from './DepositDialog';
import { WithdrawDialog } from './WithdrawDialog';

export function BalanceCard() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const loadBalance = useCallback(async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBalance();
    const interval = setInterval(loadBalance, 10000);
    return () => clearInterval(interval);
  }, [loadBalance]);

  if (loading && !balance) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-40" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </Card>
    );
  }

  if (!balance) return null;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Wallet Balance</CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadBalance} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Total */}
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <p className="text-3xl font-bold font-mono">${balance.total.toFixed(2)}</p>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    Available <InfoIcon className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-semibold font-mono">${balance.available.toFixed(2)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Funds available for trading</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    Locked <InfoIcon className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-semibold font-mono">${balance.locked.toFixed(2)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Funds locked in open positions and orders</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1 cursor-help">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    Pending <InfoIcon className="w-3 h-3" />
                  </div>
                  <p className="text-sm font-semibold font-mono">${balance.pending.toFixed(2)}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>Withdrawals being processed</TooltipContent>
            </Tooltip>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => setShowDeposit(true)} className="flex-1 gap-2">
              <ArrowDownIcon className="w-4 h-4" /> Deposit
            </Button>
            <Button onClick={() => setShowWithdraw(true)} variant="outline" className="flex-1 gap-2">
              <ArrowUpIcon className="w-4 h-4" /> Withdraw
            </Button>
          </div>

          {/* Updated */}
          <p className="text-xs text-muted-foreground text-center">
            Last updated: {new Date(balance.lastUpdated).toLocaleTimeString()}
          </p>
        </CardContent>
      </Card>

      <DepositDialog open={showDeposit} onOpenChange={setShowDeposit} onSuccess={loadBalance} />
      <WithdrawDialog open={showWithdraw} onOpenChange={setShowWithdraw} onSuccess={loadBalance} />
    </>
  );
}
