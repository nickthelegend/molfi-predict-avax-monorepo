/**
 * GMX Official REST API Service
 * Uses GMX's own API endpoints for authentic on-chain data
 * Docs: https://docs.gmx.io/docs/api/rest
 */

// Primary and fallback endpoints for Arbitrum
const GMX_API_PRIMARY = 'https://arbitrum-api.gmxinfra.io';
const GMX_API_FALLBACKS = [
  'https://arbitrum-api-fallback.gmxinfra.io',
  'https://arbitrum-api-fallback.gmxinfra2.io',
];

// Token symbol mapping for GMX API
export const GMX_TOKEN_SYMBOLS: Record<string, string> = {
  'BTC/USD': 'BTC',
  'ETH/USD': 'ETH',
  'SOL/USD': 'SOL',
};

// Timeframe mapping for GMX candles API
export const GMX_TIMEFRAMES: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  'D': '1d',
  'W': '1d', // GMX doesn't have weekly, we'll aggregate
  'M': '1d', // GMX doesn't have monthly, we'll aggregate
};

export interface GmxTicker {
  tokenSymbol: string;
  tokenAddress: string;
  minPrice: string;
  maxPrice: string;
  updatedAt: number;
}

export interface GmxCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface GmxMarketInfo {
  marketTokenAddress: string;
  indexTokenSymbol: string;
  indexTokenAddress: string;
  longTokenAddress: string;
  shortTokenAddress: string;
  longInterestUsd: number;
  shortInterestUsd: number;
  maxLongLiquidity: number;
  maxShortLiquidity: number;
  netRateLong: number;
  netRateShort: number;
  borrowingRateLong: number;
  borrowingRateShort: number;
  fundingRateLong: number;
  fundingRateShort: number;
  isDisabled: boolean;
}

let currentApiUrl = GMX_API_PRIMARY;
let lastSuccessfulFetch = Date.now();
const API_TIMEOUT_MS = 10000; // 10 second timeout

export interface GmxApiError {
  type: 'network' | 'timeout' | 'rate_limit' | 'server_error' | 'all_endpoints_failed';
  message: string;
  statusCode?: number;
  endpoint?: string;
}

/**
 * Make a request to GMX API with automatic fallback and timeout
 */
async function gmxFetch<T>(endpoint: string): Promise<T> {
  const urls = [currentApiUrl, ...GMX_API_FALLBACKS.filter(u => u !== currentApiUrl)];
  const errors: { url: string; error: string; status?: number }[] = [];
  
  for (const baseUrl of urls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      
      const response = await fetch(`${baseUrl}${endpoint}`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        currentApiUrl = baseUrl; // Remember working URL
        lastSuccessfulFetch = Date.now();
        return response.json();
      }
      
      // Log non-OK responses
      errors.push({
        url: baseUrl,
        error: `HTTP ${response.status}`,
        status: response.status,
      });
      
      // Handle specific error codes
      if (response.status === 429) {
        console.warn(`GMX API ${baseUrl} rate limited (429)`);
        continue;
      }
      
      if (response.status >= 500) {
        console.warn(`GMX API ${baseUrl} server error (${response.status})`);
        continue;
      }
      
    } catch (error: any) {
      const errorMsg = error.name === 'AbortError' ? 'Timeout' : error.message;
      errors.push({
        url: baseUrl,
        error: errorMsg,
      });
      console.warn(`GMX API ${baseUrl} failed: ${errorMsg}`);
    }
  }
  
  // All endpoints failed
  console.error('All GMX API endpoints failed:', errors);
  
  const error: GmxApiError = {
    type: 'all_endpoints_failed',
    message: `All GMX API endpoints failed. Last success: ${Math.round((Date.now() - lastSuccessfulFetch) / 1000)}s ago`,
    endpoint,
  };
  
  throw error;
}

/**
 * Check API health
 */
