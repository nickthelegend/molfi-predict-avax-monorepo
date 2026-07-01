import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { cn } from '@/lib/utils';
import { AlertTriangle, Trophy, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ForfeitWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function ForfeitWarningModal({
  open,
  onOpenChange,
  onConfirm,
}: ForfeitWarningModalProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentArenaWallet) {
    return null;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      toast.success('Withdrawal completed. You have been removed from the competition.');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to process withdrawal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Forfeit Warning
          </DialogTitle>
          <DialogDescription>
            Withdrawing funds will permanently remove you from the competition
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Consequences */}
          <div className="space-y-2">
            <p className="text-sm font-medium">You will:</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-destructive">
                <X className="w-4 h-4" />
                Lose eligibility for top 5 prizes
              </li>
              <li className="flex items-center gap-2 text-destructive">
                <X className="w-4 h-4" />
                Be removed from leaderboard
              </li>
              <li className="flex items-center gap-2 text-green-500">
                <span className="w-4 h-4 flex items-center justify-center">✓</span>
                Receive your current balance: ${currentArenaWallet.balance.toFixed(2)}
              </li>
            </ul>
          </div>

          {/* Current Standing */}
          <div className="p-4 rounded-lg bg-muted/30 border border-border">
            <p className="text-sm font-medium mb-3">Current standings:</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Rank</p>
                <p className="font-mono font-semibold">
                  #{currentArenaWallet.rank} / 50
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">ROI</p>
                <p className={cn(
                  'font-mono font-semibold',
                  currentArenaWallet.roi >= 0 ? 'text-green-500' : 'text-destructive'
                )}>
                  {currentArenaWallet.roi >= 0 ? '+' : ''}{currentArenaWallet.roi.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Prize Pool Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <Trophy className="w-5 h-5 text-warning" />
            <div className="text-sm">
              <p className="font-medium">Prize pool: $500</p>
              <p className="text-muted-foreground">Top 5 share</p>
            </div>
          </div>

          {/* Warning */}
          <p className="text-sm text-muted-foreground text-center">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Withdraw & Forfeit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
