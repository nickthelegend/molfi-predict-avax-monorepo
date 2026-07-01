import { isEnokiWallet, isGoogleWallet } from "@mysten/enoki";
import {
  getWallets,
  isWalletWithRequiredFeatureSet,
  SUI_TESTNET_CHAIN,
  type WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";

export function listSuiWallets(): WalletWithRequiredFeatures[] {
  return getWallets()
    .get()
    .filter((wallet) => isWalletWithRequiredFeatureSet(wallet));
}

/** Enoki Google wallets registered for zkLogin (primary login path). */
export function listGoogleEnokiWallets(): WalletWithRequiredFeatures[] {
  return listSuiWallets().filter((wallet) => isEnokiWallet(wallet) && isGoogleWallet(wallet));
}

export function getGoogleEnokiWallet(): WalletWithRequiredFeatures | null {
  return listGoogleEnokiWallets()[0] ?? null;
}

/** True for the Enoki Google zkLogin wallet (gas-sponsored login path). */
export function isGoogleEnokiWallet(wallet: WalletWithRequiredFeatures): boolean {
  return isEnokiWallet(wallet) && isGoogleWallet(wallet);
}

/**
 * Every wallet the user can connect with: the Enoki Google zkLogin wallet plus
 * any installed standard Sui wallet (Sui Wallet, Suiet, Slush, …). Non-Google
 * Enoki providers are excluded so the list stays deduped and predictable.
 */
export function listConnectableWallets(): WalletWithRequiredFeatures[] {
  return listSuiWallets().filter((wallet) =>
    isEnokiWallet(wallet) ? isGoogleWallet(wallet) : true,
  );
}

/** Installed standard (extension) Sui wallets — everything except Enoki zkLogin. */
export function listExternalWallets(): WalletWithRequiredFeatures[] {
  return listSuiWallets().filter((wallet) => !isEnokiWallet(wallet));
}

export function getWalletAccount(wallet: WalletWithRequiredFeatures): WalletAccount | null {
  const account =
    wallet.accounts.find((a) => a.chains.includes(SUI_TESTNET_CHAIN)) ?? wallet.accounts[0];
  return account ?? null;
}

export function formatSuiAddress(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