export async function pingGmxApi(): Promise<boolean> {
  try {
    await gmxFetch<string>('/ping');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get latest price tickers for all tokens
 */
export async function getGmxTickers(): Promise<GmxTicker[]> {
  return gmxFetch<GmxTicker[]>('/prices/tickers');
}

/**
 * Get price for a specific token symbol
 */
export async function getGmxPrice(tokenSymbol: string): Promise<{ price: number; minPrice: number; maxPrice: number } | null> {
  try {
    const tickers = await getGmxTickers();
    const ticker = tickers.find(t => t.tokenSymbol === tokenSymbol);
    
    if (!ticker) return null;
    
    const minPrice = parseFloat(ticker.minPrice) / 1e30;
    const maxPrice = parseFloat(ticker.maxPrice) / 1e30;
    
    return {
      price: (minPrice + maxPrice) / 2,
      minPrice,
      maxPrice,
    };
  } catch {
    return null;
  }
}

/**
 * Get candlestick data from GMX API
 * @param tokenSymbol - Token symbol (BTC, ETH, SOL)
 * @param period - Candle period (1m, 5m, 15m, 1h, 4h, 1d)
 * @param limit - Max candles to return (default 200, max 10000)
 */
export async function getGmxCandles(
  tokenSymbol: string,
  period: string = '1h',
  limit: number = 200
): Promise<GmxCandle[]> {
  try {
    const response = await gmxFetch<{
      period: string;
      candles: number[][];
    }>(`/prices/candles?tokenSymbol=${tokenSymbol}&period=${period}&limit=${limit}`);
    
    if (!response.candles || !Array.isArray(response.candles)) {
      console.warn('Invalid candle data received from GMX API');
      return [];
    }
    
    // GMX returns candles in descending order (most recent first)
    // Each candle: [timestamp, open, high, low, close]
    return response.candles
      .map(([timestamp, open, high, low, close]) => ({
        timestamp,
        open,
        high,
        low,
        close,
      }))
      .reverse(); // Reverse to ascending order for charts
  } catch (error) {
    console.error('Failed to fetch GMX candles:', error);
    // Re-throw with context
    throw new Error(`Failed to load chart data for ${tokenSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get market information including liquidity and open interest
 */
export async function getGmxMarketsInfo(): Promise<GmxMarketInfo[]> {
  try {
    const data = await gmxFetch<any[]>('/markets/info');
    return data.map((market: any) => ({
      marketTokenAddress: market.marketTokenAddress || '',
      indexTokenSymbol: market.indexToken?.symbol || '',
      indexTokenAddress: market.indexToken?.address || '',
      longTokenAddress: market.longToken?.address || '',
      shortTokenAddress: market.shortToken?.address || '',
      // Open Interest in USD
      longInterestUsd: parseFloat(market.longInterestUsd || '0') / 1e30,
      shortInterestUsd: parseFloat(market.shortInterestUsd || '0') / 1e30,
      // Available liquidity
      maxLongLiquidity: parseFloat(market.maxLongLiquidity || '0') / 1e30,
      maxShortLiquidity: parseFloat(market.maxShortLiquidity || '0') / 1e30,
      // Funding/borrowing rates (per hour)
      netRateLong: parseFloat(market.netRateLong1H || '0'),
      netRateShort: parseFloat(market.netRateShort1H || '0'),
      borrowingRateLong: parseFloat(market.borrowingRateLong1H || '0'),
      borrowingRateShort: parseFloat(market.borrowingRateShort1H || '0'),
      fundingRateLong: parseFloat(market.fundingRateLong1H || '0'),
      fundingRateShort: parseFloat(market.fundingRateShort1H || '0'),
      // Status
      isDisabled: market.isDisabled || false,
    }));
  } catch (error) {
    console.error('Error fetching GMX markets info:', error);
    return [];
  }
}

/**
 * Get signed prices for transaction execution
 */
export async function getGmxSignedPrices(): Promise<any> {
  return gmxFetch<any>('/signed_prices/latest');
}

/**
 * Get list of supported tokens
 */
export async function getGmxTokens(): Promise<any[]> {
  return gmxFetch<any[]>('/tokens');
}

/**
 * Poll for real-time price updates
 * Returns cleanup function
 */
export function subscribeToGmxPrices(
  symbols: string[],
  onUpdate: (prices: Record<string, number>) => void,
  onError?: (error: Error) => void,
  intervalMs: number = 5000  // Changed from 1s to 5s to avoid rate limiting
): () => void {
  let isActive = true;
  let consecutiveErrors = 0;
  const MAX_CONSECUTIVE_ERRORS = 3;
  
  const poll = async () => {
    if (!isActive) return;
    
    try {
      const tickers = await getGmxTickers();
      const prices: Record<string, number> = {};
      
      for (const symbol of symbols) {
        const ticker = tickers.find(t => t.tokenSymbol === symbol);
        if (ticker) {
          const minPrice = parseFloat(ticker.minPrice) / 1e30;
          const maxPrice = parseFloat(ticker.maxPrice) / 1e30;
          prices[`${symbol}/USD`] = (minPrice + maxPrice) / 2;
        }
      }
      
      // Reset error count on success
      consecutiveErrors = 0;
      onUpdate(prices);
    } catch (error) {
      consecutiveErrors++;
      console.error(`GMX price poll failed (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}):`, error);
      
      // Notify error handler after multiple consecutive failures
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS && onError) {
        onError(new Error(`GMX API unavailable after ${MAX_CONSECUTIVE_ERRORS} attempts`));
      }
    }
    
    if (isActive) {
      // Add jitter to prevent thundering herd (±20% variance)
      const jitter = intervalMs * (0.9 + Math.random() * 0.2);
      setTimeout(poll, jitter);
    }
  };
  
  poll();
  
  return () => {
    isActive = false;
  };
}
