import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { SOFT_STAKING_MESSAGE } from "@/lib/soft-staking-signature";

interface SigningDialogProps {
  isOpen: boolean;
  token: string;
  amount: string;
}

export function SigningDialog({ isOpen, token, amount }: SigningDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {SOFT_STAKING_MESSAGE.title}
          </DialogTitle>
          <DialogDescription>
            {SOFT_STAKING_MESSAGE.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commitment Details */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Token</span>
                <span className="font-semibold">{token}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold">{amount}</span>
              </div>
            </div>
          </div>

          {/* Important Points */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <AlertCircle className="w-4 h-4 text-accent" />
              Important Points:
            </div>
            {SOFT_STAKING_MESSAGE.warnings.map((warning, index) => (
              <div key={index} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{warning}</span>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">Secure Signing:</strong> This is an off-chain signature. Your funds remain in your wallet and are never transferred.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please approve the signature request in your wallet
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
