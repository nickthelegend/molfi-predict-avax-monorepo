import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, ArrowRight } from "lucide-react";

// Import chain logos
import arbitrumLogo from "@/assets/arbitrum.png";
import avaxLogo from "@/assets/avax.png";
import baseLogo from "@/assets/base.png";
import bscLogo from "@/assets/bsc.png";
import celoLogo from "@/assets/celo.png";
import dotLogo from "@/assets/dot.png";
import ethLogo from "@/assets/eth.png";
import opLogo from "@/assets/op.png";
import suiLogo from "@/assets/sui.png";
import unichainLogo from "@/assets/unichain.png";

// Chain logos for multi-chain support
const stablecoinChains = [
  { name: "Ethereum", logo: ethLogo },
  { name: "Arbitrum", logo: arbitrumLogo },
  { name: "Base", logo: baseLogo },
  { name: "Optimism", logo: opLogo },
  { name: "Avalanche", logo: avaxLogo },
  { name: "BSC", logo: bscLogo },
  { name: "Celo", logo: celoLogo },
  { name: "Polkadot", logo: dotLogo },
  { name: "Sui", logo: suiLogo },
  { name: "Unichain", logo: unichainLogo },
];

const bnbChains = [
  { name: "BSC", logo: bscLogo },
];

interface VaultCardProps {
  vault: {
    id: string;
    vault_name: string;
    tokens: string[];
    apy: number;
    strategy: string;
  };
  userCommitment?: number;
  onStake: (token: string) => void;
  icon: React.ReactNode;
  nextEpochTime?: { days: number; hours: number; minutes: number; seconds: number };
  isWalletConnected?: boolean;
}

export function VaultCard({ vault, userCommitment, onStake, icon, nextEpochTime = { days: 0, hours: 0, minutes: 0, seconds: 0 }, isWalletConnected = false }: VaultCardProps) {
  // Determine which chains to show based on vault type
  const isBnbVault = vault.tokens.includes("BNB");
  const chains = isBnbVault ? bnbChains : stablecoinChains;

  return (
    <Card className="relative overflow-hidden bg-card border border-border transition-colors duration-150 hover:border-warning/50">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
              <div className="w-8 h-8">
                {icon}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{vault.vault_name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">{vault.strategy}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wide">
              <Clock className="w-3 h-3" />
              Next Epoch
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{nextEpochTime.days.toString().padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">d</span>
              <span className="text-xl font-bold text-foreground">{nextEpochTime.hours.toString().padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">h</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1 uppercase tracking-wide">
              <TrendingUp className="w-3 h-3" />
              Current APY
            </p>
            <p className="text-xl font-bold text-success">
              {vault.apy.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* User Commitment (if any) */}
        {userCommitment !== undefined && userCommitment > 0 && (
          <div className="py-3 px-4 bg-muted/50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Your Stake</span>
              <span className="font-semibold text-foreground">
                {userCommitment.toLocaleString()} {vault.tokens[0]}
              </span>
            </div>
          </div>
        )}

        {/* Stake Button */}
        <Button
          onClick={() => onStake(vault.tokens[0])}
          disabled={!isWalletConnected}
          className="w-full transition-colors duration-150"
          variant={isWalletConnected ? "default" : "secondary"}
        >
          {isWalletConnected ? (
            <>
              Stake <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>

        {/* APY Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="border-success/30 text-success text-xs">
            300% APY Starting Rate
          </Badge>
        </div>
      </div>

      {/* Chain Logos Footer */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1">
            {chains.slice(0, 5).map((chain) => (
              <div 
                key={chain.name}
                className="w-5 h-5 rounded-full bg-card border border-border overflow-hidden"
              >
                <img 
                  src={chain.logo} 
                  alt={chain.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          {!isBnbVault && (
            <span className="text-xs text-muted-foreground">
              +{chains.length - 5} chains
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
