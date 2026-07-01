import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { useWallet } from '@/hooks/useWallet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Wallet, 
  LogOut, 
  ChevronDown, 
  Trophy,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DepositModal } from './DepositModal';

export function UserAccountMenu() {
  const { disconnect } = useWallet();
  const {
    connectedWallet,
    ledgerBalance,
    arenaWallets,
    currentArenaWallet,
    setCurrentArenaWallet,
  } = useMolfiWallet();
  
  const [depositOpen, setDepositOpen] = useState(false);

  if (!connectedWallet) {
    return null;
  }

  const shortenAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const getWalletTypeLabel = () => {
    if (connectedWallet.type === 'aa') return 'Smart Wallet';
    return connectedWallet.provider.charAt(0).toUpperCase() + connectedWallet.provider.slice(1);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-warning to-warning/60 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-background" />
              </div>
              <span className="hidden sm:inline font-mono text-xs">
                {shortenAddress(connectedWallet.address)}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72">
          {/* Connected Wallet Info */}
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Connected</p>
                <code className="text-sm font-mono">
                  {shortenAddress(connectedWallet.address)}
                </code>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {getWalletTypeLabel()}
              </Badge>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Prediction Market Balance */}
          <DropdownMenuLabel className="py-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Prediction Market</span>
                <Badge variant="secondary" className="text-[10px]">
                  <Wallet className="w-3 h-3 mr-1" />
                  Ledger
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  ${ledgerBalance.toFixed(2)} <span className="text-xs text-muted-foreground">USDC</span>
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setDepositOpen(true)}>
                    Deposit
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    Withdraw
                  </Button>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>

          {/* Arena Wallets */}
          {arenaWallets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground pt-2">
                Arena Wallets
              </DropdownMenuLabel>
              
              {arenaWallets.map((wallet) => (
                <DropdownMenuItem
                  key={wallet.address}
                  className={cn(
                    'flex flex-col items-start gap-1 py-3 cursor-pointer',
                    currentArenaWallet?.address === wallet.address && 'bg-muted'
                  )}
                  onClick={() => setCurrentArenaWallet(wallet)}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-warning" />
                      <span className="font-medium">Competition #{wallet.competitionNumber}</span>
                    </div>
                    {wallet.status === 'ACTIVE' && (
                      <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30">
                        LIVE
                      </Badge>
                    )}
                    {wallet.isForfeited && (
                      <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">
                        FORFEITED
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-mono">
                      ${wallet.equity.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs font-mono flex items-center gap-1',
                        wallet.roi >= 0 ? 'text-green-400' : 'text-destructive'
                      )}>
                        {wallet.roi >= 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        {wallet.roi >= 0 ? '+' : ''}{wallet.roi.toFixed(2)}%
                      </span>
                      {wallet.rank > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          #{wallet.rank}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />

          {/* Actions */}
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              View Profile
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link to="/arena" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Arena Competitions
              <ExternalLink className="w-3 h-3 ml-auto text-muted-foreground" />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => disconnect()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DepositModal open={depositOpen} onOpenChange={setDepositOpen} />
    </>
  );
}
