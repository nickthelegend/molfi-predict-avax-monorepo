/**
 * Hook to generate sparkline data locally.
 * The backend /price-history/sparkline endpoint is not available yet (returns 404).
 * Generates deterministic mock data based on market ID and current yes price.
 */
export const useMarketSparkline = (marketId: string, _venue?: string) => {
  if (!marketId) return { data: [], isLoading: false, error: null };

  // Generate stable deterministic sparkline from marketId hash
  const hash = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const basePrice = 40 + (hash % 20); // 40-60 range
  const direction = hash % 3 === 0 ? 1 : hash % 3 === 1 ? -1 : 0;
  const data = Array.from({ length: 7 }, (_, i) => {
    const noise = Math.sin(hash + i * 1.7) * 5;
    const trend = (i / 6) * direction * 8;
    return Math.max(10, Math.min(90, basePrice + trend + noise));
  });

  return { data, isLoading: false, error: null };
};
