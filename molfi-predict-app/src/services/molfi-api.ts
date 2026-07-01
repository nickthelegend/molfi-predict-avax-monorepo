/**
 * Molfi API Service v2
 * Official API integration for Molfi Protocol
 * Base URL: https://api.molfi.com
 * Last Updated: February 8, 2026
 */

const BASE_URL = 'https://api.molfi.com';

// ============= Market Types =============

export interface MolfiMarket {
  id: string;
  venue: 'limitless' | 'polymarket' | 'molfi';
  title: string;
  description?: string;
  category: string;
  status: 'active' | 'resolved' | 'expired';
  current_price?: number | null;
  yes_price: number;
  no_price: number;
  volume_24h: number;
  volume_total: number;
  liquidity: number;
  open_interest: number;
  num_trades_24h: number;
  num_traders: number;
  resolution_date?: string | null;
  resolved_outcome?: string | null;
  trending_score: number;
  price_change_24h: number;
  volume_velocity: number;
  image_url?: string | null;
  external_url?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  synced_at: string;
  group_id?: string | null;
  outcome_type: string;
  outcomes?: Array<{ id: string; label: string; price: number; volume: number }> | null;
  venue_market_id: string;
  market_url: string;
  expires_at: string;
  resolved_at?: string | null;
  winning_outcome?: string | null;
  accepting_orders: boolean;
  min_order_size: number;
  tick_size: number;
}

export interface ListMarketsResponse {
  success: boolean;
  markets: MolfiMarket[];
  total: number;
  limit: number;
  offset: number;
}

// ============= Leverage Types =============

export interface LeveragePosition {
  position_id: string;
  user_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  margin: number;
  leverage: number;
  size: number;
  entry_price: number;
  liquidation_price: number;
  current_pnl?: number;
  close_price?: number;
  realized_pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  opened_at: string;
  closed_at?: string | null;
}

export interface LiquidationCalcResponse {
  liquidationPrice: number;
  margin: number;
  positionSize: number;
  maxLoss: number;
}

// ============= Leaderboard & Copy Trading Types =============

export interface LeaderboardEntry {
  user_id: string;
  rank: number;
  total_pnl: number;
  roi: number;
  win_rate: number;
  total_trades: number;
  followers: number;
  badge: string;
}

export interface CopyTradeRelationship {
  id: string;
  follower_id: string;
  leader_id: string;
  allocation_percentage: number;
  max_position_size: number;
  status: 'active' | 'paused';
  total_copied_trades?: number;
  total_pnl?: number;
  created_at: string;
  paused_at?: string | null;
}

export interface CopyTradeExecution {
  execution_id: string;
  leader_position_id: string;
  follower_position_id: string;
  market_id: string;
  side: 'YES' | 'NO';
  leader_size: number;
  follower_size: number;
  execution_price: number;
  executed_at: string;
}

// ============= Balance Types =============

export interface UserBalance {
  user_id: string;
  total_balance: number;
  available_balance: number;
  locked_balance: number;
  pending_deposits: number;
  pending_withdrawals: number;
}

// ============= Position Types =============

export interface Position {
  position_id: string;
  market_id: string;
  type: 'LEVERAGE' | 'SPOT';
  side: 'YES' | 'NO';
  size: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  realized_pnl?: number;
  status: 'OPEN' | 'CLOSED' | 'LIQUIDATED';
  opened_at?: string;
  closed_at?: string | null;
  venue?: string;
}

export interface TransactionRecord {
  id: string;
  user_id: string;
  type: string;         // 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL' | 'FEE' | 'PNL' | ...
  amount: string;       // string from DB numeric
  reference_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ============= Price Feed Types =============

export interface PriceResponse {
  success: boolean;
  product_id: string;
  price: number;
  source: string;
  timestamp: string;
}

// ============= Oracle Types =============

export interface OracleData {
  market_id: string;
  resolution_value: boolean;
  resolution_source: string;
  confidence: number;
  resolved_at: string;
}

// ============= Withdrawal Types =============

export interface Withdrawal {
  withdrawal_id: string;
  user_id?: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  tx_hash?: string;
  initiated_at?: string;
  estimated_completion?: string;
  completed_at?: string;
}

// ============= Health Types =============

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}

