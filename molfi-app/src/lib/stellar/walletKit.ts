/**
 * Wallet / identity layer — **Avalanche Fuji** (viem + injected EIP-1193 wallet).
 *
 * Keeps the `walletKit` singleton's method shape (openModal / setWallet /
 * getAddress / disconnect / signTransaction) so `WalletContext` compiles
 * unchanged, but connects the browser's injected wallet (Core / MetaMask) and
 * wires a viem wallet client into the on-chain layer for writes.
 */
import { createWalletClient, custom, getAddress } from "viem";
import { FUJI } from "@/lib/stellar/contracts";
import { fujiChain, setWalletClient } from "@/lib/stellar/soroban";

/** Retained names (Stellar used a network passphrase); on EVM these are labels. */
export const STELLAR_NETWORK = "avalanche-fuji";
export const NETWORK_PASSPHRASE = "avalanche-fuji";
export const SOROBAN_RPC_URL = FUJI.rpcUrl;

const STORAGE_KEY = "molfi:stellar-address";
const FUJI_HEX = `0x${FUJI.chainId.toString(16)}`; // 0xa869

interface Eip1193 {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

function provider(): Eip1193 {
  const eth = (globalThis as unknown as { ethereum?: Eip1193 }).ethereum;
  if (!eth) throw new Error("No EVM wallet found — install Core or MetaMask, then reload.");
  return eth;
}

let _address: string | null = null;

/** Make sure the injected wallet is on Fuji (add the network if it's missing). */
async function ensureFuji(eth: Eip1193): Promise<void> {
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: FUJI_HEX }] });
  } catch {
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: FUJI_HEX,
          chainName: "Avalanche Fuji C-Chain",
          nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
          rpcUrls: [FUJI.rpcUrl],
          blockExplorerUrls: ["https://testnet.snowtrace.io"],
        },
      ],
    });
  }
}

/** Connect the injected wallet and wire a viem wallet client for writes.
 * `silent` uses eth_accounts (no popup) for reconnect-on-reload. */
async function connectInjected(silent = false): Promise<string | null> {
  const eth = provider();
  const accounts = (await eth.request({
    method: silent ? "eth_accounts" : "eth_requestAccounts",
  })) as string[];
  if (!accounts?.length) return null;
  const address = getAddress(accounts[0]);
  if (!silent) await ensureFuji(eth);
  const wallet = createWalletClient({ account: address, chain: fujiChain, transport: custom(eth) });
  setWalletClient(wallet, address);
  _address = address;
  return address;
}

export const walletKit = {
  /** EVM has no multi-wallet chooser — connect the injected provider directly. */
  async openModal({
    onWalletSelected,
  }: {
    onWalletSelected?: (opt: { id: string }) => void | Promise<void>;
  }): Promise<void> {
    await onWalletSelected?.({ id: "injected" });
  },
  setWallet(_id: string): void {
    /* single injected provider on EVM */
  },
  async getAddress(): Promise<{ address: string }> {
    const address = _address ?? (await connectInjected(false));
    if (!address) throw new Error("No account authorized");
    return { address };
  },
  async disconnect(): Promise<void> {
    _address = null;
    setWalletClient(null);
  },
  /** Unused on EVM (writes go through the on-chain layer directly). */
  async signTransaction(xdr: string, _opts?: unknown): Promise<{ signedTxXdr: string }> {
    return { signedTxXdr: xdr };
  },
};

// Reconnect silently on reload so a previously-connected wallet can sign writes.
if (typeof window !== "undefined" && (window as unknown as { ethereum?: Eip1193 }).ethereum) {
  if (localStorage.getItem(STORAGE_KEY)) void connectInjected(true).catch(() => {});
}
