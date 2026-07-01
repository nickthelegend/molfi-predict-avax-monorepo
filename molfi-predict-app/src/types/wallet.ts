export interface ChainInfo {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: { http: string[] };
    public: { http: string[] };
  };
  blockExplorers: {
    default: { name: string; url: string };
  };
  testnet: boolean;
}

export interface WalletState {
  address: string | undefined;
  chain: ChainInfo | undefined;
  isConnected: boolean;
  isConnecting: boolean;
}

export interface TransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
  gasLimit?: bigint;
}

export interface TransactionReceipt {
  hash: string;
  status: 'success' | 'failed' | 'pending';
  blockNumber?: number;
  gasUsed?: bigint;
}

// ── Wallet Balance & Transaction types ──

export interface WalletBalance {
  available: number;
  locked: number;
  pending: number;
  total: number;
  lastUpdated: Date;
}

export interface WalletTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'settlement';
  amount: number;
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  txHash?: string;
  destination?: string;
  timestamp: Date;
  confirmations?: number;
  error?: string;
}

export interface DepositAddress {
  address: string;
  network: 'optimism' | 'base' | 'polygon';
  chainId: number;
}

export interface WithdrawalRequest {
  amount: number;
  destination: string;
  estimatedTime: string;
  phase: 'initiating' | 'processing' | 'confirming' | 'complete';
}

export interface WalletAPI {
  getBalance(): Promise<WalletBalance>;
  getDepositAddress(): Promise<DepositAddress>;
  deposit(amount: number): Promise<WalletTransaction>;
  withdraw(amount: number, address: string): Promise<WalletTransaction>;
  deductTrade(amount: number): Promise<void>;
  getTransactions(limit?: number): Promise<WalletTransaction[]>;
}
