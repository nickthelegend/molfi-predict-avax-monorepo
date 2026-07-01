import { useState, useEffect, useCallback, useRef } from 'react';
import type { GroupOutcome } from '@/types/market-group';

interface PriceUpdate {
  outcomeId: string;
  yesPrice: number;
  noPrice: number;
  impliedProbability: number;
  direction: 'up' | 'down' | null;
}

/**
 * Mock WebSocket hook for real-time price updates
 * Simulates price changes for testing flash animations
 * 
 * @param groupId - Market group identifier
 * @param outcomes - Array of outcomes to track
 * @param enabled - Enable/disable mock updates
 */
export function useMarketGroupRealtime(
  groupId: string,
  outcomes: GroupOutcome[],
  enabled: boolean = true
) {
  const [priceUpdates, setPriceUpdates] = useState<Map<string, PriceUpdate>>(new Map());
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  const updatePrice = useCallback((outcome: GroupOutcome) => {
    // Random price change between -3% and +3%
    const change = (Math.random() - 0.5) * 6;
    const newYesPrice = Math.max(1, Math.min(99, outcome.yesPrice + change));
    const newNoPrice = 100 - newYesPrice;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : null;

    const update: PriceUpdate = {
      outcomeId: outcome.outcomeId,
      yesPrice: newYesPrice,
      noPrice: newNoPrice,
      impliedProbability: newYesPrice,
      direction,
    };

    setPriceUpdates(prev => {
      const next = new Map(prev);
      next.set(outcome.outcomeId, update);
      return next;
    });

    // Clear direction after animation
    setTimeout(() => {
      setPriceUpdates(prev => {
        const next = new Map(prev);
        const current = next.get(outcome.outcomeId);
        if (current) {
          next.set(outcome.outcomeId, { ...current, direction: null });
        }
        return next;
      });
    }, 500);
  }, []);

  useEffect(() => {
    if (!enabled || outcomes.length === 0) return;

    // Initialize prices
    outcomes.forEach(outcome => {
      priceUpdates.set(outcome.outcomeId, {
        outcomeId: outcome.outcomeId,
        yesPrice: outcome.yesPrice,
        noPrice: outcome.noPrice,
        impliedProbability: outcome.impliedProbability,
        direction: null,
      });
    });

    // Simulate price updates every 3-8 seconds for random outcomes
    outcomes.forEach(outcome => {
      const randomDelay = 3000 + Math.random() * 5000;
      const interval = setInterval(() => {
        // 30% chance to update this outcome
        if (Math.random() < 0.3) {
          updatePrice(outcome);
        }
      }, randomDelay);
      
      intervalsRef.current.push(interval);
    });

    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
    };
  }, [groupId, outcomes, enabled, updatePrice]);

  const getOutcomeUpdate = useCallback((outcomeId: string): PriceUpdate | undefined => {
    return priceUpdates.get(outcomeId);
  }, [priceUpdates]);

  return {
    priceUpdates,
    getOutcomeUpdate,
  };
}
