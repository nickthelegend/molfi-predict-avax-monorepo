export type Venue = "polymarket" | "limitless";
export type MarketStatus = "open" | "paused" | "resolved" | "closed";
export type Chain = "optimism_sepolia" | "base" | "polygon" | "arbitrum";
export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export interface Market {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  venue: Venue;
  chain: Chain;
  status: MarketStatus;
  groupId?: string;
  marketType?: 'binary' | 'multi';
  
  // Prices
  yesPrice: number;
  noPrice: number;
  yesPercentage: number;
  noPercentage: number;
  
  // Liquidity & Volume
  liquidity: number;
  volume24h: number;
  totalVolume: number;
  openInterest: number;
  
  // Dates
  createdAt: string;
  endDate: string;
  resolvedAt?: string;
  
  // Resolution
  outcome?: "yes" | "no" | "invalid";
  
  // UI helpers
  isNew?: boolean;
  isTrending?: boolean;
  comments?: number;
  
  // Additional metadata
  imageUrl?: string;
  externalUrl?: string;
}

export interface MarketFilters {
  venue?: Venue[];
  status?: MarketStatus[];
  category?: string[];
  chain?: Chain[];
  search?: string;
  minLiquidity?: number;
  maxLiquidity?: number;
}

export interface MarketSort {
  field: "volume" | "liquidity" | "createdAt" | "endDate";
  direction: "asc" | "desc";
}

export interface PaginationCursor {
  cursor?: string;
  limit: number;
}

export interface MarketListResponse {
  markets: Market[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

export interface OrderbookEntry {
  price: number;
  size: number;
  total: number;
}

export interface Orderbook {
  marketId: string;
  bids: OrderbookEntry[];
  asks: OrderbookEntry[];
  spread: number;
  midPrice: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  marketId: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
  txHash?: string;
}

export interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceDistribution {
  price: number;
  count: number;
  volume: number;
}

export interface VolumeAnalytics {
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  trades: number;
  timestamp: number;
}

export interface MarketStats {
  volume24h: number;
  volume7d: number;
  priceChange24h: number;
  priceChange7d: number;
  highPrice24h: number;
  lowPrice24h: number;
  avgPrice24h: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  category: string;
  venue: Venue;
}
