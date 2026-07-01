import { useState, useEffect } from 'react';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { WalletSelector } from './WalletSelector';
import { SUPPORTED_NETWORKS, ARENA_CONFIG } from '@/config/gmx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  Send,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { SupportedNetwork, DepositSource } from '@/types/molfi-wallet';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTarget?: 'ledger' | 'arena';
}

type Step = 'source' | 'target' | 'amount' | 'network' | 'instructions';

export function DepositModal({ open, onOpenChange, initialTarget }: DepositModalProps) {
  const {
    ledgerBalance,
    arenaWallets,
    currentArenaWallet,
    proxyAddress,
    refreshLedgerBalance,
    refreshArenaWallets,
  } = useMolfiWallet();

  // Form state
  const [step, setStep] = useState<Step>('source');
  const [source, setSource] = useState<DepositSource>('external');
  const [targetId, setTargetId] = useState<string>('ledger');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<SupportedNetwork | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep('source');
      setSource('external');
      setTargetId(initialTarget === 'arena' && currentArenaWallet ? currentArenaWallet.address : 'ledger');
      setAmount('');
      setNetwork(null);
      setCopied(false);
      setIsPolling(false);
    }
  }, [open, initialTarget, currentArenaWallet]);

  // Determine target wallet
  const targetWallet = targetId === 'ledger'
    ? null
    : arenaWallets.find((w) => w.address === targetId);

  const targetAddress = targetId === 'ledger'
    ? proxyAddress
    : targetWallet?.address;

  // Available networks based on target
  const availableNetworks = targetId === 'ledger'
    ? SUPPORTED_NETWORKS
    : SUPPORTED_NETWORKS.filter((n) => n.isArenaCompatible);

  // Build wallet options for selector
  const walletOptions = [
    {
      id: 'ledger',
      type: 'ledger' as const,
      label: 'Prediction Market',
      balance: ledgerBalance,
    },
    ...arenaWallets.map((w) => ({
      id: w.address,
      type: 'arena' as const,
      label: `Competition #${w.competitionNumber}`,
      balance: w.balance,
      roi: w.roi,
      rank: w.rank,
      arenaWallet: w,
    })),
  ];

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Start balance polling
  const startPolling = () => {
    setIsPolling(true);
    const interval = setInterval(() => {
      if (targetId === 'ledger') {
        refreshLedgerBalance();
      } else {
        refreshArenaWallets();
      }
    }, 10000);

    // Stop after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 300000);
  };

  // Validate amount
  const amountValue = parseFloat(amount) || 0;
  const isInternalTransfer = source === 'internal';
  const minAmount = targetWallet && !targetWallet.depositsLocked ? ARENA_CONFIG.initialDeposit : 1;
  const maxAmount = isInternalTransfer ? ledgerBalance : undefined;
  const isAmountValid = amountValue >= minAmount && (!maxAmount || amountValue <= maxAmount);

  // Step navigation
  const canProceed = () => {
    switch (step) {
      case 'source':
        return true;
      case 'target':
        return !!targetId;
      case 'amount':
        return isAmountValid;
      case 'network':
        return !!network;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (step === 'source') {
      if (source === 'internal') {
        // Skip to amount for internal transfers
        setStep('amount');
      } else {
        setStep('target');
      }
    } else if (step === 'target') {
      setStep('amount');
    } else if (step === 'amount') {
      if (isInternalTransfer) {
        // Skip network for internal transfers, go straight to confirmation
        handleInternalTransfer();
      } else {
        setStep('network');
      }
    } else if (step === 'network') {
      setStep('instructions');
      startPolling();
    }
  };

  const prevStep = () => {
    if (step === 'target') setStep('source');
    else if (step === 'amount') setStep(source === 'internal' ? 'source' : 'target');
    else if (step === 'network') setStep('amount');
    else if (step === 'instructions') setStep('network');
  };

  // Handle internal transfer
  const handleInternalTransfer = async () => {
    try {
      // In production, call backend API
      // POST /api/arena/fund-internal { amount, targetWallet }
      toast.success('Internal transfer initiated');
      onOpenChange(false);
    } catch (error) {
      toast.error('Transfer failed. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'source' && 'Deposit Funds'}
            {step === 'target' && 'Select Destination'}
            {step === 'amount' && 'Enter Amount'}
            {step === 'network' && 'Select Network'}
            {step === 'instructions' && 'Deposit Instructions'}
          </DialogTitle>
          <DialogDescription>
            {step === 'source' && 'Choose how you want to fund your wallet'}
            {step === 'target' && 'Where should the funds go?'}
            {step === 'amount' && 'How much USDC do you want to deposit?'}
            {step === 'network' && 'Select the network for your deposit'}
            {step === 'instructions' && 'Send USDC to complete your deposit'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Source Selection */}
          {step === 'source' && (
            <RadioGroup value={source} onValueChange={(v) => setSource(v as DepositSource)}>
              <div className="space-y-3">
                {ledgerBalance > 0 && (
                  <label className={cn(
                    'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                    source === 'internal'
                      ? 'border-warning bg-warning/10'
                      : 'border-border hover:border-warning/50'
                  )}>
                    <RadioGroupItem value="internal" />
                    <div className="flex-1">
                      <p className="font-medium">Internal Transfer</p>
                      <p className="text-sm text-muted-foreground">
                        From Prediction Market balance: ${ledgerBalance.toFixed(2)}
                      </p>
                    </div>
                    <Send className="w-5 h-5 text-muted-foreground" />
                  </label>
                )}

                <label className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all',
                  source === 'external'
                    ? 'border-warning bg-warning/10'
                    : 'border-border hover:border-warning/50'
                )}>
                  <RadioGroupItem value="external" />
                  <div className="flex-1">
                    <p className="font-medium">External Deposit</p>
                    <p className="text-sm text-muted-foreground">
                      Send USDC from another wallet
                    </p>
                  </div>
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                </label>
              </div>
            </RadioGroup>
          )}

          {/* Step 2: Target Selection */}
          {step === 'target' && (
            <WalletSelector
              wallets={walletOptions}
              selected={targetId}
              onSelect={setTargetId}
            />
          )}

          {/* Step 3: Amount Input */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (USDC)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16 text-lg font-mono"
                    min={minAmount}
                    max={maxAmount}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    USDC
                  </span>
                </div>
              </div>

              {isInternalTransfer && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Available</span>
                  <button
                    onClick={() => setAmount(ledgerBalance.toString())}
                    className="font-mono text-warning hover:underline"
                  >
                    ${ledgerBalance.toFixed(2)} MAX
                  </button>
                </div>
              )}

              {targetWallet && !targetWallet.depositsLocked && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-warning" />
                    <span>Arena competitions require ${ARENA_CONFIG.initialDeposit} USDC</span>
                  </div>
                </div>
              )}

              {amountValue > 0 && (
                <div className="p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit amount</span>
                    <span className="font-mono">${amountValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">New balance</span>
                    <span className="font-mono font-medium">
                      ${((targetWallet?.balance ?? ledgerBalance) + amountValue).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Network Selection */}
          {step === 'network' && (
            <div className="space-y-3">
              {availableNetworks.map((net) => (
                <button
                  key={net.chainId}
                  onClick={() => setNetwork(net)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 rounded-lg border transition-all',
                    network?.chainId === net.chainId
                      ? 'border-warning bg-warning/10'
                      : 'border-border hover:border-warning/50'
                  )}
                >
                  {net.icon && (
                    <img src={net.icon} alt={net.name} className="w-8 h-8 rounded-full" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{net.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Chain ID: {net.chainId}
                    </p>
                  </div>
                  {net.isArenaCompatible && (
                    <Badge variant="secondary" className="text-[10px]">
                      GMX Compatible
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Step 5: Instructions */}
          {step === 'instructions' && targetAddress && network && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={targetAddress}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Deposit Address</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-muted/30 text-xs font-mono break-all">
                    {targetAddress}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(targetAddress)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 space-y-2">
                <p className="text-sm font-medium">Send exactly:</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold">${amountValue.toFixed(2)} USDC</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(amountValue.toString())}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  on <span className="font-medium text-foreground">{network.name}</span> network
                </p>
              </div>

              {isPolling && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Waiting for deposit...
                </div>
              )}

              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`https://sepolia.arbiscan.io/address/${targetAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {step !== 'source' ? (
            <Button variant="ghost" onClick={prevStep}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step !== 'instructions' && (
            <Button onClick={nextStep} disabled={!canProceed()}>
              {isInternalTransfer && step === 'amount' ? 'Transfer' : 'Continue'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {step === 'instructions' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
