import { useState, useCallback } from "react";
import { apiService } from "@/services/api";
import type { QuoteRequest, QuoteResponse } from "@/types/trading";

interface UseQuoteResult {
  quote: QuoteResponse | null;
  isLoading: boolean;
  error: Error | null;
  getQuote: (request: QuoteRequest) => Promise<void>;
}

export const useQuote = (): UseQuoteResult => {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getQuote = useCallback(async (request: QuoteRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const quoteData = await apiService.getQuote(request);
      setQuote(quoteData as unknown as QuoteResponse);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to get quote"));
      console.error("Error getting quote:", err);
      setQuote(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { quote, isLoading, error, getQuote };
};
