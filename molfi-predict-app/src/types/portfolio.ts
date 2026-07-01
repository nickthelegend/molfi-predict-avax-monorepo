import { Venue, Chain } from "./market";

export interface Position {
  id: string;
  marketId: string;
  marketTitle: string;
  venue: Venue;
  chain: Chain;
  side: "yes" | "no";
  outcome: "yes" | "no";
  quantity: number;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  fees: number;
  realizedPnL: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  totalPnL: number;
  isResolved: boolean;
  status?: "active" | "won" | "lost" | "pending";
}

export interface Transaction {
  id: string;
  type: "deposit" | "trade" | "withdrawal" | "redemption" | "buy" | "sell";
  marketId?: string;
  marketTitle?: string;
  amount: number;
  price?: number;
  shares?: number;
  side?: "buy" | "sell";
  fees: number;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  chain: Chain;
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercentage: number;
  realizedPnL: number;
  unrealizedPnL: number;
  activePositions: number;
  resolvedPositions: number;
  pendingRedemptions: number;
}

export interface UserAnalytics {
  totalVolume: number;
  totalTrades: number;
  winRate: number;
  avgTradeSize: number;
  avgPositionSize: number;
  bestTrade: number;
  worstTrade: number;
  marketBreakdown: {
    category: string;
    percentage: number;
  }[];
}

export interface RedemptionQuote {
  marketId: string;
  positionSize: number;
  expectedPayout: number;
  fees: number;
  netPayout: number;
}
