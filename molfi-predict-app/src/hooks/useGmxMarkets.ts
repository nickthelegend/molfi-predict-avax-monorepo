import { useQuery } from '@tanstack/react-query';
import { useGmxSdk } from './useGmxSdk';
import { GMX_CONFIG } from '@/config/gmx';
import { fetchEnhancedMarkets, fetchMarketPrices } from '@/services/gmx-subgraph';
import { useRealtimePrices } from '@/services/gmx-websocket';
import type { GmxMarket } from '@/types/molfi-wallet';

export function useGmxMarkets() {
  const { isInitialized } = useGmxSdk();
  const { prices: realtimePrices, isConnected } = useRealtimePrices();

  const query = useQuery({
    queryKey: ['gmx', 'markets'],
    queryFn: async (): Promise<GmxMarket[]> => {
      return fetchEnhancedMarkets();
    },
    enabled: isInitialized,
    refetchInterval: GMX_CONFIG.polling.prices,
    staleTime: 3000,
  });

  // Merge real-time prices into market data
  const marketsWithRealtimePrices = query.data?.map((market) => ({
    ...market,
    price: realtimePrices[market.symbol] || market.price,
  })) ?? [];

  return {
    ...query,
    data: marketsWithRealtimePrices,
    isLive: isConnected,
  };
}

export function useGmxMarket(marketAddress: string | null) {
  const { data: markets, isLive, ...rest } = useGmxMarkets();

  const market = markets?.find(
    (m) => m.address.toLowerCase() === marketAddress?.toLowerCase()
  ) ?? null;

  return {
    ...rest,
    data: market,
    isLive,
  };
}

// Get real-time price for a specific market
export function useMarketPrice(marketAddress: string | null) {
  const { data: market, isLive } = useGmxMarket(marketAddress);
  
  return {
    price: market?.price ?? 0,
    change24h: market?.priceChange24h ?? 0,
    fundingRate: market?.fundingRate ?? 0,
    isLive,
  };
}

// Hook for price ticker display
export function usePriceTicker(symbol: string) {
  const { prices, isConnected } = useRealtimePrices([symbol]);
  
  return {
    price: prices[symbol] ?? 0,
    isLive: isConnected,
  };
}
