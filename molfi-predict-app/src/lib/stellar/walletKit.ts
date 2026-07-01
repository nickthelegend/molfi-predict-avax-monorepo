/**
 * Stellar Wallets Kit — single shared instance.
 *
 * Replaces the former Dynamic Labs / EVM wallet stack. The kit gives a unified
 * API over Freighter, xBull, Albedo, Lobstr, Hana, etc. It is a plain singleton
 * (no React provider needed); hooks/components import `walletKit` directly.
 */
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

/** Network the app targets. Flip to PUBLIC for mainnet via env. */
export const STELLAR_NETWORK: WalletNetwork =
  import.meta.env.VITE_STELLAR_NETWORK === "mainnet"
    ? WalletNetwork.PUBLIC
    : WalletNetwork.TESTNET;

export const NETWORK_PASSPHRASE = STELLAR_NETWORK;

export const SOROBAN_RPC_URL: string =
  import.meta.env.VITE_STELLAR_RPC_URL ??
  "https://soroban-testnet.stellar.org";

export const walletKit = new StellarWalletsKit({
  network: STELLAR_NETWORK,
  // A sensible default; the modal lets the user pick any installed wallet.
  selectedWalletId: FREIGHTER_ID,
  modules: allowAllModules(),
});
