import { toast } from "sonner";
import { formatTxError } from "@/lib/leverx/tx-errors";
import { txUrl } from "@/lib/stellar/contracts";

export function showTxError(error: unknown) {
  toast.error(formatTxError(error));
}

/**
 * Success toast. When a Stellar tx hash is passed, shows the tx id with a
 * clickable action that opens it on the Stellar block explorer.
 */
export function showTxSuccess(message: string, txHash?: string) {
  if (txHash) {
    toast.success(message, {
      description: `Tx ${txHash.slice(0, 8)}…${txHash.slice(-6)} — view on Stellar`,
      action: {
        label: "Explorer ↗",
        onClick: () => window.open(txUrl(txHash), "_blank", "noopener,noreferrer"),
      },
      duration: 9000,
    });
  } else {
    toast.success(message);
  }
}

export function showError(message: string) {
  toast.error(message);
}
