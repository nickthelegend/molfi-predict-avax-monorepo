export interface Vault {
  id: string;
  name: string;
  description: string;
  tvl: number;
  apy: number;
  totalShares: number;
  sharePrice: number;
  strategy: string;
}

export interface UserVaultPosition {
  vaultId: string;
  shares: number;
  usdcValue: number;
  depositedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
}

export interface VaultTransaction {
  id: string;
  vaultId: string;
  type: "deposit" | "withdraw";
  amount: number;
  shares: number;
  sharePrice: number;
  txHash: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
}
