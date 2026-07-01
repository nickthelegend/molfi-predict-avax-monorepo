'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount, useSignMessage } from 'wagmi';
import { CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';

interface FollowTraderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  traderAddress: string;
  traderStats: {
    winRate: number;
    totalPnl: number;
    totalTrades: number;
  };
}

export function FollowTraderModal({
  open,
  onOpenChange,
  traderAddress,
  traderStats
}: FollowTraderModalProps) {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [allocationAmount, setAllocationAmount] = useState<string>('');
  const [maxPositionSize, setMaxPositionSize] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleFollow = async () => {
    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    if (!allocationAmount || parseFloat(allocationAmount) <= 0) {
      setError('Please enter a valid allocation amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const allocationPct = parseFloat(allocationAmount);
      const maxPos = maxPositionSize ? parseFloat(maxPositionSize) : 500;

      // Step 1: Sign authorization message
      const message = `I authorize copy trading from ${traderAddress}.\nAllocation: ${allocationPct}%\nFollower: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageAsync({ account: address, message });

      // Step 2: Submit to Molfi v2 copy-trade API
      const { molfiApi } = await import('@/services/molfi-api');
      const data = await molfiApi.createCopyTrade({
        followerId: address,
        leaderId: traderAddress,
        allocationPercentage: allocationPct,
        maxPositionSize: maxPos,
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
          setAllocationAmount('');
          setMaxPositionSize('');
        }, 2000);
      } else {
        setError('Failed to follow trader');
      }
    } catch (err: any) {
      console.error('Follow trader error:', err);
      setError(err.message || 'Failed to sign message');
    } finally {
      setLoading(false);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Follow Trader
          </DialogTitle>
          <DialogDescription>
            Copy trades automatically from {shortenAddress(traderAddress)}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Successfully Following!</h3>
            <p className="text-sm text-muted-foreground">
              You will now copy trades from this trader
            </p>
          </div>
        ) : (
          <>
            {/* Trader Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg mb-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Win Rate</div>
                <div className="text-lg font-bold">{traderStats.winRate.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
                <div className={`text-lg font-bold ${traderStats.totalPnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ${traderStats.totalPnl.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-1">Trades</div>
                <div className="text-lg font-bold">{traderStats.totalTrades}</div>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="allocation">Total Allocation (USDC)</Label>
                <Input
                  id="allocation"
                  type="number"
                  placeholder="e.g., 1000"
                  value={allocationAmount}
                  onChange={(e) => setAllocationAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum amount to allocate for copy trading
                </p>
              </div>

              <div>
                <Label htmlFor="maxPosition">Max Position Size (Optional)</Label>
                <Input
                  id="maxPosition"
                  type="number"
                  placeholder="e.g., 100"
                  value={maxPositionSize}
                  onChange={(e) => setMaxPositionSize(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Limit per-trade position size (leave empty for proportional)
                </p>
              </div>

              {/* Info Banner */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md">
                <p className="text-xs text-blue-400">
                  ℹ️ You'll copy this trader's positions proportionally. You can stop following anytime.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-md">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleFollow} disabled={loading || !address}>
                {loading ? 'Signing...' : 'Sign & Follow'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
