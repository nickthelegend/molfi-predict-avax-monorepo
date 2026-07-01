import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AlertCircle, TrendingUp } from "lucide-react";

interface OrderConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  side: "yes" | "no";
  orderType: "market" | "limit";
  amount: number;
  leverage: number;
  effectiveAmount: number;
  effectivePrice: number;
  estimatedShares: number;
  possibleWin: number;
  liquidationPrice: number | null;
  asset: string;
}

export function OrderConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  side,
  orderType,
  amount,
  leverage,
  effectiveAmount,
  effectivePrice,
  estimatedShares,
  possibleWin,
  liquidationPrice,
  asset,
}: OrderConfirmModalProps) {
  const rows: { label: string; value: string; highlight?: boolean; warn?: boolean }[] = [
    { label: "Asset", value: asset },
    { label: "Side", value: side === "yes" ? "YES ↑" : "NO ↓" },
    { label: "Order Type", value: orderType === "market" ? "Market" : "Limit" },
    { label: "Amount", value: `$${amount.toFixed(2)} USDC` },
  ];

  if (leverage > 1) {
    rows.push(
      { label: "Leverage", value: `${leverage}x` },
      { label: "Effective Size", value: `$${effectiveAmount.toFixed(2)} USDC` },
    );
  }

  rows.push(
    { label: "Entry Price", value: `${effectivePrice.toFixed(1)}¢` },
    { label: "Est. Shares", value: isFinite(estimatedShares) ? estimatedShares.toFixed(1) : "—" },
    { label: "Max Payout", value: isFinite(estimatedShares) ? `$${estimatedShares.toFixed(2)}` : "—", highlight: true },
    { label: "Est. Profit", value: possibleWin > 0 ? `+$${possibleWin.toFixed(2)}` : "—", highlight: true },
  );

  if (liquidationPrice !== null) {
    rows.push({ label: "Liq. Price", value: `${liquidationPrice.toFixed(1)}¢`, warn: true });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-base">
            Confirm Order
            {leverage > 1 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                <TrendingUp className="w-3 h-3" /> {leverage}x
              </span>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs text-muted-foreground">
            Review your trade details before confirming.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between">
              <span className="text-muted-foreground">{r.label}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  r.highlight && "text-emerald-500 font-bold",
                  r.warn && "text-destructive font-bold",
                )}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {liquidationPrice !== null && (
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3 shrink-0" />
            If price reaches {liquidationPrice.toFixed(1)}¢ your position will be liquidated and margin lost.
          </p>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "text-xs h-8 font-bold",
              side === "yes" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white",
            )}
            onClick={onConfirm}
          >
            Confirm {side === "yes" ? "Yes" : "No"} Order
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
