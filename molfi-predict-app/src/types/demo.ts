export type DemoView = 'landing' | 'clob-demo' | 'aggregator-demo' | 'comparison' | 'technical';

export interface Market {
  id: string;
  title: string;
  yesOdds: number;
  noOdds: number;
  liquidity: number;
  volume24h: number;
  resolutionDate: string;
  oracle: string;
  category: 'crypto' | 'sports' | 'politics';
}

export interface Order {
  price: number;
  size: number;
  total: number;
}

export interface Position {
  marketId: string;
  tokens: number;
  entryPrice: number;
  currentPrice: number;
  side: 'YES' | 'NO';
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  profit: number;
  roi: number;
}

export interface VenueInfo {
  name: string;
  chain: string;
  logo: string;
  liquidity: number;
  fees: number;
  latency: number;
}