export interface WebSocketHealthResponse {
  status: string;
  server: { isRunning: boolean; port: number };
  metrics: {
    activeConnections: number;
    totalConnectionsAccepted: number;
    totalMessagesReceived: number;
    totalMessagesSent: number;
    totalBroadcasts: number;
  };
  clobClient: { connected: boolean; lastMessageTime: string };
  timestamp: string;
}

// ============= Error Types =============

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

// ============= API Service =============

class MolfiApiService {
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
        const errorBody = await response.json().catch(() => null);
        const msg = errorBody?.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`API Error: ${msg}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Molfi API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============= Health & Monitoring =============

  async healthCheck(): Promise<HealthResponse> {
    return this.request('/health');
  }

  async websocketHealth(): Promise<WebSocketHealthResponse> {
    return this.request('/health/websocket');
  }

  async websocketStats(): Promise<{ activeConnections: number; totalMessagesReceived: number; totalMessagesSent: number }> {
    return this.request('/api/websocket/stats');
  }

  // ============= Volume Normalization =============

  /**
   * Note: Backend (LimitlessConnector.ts) already converts USDC to USD.
   * No additional normalization needed in frontend.
   */
  private normalizeMarketVolumes(market: MolfiMarket): MolfiMarket {
    // Backend already handles USDC -> USD conversion (/ 1e6)
    // Just pass through without modification
    return market;
  }

  // ============= Markets =============

  /** List aggregated markets from all venues */
  async listAggregatedMarkets(params?: {
    limit?: number;
    offset?: number;
    venue?: 'limitless' | 'polymarket' | 'molfi';
    category?: string;
    status?: 'active' | 'resolved' | 'expired';
    q?: string;
  }): Promise<ListMarketsResponse> {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) q.append(k, v.toString());
      });
    }
    const res = await this.request<ListMarketsResponse>(`/api/aggregated${q.toString() ? `?${q}` : ''}`);
    return {
      ...res,
      markets: (res.markets || []).map(m => this.normalizeMarketVolumes(m)),
    };
  }

  /** List Molfi-native markets only */
  async listNativeMarkets(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: 'active' | 'resolved' | 'expired';
  }): Promise<ListMarketsResponse> {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) q.append(k, v.toString());
      });
    }
    return this.request<ListMarketsResponse>(`/api/markets${q.toString() ? `?${q}` : ''}`);
  }

  // ============= Leverage Trading =============

  async calculateLiquidation(params: {
    side: 'YES' | 'NO';
    entryPrice: number;
    leverage: number;
  }): Promise<LiquidationCalcResponse> {
    return this.request('/api/leverage/calculate-liquidation', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getLeveragePositions(userId: string): Promise<{ success: boolean; positions: LeveragePosition[] }> {
    return this.request(`/api/leverage/positions?userId=${encodeURIComponent(userId)}`);
  }

  async openLeveragePosition(params: {
    userId: string;
    marketId: string;
    side: 'YES' | 'NO';
    margin: number;
    leverage: number;
  }): Promise<{ success: boolean; position: LeveragePosition }> {
    return this.request('/api/leverage/positions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async closeLeveragePosition(positionId: string, userId: string): Promise<{ success: boolean; position: LeveragePosition }> {
    return this.request(`/api/leverage/positions/${positionId}/close`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ============= Leaderboard & Copy Trading =============

  async getLeaderboard(params?: {
    sortBy?: 'pnl' | 'roi' | 'winRate';
    limit?: number;
  }): Promise<{ success: boolean; leaderboard: LeaderboardEntry[] }> {
    const q = new URLSearchParams();
    if (params?.sortBy) q.append('sortBy', params.sortBy);
    if (params?.limit) q.append('limit', params.limit.toString());
    return this.request(`/api/leaderboard${q.toString() ? `?${q}` : ''}`);
  }

  async createCopyTrade(params: {
    followerId: string;
    leaderId: string;
    allocationPercentage: number;
    maxPositionSize: number;
  }): Promise<{ success: boolean; relationship: CopyTradeRelationship }> {
    return this.request('/api/leaderboard/copy-trade/create', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async listCopyTrades(address: string): Promise<{ success: boolean; relationships: CopyTradeRelationship[] }> {
    return this.request(`/api/leaderboard/copy-trade/list/${encodeURIComponent(address)}`);
  }

  async getCopyTradeExecutions(relationshipId: string): Promise<{ success: boolean; executions: CopyTradeExecution[] }> {
    return this.request(`/api/leaderboard/copy-trade/${relationshipId}/executions`);
  }

  async pauseCopyTrade(relationshipId: string, userId: string): Promise<{ success: boolean; relationship: CopyTradeRelationship }> {
    return this.request(`/api/leaderboard/copy-trade/${relationshipId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async deleteCopyTrade(relationshipId: string, userId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/leaderboard/copy-trade/${relationshipId}`, {
      method: 'DELETE',
      body: JSON.stringify({ userId }),
    });
  }

  // ============= Balance =============

  async getBalance(userId: string): Promise<{ success: boolean; balance: UserBalance }> {
    return this.request(`/api/balance/${encodeURIComponent(userId)}`);
  }

  async lockBalance(params: {
    userId: string;
    amount: number;
    refType: string;
    refId: string;
    reason: string;
  }): Promise<{ success: boolean; locked: { amount: number; new_available: number; new_locked: number } }> {
    return this.request('/api/balance/lock', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async unlockBalance(params: {
    userId: string;
    refType: string;
    refId: string;
    reason: string;
  }): Promise<{ success: boolean; unlocked: { amount: number; new_available: number; new_locked: number } }> {
    return this.request('/api/balance/unlock', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ============= Positions =============

  async getPositions(userId: string, status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED'): Promise<{ success: boolean; positions: Position[] }> {
    const q = new URLSearchParams({ userId });
    if (status) q.append('status', status);
    return this.request(`/api/positions?${q}`);
  }

  async closePosition(positionId: string, userId: string): Promise<{ success: boolean; message?: string }> {
    return this.request(`/api/positions/${encodeURIComponent(positionId)}/close`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // ============= Transactions =============

  async getTransactions(walletAddress: string, limit = 50, offset = 0): Promise<{ transactions: TransactionRecord[] }> {
    return this.request(
      `/api/balance/${encodeURIComponent(walletAddress)}/transactions?limit=${limit}&offset=${offset}`
    );
  }

  // ============= Price Feeds =============

  async testPriceFeeds(): Promise<any> {
    return this.request('/api/prices/test');
  }

  async getPrice(productId: string, source?: 'coinbase' | 'kraken'): Promise<PriceResponse> {
    const q = source ? `?source=${source}` : '';
    return this.request(`/api/prices/${encodeURIComponent(productId)}${q}`);
  }

  // ============= Oracle =============

  async getOracleData(marketId: string): Promise<{ success: boolean; oracle_data: OracleData }> {
    return this.request(`/api/oracle/${encodeURIComponent(marketId)}`);
  }

  // ============= Withdrawals =============

  async initiateWithdrawal(params: {
    userId: string;
    amount: number;
    destinationAddress: string;
  }): Promise<{ success: boolean; withdrawal: Withdrawal }> {
    return this.request('/api/withdrawals/initiate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getWithdrawalStatus(withdrawalId: string): Promise<{ success: boolean; withdrawal: Withdrawal }> {
    return this.request(`/api/withdrawals/${encodeURIComponent(withdrawalId)}`);
  }
}

// Export singleton
export const molfiApi = new MolfiApiService();
