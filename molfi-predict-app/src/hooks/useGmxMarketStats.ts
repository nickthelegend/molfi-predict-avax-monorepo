import { useQuery } from '@tanstack/react-query';
import { getGmxMarketsInfo, pingGmxApi, type GmxMarketInfo } from '@/services/gmx-api';
import { GMX_CONFIG } from '@/config/gmx';

// Map market addresses to token symbols for matching
const MARKET_TO_SYMBOL: Record<string, string> = {
  [GMX_CONFIG.markets.BTC_USD.address]: 'BTC',
  [GMX_CONFIG.markets.ETH_USD.address]: 'ETH',
  [GMX_CONFIG.markets.SOL_USD.address]: 'SOL',
};

export interface MarketStats {
  longInterestUsd: number;
  shortInterestUsd: number;
  totalInterestUsd: number;
  longRatio: number;
  shortRatio: number;
  maxLongLiquidity: number;
  maxShortLiquidity: number;
  netRateLong: number;
  netRateShort: number;
  fundingRateLong: number;
  fundingRateShort: number;
  borrowingRateLong: number;
  borrowingRateShort: number;
  isDisabled: boolean;
}

/**
 * Hook for GMX API connection status
 */
export function useGmxConnection() {
  const { data: isConnected, isLoading } = useQuery({
    queryKey: ['gmx', 'connection'],
    queryFn: pingGmxApi,
    refetchInterval: 30000, // Check every 30 seconds
    staleTime: 10000,
  });

  return {
    isConnected: isConnected ?? false,
    isLoading,
  };
}

/**
 * Hook for fetching all GMX market stats
 */
export function useGmxAllMarketStats() {
  const query = useQuery({
    queryKey: ['gmx', 'markets-info'],
    queryFn: getGmxMarketsInfo,
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });

  return {
    ...query,
    data: query.data || [],
  };
}

/**
 * Hook for fetching stats for a specific market
 */
export function useGmxMarketStats(marketAddress: string | null) {
  const { data: allStats, isLoading, isError } = useGmxAllMarketStats();
  const { isConnected } = useGmxConnection();

  if (!marketAddress) {
    return {
      stats: null,
      isLoading: false,
      isError: false,
      isConnected,
    };
  }

  const tokenSymbol = MARKET_TO_SYMBOL[marketAddress];
  
  // Find matching market in the response
  const marketInfo = allStats.find((m) => 
    m.indexTokenSymbol === tokenSymbol ||
    m.marketTokenAddress.toLowerCase() === marketAddress.toLowerCase()
  );

  if (!marketInfo) {
    return {
      stats: getDefaultStats(),
      isLoading,
      isError,
      isConnected,
    };
  }

  const totalInterest = marketInfo.longInterestUsd + marketInfo.shortInterestUsd;
  const longRatio = totalInterest > 0 ? (marketInfo.longInterestUsd / totalInterest) * 100 : 50;
  const shortRatio = totalInterest > 0 ? (marketInfo.shortInterestUsd / totalInterest) * 100 : 50;

  const stats: MarketStats = {
    longInterestUsd: marketInfo.longInterestUsd,
    shortInterestUsd: marketInfo.shortInterestUsd,
    totalInterestUsd: totalInterest,
    longRatio,
    shortRatio,
    maxLongLiquidity: marketInfo.maxLongLiquidity,
    maxShortLiquidity: marketInfo.maxShortLiquidity,
    netRateLong: marketInfo.netRateLong,
    netRateShort: marketInfo.netRateShort,
    fundingRateLong: marketInfo.fundingRateLong,
    fundingRateShort: marketInfo.fundingRateShort,
    borrowingRateLong: marketInfo.borrowingRateLong,
    borrowingRateShort: marketInfo.borrowingRateShort,
    isDisabled: marketInfo.isDisabled,
  };

  return {
    stats,
    isLoading,
    isError,
    isConnected,
  };
}

function getDefaultStats(): MarketStats {
  return {
    longInterestUsd: 0,
    shortInterestUsd: 0,
    totalInterestUsd: 0,
    longRatio: 50,
    shortRatio: 50,
    maxLongLiquidity: 0,
    maxShortLiquidity: 0,
    netRateLong: 0,
    netRateShort: 0,
    fundingRateLong: 0,
    fundingRateShort: 0,
    borrowingRateLong: 0,
    borrowingRateShort: 0,
    isDisabled: false,
  };
}

/**
 * Format USD value for display
 */
export function formatUsd(value: number, compact: boolean = true): string {
  if (compact) {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Format rate as percentage
 */
export function formatRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${(rate * 100).toFixed(4)}%`;
}
