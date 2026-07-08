/**
 * wagmi + RainbowKit config for Molfi — Avalanche Fuji only.
 * The connect-wallet experience is RainbowKit's modal; writes flow through the
 * connected wallet client (wired into the on-chain layer by WalletContext).
 */
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalancheFuji } from "wagmi/chains";
import { http } from "wagmi";
import { FUJI } from "@/lib/stellar/contracts";

/** WalletConnect Cloud project id. Injected wallets (Core / MetaMask) work
 * without it; set VITE_WALLETCONNECT_PROJECT_ID to enable WalletConnect / mobile. */
const projectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ?? "molfi_dev_placeholder";

export const wagmiConfig = getDefaultConfig({
  appName: "Molfi",
  projectId,
  chains: [avalancheFuji],
  transports: { [avalancheFuji.id]: http(FUJI.rpcUrl) },
  ssr: false,
});
