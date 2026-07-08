import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  clearWalletScopedQueries,
  invalidateWalletScopedQueries,
} from "@/lib/leverx/invalidate-queries";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { suiClient } from "@/lib/sui/client";
import { setWalletClient } from "@/lib/stellar/soroban";

/**
 * Wallet / identity layer — **Avalanche Fuji**, powered by wagmi + RainbowKit.
 *
 * `connect()` opens the RainbowKit modal (Core / MetaMask / WalletConnect / …).
 * The connected account's viem wallet client is wired into the on-chain layer
 * (`setWalletClient`) so writes sign through the user's wallet. The context keeps
 * its original interface shape so the premium UI compiles unchanged; the legacy
 * Sui fields (`client`, `simulationSender`) are retained only for compatibility.
 */

/** Retained read-only sender for legacy dev-inspect reads during transition. */
export const READONLY_SENDER =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

interface WalletContextValue {
  client: SuiJsonRpcClient;
  wallets: WalletWithRequiredFeatures[];
  wallet: WalletWithRequiredFeatures | null;
  account: WalletAccount | null;
  address: string | null;
  isWalletConnected: boolean;
  simulationSender: string;
  connecting: boolean;
  connect: (wallet?: WalletWithRequiredFeatures) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshWallets: () => void;
  /** Legacy no-op on EVM (writes go through the connected wallet client). */
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnectAsync } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  // Wire the connected wallet client into the on-chain write path.
  useEffect(() => {
    if (walletClient && address) setWalletClient(walletClient, address);
    else setWalletClient(null);
  }, [walletClient, address]);

  const connect = useCallback(async () => {
    openConnectModal?.();
  }, [openConnectModal]);

  const disconnect = useCallback(async () => {
    try {
      await disconnectAsync();
    } catch {
      /* already disconnected */
    }
  }, [disconnectAsync]);

  const signTransaction = useCallback(async (xdr: string) => xdr, []);

  // Wallet-scoped query cache: clear/refresh on address change.
  useEffect(() => {
    if (address) void invalidateWalletScopedQueries(queryClient);
    else clearWalletScopedQueries(queryClient);
  }, [address, queryClient]);

  const value = useMemo<WalletContextValue>(
    () => ({
      client: suiClient,
      wallets: [],
      wallet: null,
      account: address ? ({ address } as unknown as WalletAccount) : null,
      address: address ?? null,
      isWalletConnected: isConnected,
      simulationSender: READONLY_SENDER,
      connecting: isConnecting || isReconnecting,
      connect,
      disconnect,
      refreshWallets: () => {},
      signTransaction,
    }),
    [address, isConnected, isConnecting, isReconnecting, connect, disconnect, signTransaction],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
