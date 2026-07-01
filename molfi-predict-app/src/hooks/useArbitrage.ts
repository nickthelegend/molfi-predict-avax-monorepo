import { useState, useEffect, useMemo } from "react";
import { ArbitrageOpportunity, ArbitrageFilters, ArbitrageSortOptions } from "@/types/arbitrage";

interface UseArbitrageProps {
  filters?: ArbitrageFilters;
  sort?: ArbitrageSortOptions;
}

// Mock data generator for arbitrage opportunities
const generateMockOpportunities = (count: number): ArbitrageOpportunity[] => {
  const categories = ["Crypto", "Politics", "Sports", "Technology"];
  const venues: ("polymarket" | "limitless")[] = ["polymarket", "limitless"];
  const riskLevels: ("low" | "medium" | "high")[] = ["low", "medium", "high"];
  
  const markets = [
    "Bitcoin above $150k by March 2026?",
    "Ethereum above $8k by Q1 2026?",
    "Solana reaches $500 in 2026?",
    "AI tokens collective market cap above $100B by June 2026?",
    "Fed maintains rates through Q1 2026?",
    "US avoids recession in 2026?",
    "Crypto market cap above $5T by end of 2026?",
    "Major AI breakthrough announced in late 2026?",
  ];

  return Array.from({ length: count }, (_, i) => {
    const molfiPrice = 0.3 + Math.random() * 0.4;
    const spread = 0.02 + Math.random() * 0.15;
    const externalVenue = venues[Math.floor(Math.random() * venues.length)];
    const externalPrice = molfiPrice + (Math.random() > 0.5 ? spread : -spread);
    
    const buyVenue = molfiPrice < externalPrice ? "molfi" : externalVenue;
    const sellVenue = molfiPrice < externalPrice ? externalVenue : "molfi";
    
    return {
      id: `arb-${i}`,
      marketTitle: markets[i % markets.length],
      category: categories[Math.floor(Math.random() * categories.length)],
      molfiPrice,
      molfiVenue: "molfi",
      molfiLiquidity: 10000 + Math.random() * 90000,
      externalPrice,
      externalVenue,
      externalLiquidity: 5000 + Math.random() * 45000,
      spreadPercentage: Math.abs(spread) * 100,
      potentialProfit: Math.abs(spread),
      estimatedProfitUSD: Math.abs(spread) * (100 + Math.random() * 900),
      volume24h: 50000 + Math.random() * 950000,
      lastUpdated: Date.now() - Math.random() * 300000,
      buyVenue,
      sellVenue,
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      confidence: 0.7 + Math.random() * 0.3,
    };
  });
};

export const useArbitrage = ({ filters, sort }: UseArbitrageProps = {}) => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setIsLoading(true);
    const timer = setTimeout(() => {
      setOpportunities(generateMockOpportunities(50));
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Apply filters and sorting
  const filteredOpportunities = useMemo(() => {
    let filtered = [...opportunities];

    if (filters) {
      if (filters.minSpread !== undefined) {
        filtered = filtered.filter(opp => opp.spreadPercentage >= filters.minSpread!);
      }
      if (filters.maxSpread !== undefined) {
        filtered = filtered.filter(opp => opp.spreadPercentage <= filters.maxSpread!);
      }
      if (filters.venues && filters.venues.length > 0) {
        filtered = filtered.filter(opp => filters.venues!.includes(opp.externalVenue));
      }
      if (filters.categories && filters.categories.length > 0) {
        filtered = filtered.filter(opp => filters.categories!.includes(opp.category));
      }
      if (filters.minProfit !== undefined) {
        filtered = filtered.filter(opp => opp.estimatedProfitUSD >= filters.minProfit!);
      }
      if (filters.riskLevels && filters.riskLevels.length > 0) {
        filtered = filtered.filter(opp => filters.riskLevels!.includes(opp.riskLevel));
      }
    }

    if (sort) {
      filtered.sort((a, b) => {
        let aVal: number, bVal: number;
        
        switch (sort.field) {
          case "spread":
            aVal = a.spreadPercentage;
            bVal = b.spreadPercentage;
            break;
          case "profit":
            aVal = a.estimatedProfitUSD;
            bVal = b.estimatedProfitUSD;
            break;
          case "volume":
            aVal = a.volume24h;
            bVal = b.volume24h;
            break;
          case "updated":
            aVal = a.lastUpdated;
            bVal = b.lastUpdated;
            break;
          default:
            return 0;
        }

        return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [opportunities, filters, sort]);

  return {
    opportunities: filteredOpportunities,
    isLoading,
    totalCount: opportunities.length,
    filteredCount: filteredOpportunities.length,
  };
};
