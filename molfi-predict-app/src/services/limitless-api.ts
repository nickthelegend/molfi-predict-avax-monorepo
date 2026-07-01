/**
 * Limitless Exchange API Service
 * Uses Supabase Edge Function proxy to avoid CORS issues
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BASE_URL = `${SUPABASE_URL}/functions/v1/limitless-proxy`;

export interface LimitlessMarket {
  id: number;
  address: string;
  conditionId: string;
  title: string;
  description?: string;
  collateralToken: {
    address: string;
    decimals: number;
    symbol: string;
  };
  creator: {
    name: string;
    imageURI?: string;
    link?: string;
  };
  prices: [number, number]; // [yes, no]
  categories: string[];
  tags: string[];
  status: string;
  expired: boolean;
  expirationDate: string;
  expirationTimestamp: number;
  volume: string;
  volumeFormatted: string;
  openInterest: string;
  openInterestFormatted: string;
  liquidity: string;
  liquidityFormatted: string;
  tradeType: string;
  marketType: string;
  slug: string;
  feedEvents?: any[];
}

export interface LimitlessMarketsResponse {
  data: LimitlessMarket[];
  totalMarketsCount: number;
}

class LimitlessApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Limitless API request failed:', error);
      throw error;
    }
  }

  /**
   * Get active markets with pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 10)
   * @param sortBy Sort option: 'newest', 'volume', 'liquidity' (default: 'newest')
   * @param categoryId Optional category filter
   */
  async getActiveMarkets(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'newest',
    categoryId?: number
  ): Promise<LimitlessMarketsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
    });

    const endpoint = categoryId 
      ? `/markets/active/${categoryId}?${params}`
      : `/markets/active?${params}`;

    return this.request<LimitlessMarketsResponse>(endpoint);
  }

  /**
   * Get market details by address or slug
   */
  async getMarket(addressOrSlug: string): Promise<LimitlessMarket> {
    return this.request<LimitlessMarket>(`/markets/${addressOrSlug}`);
  }

  /**
   * Get active market count per category
   */
  async getCategoryCounts(): Promise<{
    category: Record<string, number>;
    totalCount: number;
  }> {
    return this.request(`/markets/categories/count`);
  }

  /**
   * Search markets by query
   */
  async searchMarkets(query: string, limit: number = 20): Promise<LimitlessMarketsResponse> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    });
    return this.request<LimitlessMarketsResponse>(`/markets/search?${params}`);
  }
}

export const limitlessApi = new LimitlessApiService();

/**
 * WebSocket connection for real-time market updates
 */
export class LimitlessWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${SUPABASE_URL.replace('https://', 'wss://')}/functions/v1/limitless-proxy`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        const eventType = data.type || data.event;
        const listeners = this.listeners.get(eventType);
        
        if (listeners) {
          listeners.forEach(callback => callback(data));
        }
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed, reconnecting in 5s...');
      setTimeout(() => this.connect(), 5000);
    };
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const limitlessWs = new LimitlessWebSocket();
