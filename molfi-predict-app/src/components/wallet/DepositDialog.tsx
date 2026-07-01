import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CopyIcon, CheckIcon, Loader2, Search } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { walletAPI } from '@/services/wallet-provider';
import { toast } from 'sonner';
import { ethers } from 'ethers';

// Optimism Sepolia testnet (hidden from UI)
const OP_RPC = 'https://sepolia.optimism.io';
const OP_USDC = '0x5fd84259d66Cd46123540766Be93DFE6D43130D7';
const DEPOSIT_ADDRESS = '0x091822d60dEFD28Ce70e90956e5EfF26f97a91Da';

const ERC20_BALANCE_ABI = ['function balanceOf(address) view returns (uint256)'];

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DepositDialog({ open, onOpenChange, onSuccess }: DepositDialogProps) {
  const [copied, setCopied] = useState(false);
  const [tracking, setTracking] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(DEPOSIT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied to clipboard');
  };

  const trackDeposit = async () => {
    setTracking(true);
    toast.info('Fetching deposit details from RPC...', { duration: 5000 });

    try {
      const provider = new ethers.JsonRpcProvider(OP_RPC);
      const contract = new ethers.Contract(OP_USDC, ERC20_BALANCE_ABI, provider);

      // Allow network propagation delay
      await new Promise(r => setTimeout(r, 10000));

      const rawBalance = await contract.balanceOf(DEPOSIT_ADDRESS);
      const usdcBalance = Number(ethers.formatUnits(rawBalance, 6));

      toast.success(`USDC Balance on Optimism: $${usdcBalance.toFixed(2)}`, { duration: 6000 });

      // Set the wallet balance to the on-chain value
      if (usdcBalance > 0) {
        await walletAPI.deposit(usdcBalance);
        const { clearAllTradingState } = await import('@/hooks/useTradingStore');
        clearAllTradingState();
        onSuccess();
      } else {
        toast.info('No USDC found at this address on Optimism.');
      }
    } catch (error) {
      console.error('RPC balance fetch error:', error);
      toast.error('Failed to fetch balance from RPC. Please try again.');
    } finally {
      setTracking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit USDC</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <Alert>
            <AlertDescription>
              Send USDC to the address below on <strong>Optimism</strong> network
            </AlertDescription>
          </Alert>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={DEPOSIT_ADDRESS} size={180} />
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Deposit Address</Label>
            <div className="flex gap-2">
              <Input readOnly value={DEPOSIT_ADDRESS} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyAddress}>
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs space-y-1 text-muted-foreground">
            <p>⚠️ Only send USDC on Optimism</p>
            <p>⏱️ Deposits appear after confirmations (~30 seconds)</p>
            <p>💡 Minimum deposit: $3</p>
          </div>

          {/* Track Deposit */}
          <div className="border-t border-border pt-4">
            <Button onClick={trackDeposit} disabled={tracking} className="w-full gap-2">
              {tracking ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Fetching from RPC...</>
              ) : (
                <><Search className="w-4 h-4" /> Track Deposit</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
