import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearWalletScopedQueries,
  invalidateWalletScopedQueries,
} from "@/lib/leverx/invalidate-queries";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { suiClient } from "@/lib/sui/client";
import { showError } from "@/lib/toast";
import { walletKit, NETWORK_PASSPHRASE } from "@/lib/stellar/walletKit";

const STORAGE_KEY = "molfi:stellar-address";

/**
 * Stellar wallet/identity layer (migrated from Sui wallet-standard).
 *
 * `connect()` opens the Stellar Wallets Kit modal and exposes the connected
 * `G…` address. The context keeps the original interface shape so the UI keeps
 * compiling during the migration. NOTE: read/execution paths that still call
 * the Sui protocol (`client`, `simulationSender`) remain Sui until the on-chain
 * layer is ported to Soroban — those are the next migration phase.
 */

/** Sui read-only sender retained for legacy dev-inspect reads during transition. */
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
  /** Sign a Soroban/Stellar transaction XDR with the connected wallet. */
  signTransaction: (xdr: string) => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState<string | null>(() =>
    typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEY),
  );
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      await walletKit.openModal({
        onWalletSelected: async (option) => {
          walletKit.setWallet(option.id);
          const { address: addr } = await walletKit.getAddress();
          setAddress(addr);
          localStorage.setItem(STORAGE_KEY, addr);
        },
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Could not connect wallet");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletKit.disconnect();
    } catch {
      /* already disconnected */
    }
    setAddress(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("Wallet not connected");
      const { signedTxXdr } = await walletKit.signTransaction(xdr, {
        address,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signedTxXdr;
    },
    [address],
  );

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
      address,
      isWalletConnected: Boolean(address),
      simulationSender: READONLY_SENDER,
      connecting,
      connect,
      disconnect,
      refreshWallets: () => {},
      signTransaction,
    }),
    [address, connecting, connect, disconnect, signTransaction],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
