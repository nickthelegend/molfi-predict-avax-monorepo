import { Venue, Chain } from "./market";

export interface QuoteRequest {
  marketId: string;
  side: "buy" | "sell";
  amount: number;
  slippage?: number;
}

export interface QuoteResponse {
  marketId: string;
  side: "buy" | "sell";
  amount: number;
  price: number;
  tradingFee: number;
  relayerFee: number;
  totalFee: number;
  estimatedOutcome: number;
  minOutcome: number; // after slippage
  expiry: number;
}

export interface DepositTransaction {
  orderId: string;
  approvalTx: {
    to: string;
    data: string;
    value: string;
  };
  depositTx: {
    to: string;
    data: string;
    value: string;
  };
  fees: {
    trading: number;
    relayer: number;
    total: number;
  };
  estimatedOutcome: number;
}

export interface Order {
  id: string;
  marketId: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  filled: number;
  status: "open" | "partial" | "filled" | "cancelled";
  createdAt: number;
  updatedAt: number;
}

export interface LockedBalance {
  marketId: string;
  amount: number;
  orders: string[]; // order IDs
}

export interface SlippageConfig {
  tolerance: number; // percentage
  deadline: number; // seconds
}

export interface TransactionStatus {
  hash: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  timestamp: number;
}

export interface ChainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
