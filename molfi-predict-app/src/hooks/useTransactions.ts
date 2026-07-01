import { useState } from "react";
import { toast } from "sonner";
import type { TransactionRequest } from "@/types/wallet";
import { useWallet } from "@/hooks/useWallet";

/**
 * Hook for handling transactions with user feedback.
 *
 * Phase-1 stub: the EVM send path (Dynamic + ethereum) has been removed. Stellar/
 * Soroban transaction submission lands in Phase 2 (signed via
 * `useWallet().signTransaction` and submitted through the Soroban RPC). Until
 * then this no-ops with a clear message so existing call sites keep compiling.
 */
export function useTransactions() {
  const [isPending, setIsPending] = useState(false);
  const { isConnected } = useWallet();

  const sendTransaction = async (_request: TransactionRequest) => {
    if (!isConnected) {
      toast.error("Wallet not connected");
      return null;
    }
    toast.info("On-chain transactions arrive in Phase 2 (Soroban)");
    return null;
  };

  return {
    sendTransaction,
    isPending,
  };
}
