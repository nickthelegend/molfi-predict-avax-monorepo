/**
 * Molfi On-Chain Contract Configuration
 * =========================================
 * Addresses and minimal ABIs for all deployed contracts on Arbitrum Sepolia.
 * Used by frontend hooks that need direct contract interaction (router
 * deployment, deposit sweep, on-chain balance read).
 *
 * Chain: Arbitrum Sepolia (chainId 421614)
 * RPC:   https://sepolia-rollup.arbitrum.io/rpc
 */

// ─── Chain IDs ────────────────────────────────────────────────────────────────────────────────────

export const ARB_SEPOLIA_CHAIN_ID = 421614;

// ─── Contract Addresses ───────────────────────────────────────────────────────

/** Override via VITE_ROUTER_FACTORY, VITE_VAULT_ADDRESS, etc. for flexibility. */
export const CONTRACTS = {
  /** ERC-20 MockUSDC (6 decimals) */
  USDC: (import.meta.env.VITE_USDC_ADDRESS as string | undefined)
    ?? "0xe9BA9c43D00bD54803C32D5bB7e6f89FC4aC2dB5",

  /** MolfiPool transparent proxy — the vault */
  VAULT: (import.meta.env.VITE_VAULT_ADDRESS as string | undefined)
    ?? "0xd5CBc94C21599952EC9Aa17ac56C09e43d1807f9",

  /** RouterFactory — CREATE2 router deployer */
  ROUTER_FACTORY: (import.meta.env.VITE_ROUTER_FACTORY as string | undefined)
    ?? "0x5c559B5Cd201FFF0e1783B4554E9b55ea9c8e2e8",

  /** MarketRegistry */
  MARKET_REGISTRY: (import.meta.env.VITE_MARKET_REGISTRY as string | undefined)
    ?? "0x13991982A2f91713A0C86B6A5Ba16b7EB6fDDedC",

  /** MatchSettlement — EIP-712 batch settle */
  MATCH_SETTLEMENT: (import.meta.env.VITE_MATCH_SETTLEMENT as string | undefined)
    ?? "0xa87a79EBA7997041D48e7493fEacaF1A5896CeAa",

  /** OracleModule */
  ORACLE_MODULE: (import.meta.env.VITE_ORACLE_MODULE as string | undefined)
    ?? "0x99805f350d11cEDFd95c470F1D860F3efF754cCd",
} as const;

// ─── Minimal ABIs ─────────────────────────────────────────────────────────────

/** RouterFactory — only the functions the frontend needs */
export const ROUTER_FACTORY_ABI = [
  // Deploy a new UserRouter for `user` at a deterministic CREATE2 address
  "function createRouter(address user, bytes32 salt) external returns (address)",
  // Off-chain / view: predict the address without deploying
  "function computeRouterAddress(address user, bytes32 salt) external view returns (address)",
  // Read-only: who are vault + asset
  "function vault() external view returns (address)",
  "function asset() external view returns (address)",
  // Event
  "event RouterCreated(address indexed user, address router)",
] as const;

/** UserRouter — sweep USDC from router → vault */
export const USER_ROUTER_ABI = [
  "function sweep() external",
  "function owner() external view returns (address)",
  "function vault() external view returns (address)",
  "function asset() external view returns (address)",
  "event ForwardedToVault(uint256 amount)",
] as const;

/** Minimal ERC-20 ABI (USDC) */
export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
] as const;

/** MolfiPool — vault deposit / withdraw (minimal surface) */
export const MOLFI_POOL_ABI = [
  "function deposit(uint256 amount) external",
  "function withdraw(address to, uint256 amount) external",
  "function balanceOf(address user) external view returns (uint256)",
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute a deterministic CREATE2 salt for a given user address.
 * Uses the user's address padded to bytes32 so each user has exactly one
 * canonical router — no secondary salts needed.
 */
export function userSalt(address: string): string {
  // Pad the lower-case hex address (without 0x) to 32 bytes
  const hex = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
  return `0x${hex}`;
}
