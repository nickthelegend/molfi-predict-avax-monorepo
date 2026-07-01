import { useSyncExternalStore, useCallback } from "react";
import type { Signer as EthersSigner } from "ethers";
import {
  walletKit,
  NETWORK_PASSPHRASE,
  STELLAR_NETWORK,
} from "@/lib/stellar/walletKit";

/**
 * Unified wallet hook — now backed by Stellar Wallets Kit (was Dynamic Labs).
 *
 * Wallets Kit is imperative, so we keep a tiny module-level store and expose it
 * reactively via useSyncExternalStore. Every `useWallet()` consumer shares the
 * same connection state without a React provider.
 *
 * The return shape mirrors the old Dynamic-based hook so existing consumers
 * keep compiling. EVM-only bits (`getSigner`, `chainId`) are Phase-1 stubs;
 * real Stellar/Soroban signing arrives in Phase 2 via `signTransaction` and
 * `@molfi/predict-sdk`.
 */

const STORAGE_KEY = "molfi.wallet.address";

interface WalletState {
  address?: string;
  walletId?: string;
}

let state: WalletState = {
  address: localStorage.getItem(STORAGE_KEY) ?? undefined,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(next: WalletState) {
  state = next;
  if (next.address) localStorage.setItem(STORAGE_KEY, next.address);
  else localStorage.removeItem(STORAGE_KEY);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useWallet() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const connect = useCallback(async () => {
    await walletKit.openModal({
      onWalletSelected: async (option) => {
        walletKit.setWallet(option.id);
        const { address } = await walletKit.getAddress();
        setState({ address, walletId: option.id });
      },
    });
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await walletKit.disconnect();
    } catch {
      // kit throws if no wallet selected — safe to ignore
    }
    setState({});
  }, []);

  /** Sign a Soroban/Stellar transaction XDR with the connected wallet. */
  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!snapshot.address) throw new Error("Wallet not connected");
      const { signedTxXdr } = await walletKit.signTransaction(xdr, {
        address: snapshot.address,
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      return signedTxXdr;
    },
    [snapshot.address],
  );

  /**
   * Phase-1 stub. The old EVM signer no longer exists; on-chain settlement is
   * Phase 2 (Soroban). Consumers already guard `if (!signer)`.
   */
  const getSigner = useCallback(async (): Promise<EthersSigner | null> => {
    return null;
  }, []);

  return {
    // User / account data
    address: snapshot.address,
    email: undefined as string | undefined,
    isConnected: !!snapshot.address,
    user: undefined,
    // Compat shim for code that reads `wallet.connector?.name`
    wallet: snapshot.address
      ? { address: snapshot.address, connector: { name: snapshot.walletId ?? "stellar" } }
      : undefined,

    // Chain data — Stellar uses a network passphrase, not an EVM chainId
    chain: STELLAR_NETWORK as unknown as string,
    chainId: undefined as number | undefined,

    // Actions
    connect,
    disconnect,
    getSigner,
    signTransaction,
  };
}
