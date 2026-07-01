import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Wallet, Trophy, TrendingUp, TrendingDown, Check } from 'lucide-react';
import type { ArenaWallet } from '@/types/molfi-wallet';

interface WalletOption {
  id: string;
  type: 'ledger' | 'arena';
  label: string;
  balance: number;
  roi?: number;
  rank?: number;
  arenaWallet?: ArenaWallet;
}

interface WalletSelectorProps {
  wallets: WalletOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function WalletSelector({
  wallets,
  selected,
  onSelect,
  className,
}: WalletSelectorProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {wallets.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => onSelect(wallet.id)}
          className={cn(
            'w-full p-4 rounded-lg border transition-all duration-150',
            'flex items-center justify-between',
            'hover:border-warning/50 hover:bg-muted/30',
            selected === wallet.id
              ? 'border-warning bg-warning/10'
              : 'border-border bg-background'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center',
              wallet.type === 'ledger'
                ? 'bg-primary/10 text-primary'
                : 'bg-warning/10 text-warning'
            )}>
              {wallet.type === 'ledger' ? (
                <Wallet className="w-5 h-5" />
              ) : (
                <Trophy className="w-5 h-5" />
              )}
            </div>
            
            <div className="text-left">
              <p className="font-medium text-sm">{wallet.label}</p>
              <p className="text-lg font-mono font-semibold">
                ${wallet.balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {wallet.type === 'arena' && wallet.roi !== undefined && (
              <div className="text-right">
                <span className={cn(
                  'text-sm font-mono flex items-center gap-1',
                  wallet.roi >= 0 ? 'text-green-400' : 'text-destructive'
                )}>
                  {wallet.roi >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {wallet.roi >= 0 ? '+' : ''}{wallet.roi.toFixed(2)}%
                </span>
                {wallet.rank && wallet.rank > 0 && (
                  <Badge variant="secondary" className="text-[10px] mt-1">
                    Rank #{wallet.rank}
                  </Badge>
                )}
              </div>
            )}

            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
              selected === wallet.id
                ? 'border-warning bg-warning text-background'
                : 'border-muted-foreground/30'
            )}>
              {selected === wallet.id && <Check className="w-3 h-3" />}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
