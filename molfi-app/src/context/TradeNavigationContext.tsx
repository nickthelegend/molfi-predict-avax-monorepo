import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import type { MarketTradeIntent } from "@/lib/leverx/market-trade-intent";

interface TradeNavigationContextValue {
  setPendingTrade: (intent: MarketTradeIntent) => void;
  consumePendingTrade: (oracleId: string) => MarketTradeIntent | null;
}

const TradeNavigationContext = createContext<TradeNavigationContextValue | null>(null);

export function TradeNavigationProvider({ children }: { children: ReactNode }) {
  const pendingRef = useRef<MarketTradeIntent | null>(null);

  const setPendingTrade = useCallback((intent: MarketTradeIntent) => {
    pendingRef.current = intent;
  }, []);

  const consumePendingTrade = useCallback((oracleId: string) => {
    const pending = pendingRef.current;
    if (!pending || pending.oracleId !== oracleId) return null;
    pendingRef.current = null;
    return pending;
  }, []);

  const value = useMemo(
    () => ({ setPendingTrade, consumePendingTrade }),
    [setPendingTrade, consumePendingTrade],
  );

  return (
    <TradeNavigationContext.Provider value={value}>
      {children}
    </TradeNavigationContext.Provider>
  );
}

export function useTradeNavigation(): TradeNavigationContextValue {
  const ctx = useContext(TradeNavigationContext);
  if (!ctx) {
    throw new Error("useTradeNavigation must be used within TradeNavigationProvider");
  }
  return ctx;
}
