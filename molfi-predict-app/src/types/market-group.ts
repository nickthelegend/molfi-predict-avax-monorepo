export type OutcomeStatus = 'active' | 'suspended' | 'settled';

export interface GroupOutcome {
  outcomeId: string;
  label: string;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  liquidity?: number;
  volume24h?: number;
  provider?: string;
  status: OutcomeStatus;
  iconUrl?: string;
}

export interface MarketGroup {
  groupId: string;
  question: string;
  description?: string;
  category?: string;
  eventId?: string;
  sport?: string;
  imageUrl?: string;
  totalVolume: number;
  totalLiquidity: number;
  endDate: string;
  status: 'active' | 'suspended' | 'settled';
  outcomes: GroupOutcome[];
  updatedAt: string;
}

export type OutcomeSortField = 'probability' | 'alphabetical' | 'liquidity' | 'volume';
export type SortDirection = 'asc' | 'desc';

export interface NormalizedMarketOutcome {
  label: string;
  probability: number;
}

export interface NormalizedMarket {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  venue: string;
  status: string;
  yesPrice: number;
  noPrice: number;
  yesPercentage: number;
  noPercentage: number;
  liquidity: number;
  volume24h: number;
  totalVolume: number;
  openInterest: number;
  createdAt: string;
  endDate: string;
  imageUrl?: string;
  marketType?: 'binary' | 'multi_outcome';
  outcomes?: NormalizedMarketOutcome[];
}

export type MarketItem = 
  | { type: 'binary'; market: NormalizedMarket }
  | { type: 'group'; group: MarketGroup };
