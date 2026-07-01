/**
 * useRouterAccount — Phase-1 stub.
 * ================================
 * The original implementation managed a per-user EVM `UserRouter` contract at a
 * deterministic CREATE2 address on Arbitrum Sepolia (silent deploy on connect,
 * auto-sweep to the pool). That model is EVM-specific and has no direct Stellar
 * analog.
 *
 * On Stellar, user deposits will flow through the Soroban `privacy-pool` /
 * `clob-settlement` contracts (Phase 2/3). Until those land, this hook returns
 * inert state so `MolfiWalletContext` and other consumers keep working without
 * any EVM (ethers / Dynamic) dependencies.
 */
import { useMemo } from "react";

export interface RouterAccountState {
  /** Deposit address — null until the Soroban deposit flow exists (Phase 2/3). */
  routerAddress: string | null;
  isReady: boolean;
  isSettingUp: boolean;
  isSweeping: boolean;
  routerUsdcBalance: string;
  error: string | null;
  sweep: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRouterAccount(): RouterAccountState {
  return useMemo<RouterAccountState>(
    () => ({
      routerAddress: null,
      isReady: false,
      isSettingUp: false,
      isSweeping: false,
      routerUsdcBalance: "0",
      error: null,
      sweep: async () => {},
      refresh: async () => {},
    }),
    [],
  );
}
