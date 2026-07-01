export interface ArbitrageOpportunity {
  id: string;
  marketTitle: string;
  category: string;
  
  // Molfi (Native CLOB)
  molfiPrice: number;
  molfiVenue: "molfi";
  molfiLiquidity: number;
  
  // External Venue
  externalPrice: number;
  externalVenue: "polymarket" | "limitless";
  externalLiquidity: number;
  
  // Arbitrage Metrics
  spreadPercentage: number;
  potentialProfit: number;
  estimatedProfitUSD: number;
  
  // Market Info
  volume24h: number;
  lastUpdated: number;
  
  // Trade Direction
  buyVenue: "molfi" | "polymarket" | "limitless";
  sellVenue: "molfi" | "polymarket" | "limitless";
  
  // Risk Assessment
  riskLevel: "low" | "medium" | "high";
  confidence: number;
}

export interface ArbitrageFilters {
  minSpread?: number;
  maxSpread?: number;
  venues?: ("polymarket" | "limitless")[];
  categories?: string[];
  minProfit?: number;
  riskLevels?: ("low" | "medium" | "high")[];
}

export interface ArbitrageSortOptions {
  field: "spread" | "profit" | "volume" | "updated";
  direction: "asc" | "desc";
}
