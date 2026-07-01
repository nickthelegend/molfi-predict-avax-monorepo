import { useState, useCallback } from "react";
import { apiService } from "@/services/api";
import { limitlessApi, LimitlessMarket } from "@/services/limitless-api";
import type { Market, MarketFilters, MarketSort } from "@/types/market";

// Legacy interface for backward compatibility
export interface LegacyMarket {
  id?: string;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  volume: string;
  totalVolume?: number;
  comments?: number;
  isNew?: boolean;
  venue?: string;
  imageUrl?: string;
}

interface UseInfiniteMarketsProps {
  initialMarkets?: LegacyMarket[] | Market[];
  batchSize?: number;
  filters?: MarketFilters;
  sort?: MarketSort;
  useApi?: boolean; // Toggle between API and mock data
}

export const useInfiniteMarkets = ({ 
  initialMarkets = [], 
  batchSize = 20,
  filters,
  sort,
  useApi = false,
}: UseInfiniteMarketsProps) => {
  const [markets, setMarkets] = useState<any[]>(initialMarkets);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (useApi) {
        // Use Limitless API
        const currentPage = Math.floor(markets.length / batchSize) + 1;
        const response = await limitlessApi.getActiveMarkets(
          currentPage,
          batchSize,
          sort?.field === "volume" ? "volume" : "newest"
        );
        
        // Convert Limitless markets to legacy format
        const convertedMarkets = response.data.map(convertLimitlessToLegacy);
        
        setMarkets(prev => [...prev, ...convertedMarkets]);
        setHasMore(markets.length + convertedMarkets.length < response.totalMarketsCount);
      } else {
        // Mock data fallback
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const newMarkets: LegacyMarket[] = Array.from({ length: batchSize }, (_, i) => ({
          title: `Market ${markets.length + i + 1}: ${generateRandomTitle()}`,
          yesPercentage: Math.floor(Math.random() * 60) + 20,
          noPercentage: Math.floor(Math.random() * 60) + 20,
          volume: `${(Math.random() * 5 + 0.1).toFixed(1)}M`,
          comments: Math.floor(Math.random() * 200),
          isNew: Math.random() > 0.8,
          venue: Math.random() > 0.5 ? "Polymarket" : "Limitless",
        }));
        
        setMarkets(prev => [...prev, ...newMarkets]);
        
        if (markets.length + newMarkets.length >= 200) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error loading markets:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, cursor, batchSize, markets.length, filters, sort, useApi]);

  const reset = useCallback(() => {
    setMarkets(initialMarkets);
    setHasMore(true);
    setCursor(undefined);
  }, [initialMarkets]);

  return {
    markets,
    hasMore,
    isLoading,
    loadMore,
    reset,
  };
};

// Helper functions
const formatVolume = (volume: number): string => {
  if (volume === 0) {
    return "0";
  }
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toFixed(2);
};

// Convert Limitless API market to legacy format
const convertLimitlessToLegacy = (market: LimitlessMarket): LegacyMarket => {
  return {
    id: market.address,
    title: market.title,
    yesPercentage: Math.round(market.prices[0]),
    noPercentage: Math.round(market.prices[1]),
    volume: market.volumeFormatted,
    totalVolume: parseFloat(market.volumeFormatted),
    comments: market.feedEvents?.length || 0,
    venue: "Limitless",
    isNew: false,
    imageUrl: market.creator.imageURI,
  };
};

// Helper function to generate varied market titles
const generateRandomTitle = () => {
  const topics = [
    "Bitcoin price prediction",
    "Stock market forecast",
    "Political election outcome",
    "Tech company IPO",
    "Climate change policy",
    "Sports championship winner",
    "Economic recession probability",
    "AI breakthrough timing",
    "Space exploration milestone",
    "Cryptocurrency regulation",
  ];
  
  const timeframes = [
    "by Q1 2026",
    "before March",
    "in 2026",
    "by end of year",
    "next month",
    "by summer",
  ];
  
  return `${topics[Math.floor(Math.random() * topics.length)]} ${timeframes[Math.floor(Math.random() * timeframes.length)]}?`;
};
