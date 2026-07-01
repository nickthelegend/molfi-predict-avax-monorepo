import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, ExternalLinkIcon } from 'lucide-react';
import { walletAPI } from '@/services/wallet-provider';
import { toast } from 'sonner';
import { isAddress } from 'ethers';
import type { WalletBalance } from '@/types/wallet';

function shortenHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function WithdrawDialog({ open, onOpenChange, onSuccess }: WithdrawDialogProps) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [processing, setProcessing] = useState(false);
  const [phase, setPhase] = useState<1 | 2 | 3 | null>(null);
  const [txHash, setTxHash] = useState('');
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const loadBalance = useCallback(async () => {
    try {
      const data = await walletAPI.getBalance();
      setWalletBalance(data);
    } catch (e) {
      console.error('Failed to load balance for withdraw:', e);
    }
  }, []);

  useEffect(() => {
    if (open) loadBalance();
  }, [open, loadBalance]);

  const maxWithdrawable = walletBalance?.available ?? 0;

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!isAddress(destination)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    try {
      setProcessing(true);
      setPhase(1);

      const tx = await walletAPI.withdraw(amountNum, destination);
      setPhase(2);
      setTxHash(tx.txHash || '');

      await new Promise(resolve => setTimeout(resolve, 1000));
      setPhase(3);

      toast.success(`Successfully withdrew $${amountNum}`);
      onSuccess();

      setTimeout(() => {
        setPhase(null);
        setAmount('');
        setDestination('');
        setTxHash('');
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Withdrawal failed');
      setPhase(null);
    } finally {
      setProcessing(false);
    }
  };

  const getProgress = () => (phase ? (phase / 3) * 100 : 0);

  const phases = [
    { num: 1, label: 'Funds reserved' },
    { num: 2, label: 'Blockchain TX sent' },
    { num: 3, label: 'Complete' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw USDC</DialogTitle>
        </DialogHeader>

        {phase === null ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount (USDC)</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setAmount(maxWithdrawable.toFixed(2))}
                  disabled={processing}
                >
                  Max: ${maxWithdrawable.toFixed(2)}
                </button>
              </div>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={processing} />
            </div>

            <div className="space-y-2">
              <Label>Destination Address</Label>
              <Input placeholder="0x..." value={destination} onChange={(e) => setDestination(e.target.value)} disabled={processing} className="font-mono text-sm" />
            </div>

            <Alert>
              <AlertDescription className="text-xs space-y-1">
                <p>⏱️ Estimated time: 30-60 seconds</p>
                <p>⛽ Gas fee: ~$0.50</p>
                <p>💡 Minimum withdrawal: $10</p>
              </AlertDescription>
            </Alert>

            <Button className="w-full" onClick={handleWithdraw} disabled={processing}>
              {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : 'Withdraw'}
            </Button>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {phase === 3 ? 'Complete!' : phases.find(p => p.num === phase)?.label + '...'}
                </span>
                <span className="font-mono">{phase}/3</span>
              </div>
              <Progress value={getProgress()} />
            </div>

            <div className="space-y-3">
              {phases.map((p) => (
                <div key={p.num} className={`flex items-center gap-3 ${phase >= p.num ? 'opacity-100' : 'opacity-40'}`}>
                  {phase >= p.num ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted shrink-0" />
                  )}
                  <span className="text-sm">Phase {p.num}: {p.label}</span>
                </div>
              ))}
            </div>

            {txHash && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
                <span className="font-mono truncate">{shortenHash(txHash)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => window.open(`https://optimistic.etherscan.io/tx/${txHash}`, '_blank')}>
                  <ExternalLinkIcon className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
