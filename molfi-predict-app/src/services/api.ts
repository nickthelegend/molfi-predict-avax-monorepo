/**
 * Legacy API Service - Now delegates to molfi-api.ts
 * Kept for backward compatibility with existing imports.
 */
import { molfiApi, type MolfiMarket, type ListMarketsResponse } from '@/services/molfi-api';

const API_BASE_URL = 'https://api.molfi.com';

class ApiService {
  private baseUrl = API_BASE_URL;

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);
    return response.json();
  }

  // ============= Market Discovery (delegates to molfiApi) =============

  async getMarkets(filters?: any, sort?: any, pagination?: any) {
    return molfiApi.listAggregatedMarkets({
      venue: filters?.venue?.[0]?.toLowerCase(),
      status: filters?.status?.[0],
      category: filters?.category?.[0],
      limit: pagination?.limit ?? 50,
      offset: 0,
    });
  }

  async getTrendingMarkets(limit = 10) {
    const res = await molfiApi.listAggregatedMarkets({ limit });
    return res.markets;
  }

  async searchMarkets(query: string) {
    const res = await molfiApi.listAggregatedMarkets({ limit: 100 });
    const q = query.toLowerCase();
    return res.markets.filter(m =>
      m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q)
    );
  }

  async getSearchSuggestions(_query: string) {
    return []; // Not available in v2
  }

  // ============= Market Details =============

  async getMarketById(marketId: string) {
    // Fetch all and find - v2 doesn't have a single-market GET on /api/aggregated
    const res = await molfiApi.listAggregatedMarkets({ limit: 200 });
    return res.markets.find(m => m.id === marketId) ?? null;
  }

  async getMarketStats(marketId: string) {
    return this.request(`/api/oracle/${marketId}`);
  }

  // ============= Trading Data =============

  async getOrderbook(_marketId: string) {
    return { bids: [], asks: [] };
  }

  async getTradeHistory(_marketId: string, _limit = 50) {
    return [];
  }

  async getOHLC(_marketId: string, _timeframe: string) {
    return [];
  }

  async getPriceDistribution(_marketId: string) {
    return [];
  }

  async getVolumeAnalytics(_marketId: string) {
    return {};
  }

  // ============= Quote & Trading =============

  async getQuote(request: any) {
    return this.request('/api/leverage/calculate-liquidation', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async buildDepositTransaction() {
    return {};
  }

  async getOrders(_userAddress: string) {
    return [];
  }

  async cancelOrder(_orderId: string) {
    return { success: true };
  }

  async getLockedBalance(userAddress: string) {
    const res = await molfiApi.getBalance(userAddress);
    return res.balance;
  }

  // ============= Portfolio =============

  async getPositions(userAddress: string) {
    const res = await molfiApi.getPositions(userAddress);
    return res.positions;
  }

  async getTransactions(userAddress: string) {
    const res = await molfiApi.getTransactions(userAddress);
    return res.transactions ?? [];
  }

  async getPortfolioSummary(userAddress: string) {
    const res = await molfiApi.getBalance(userAddress);
    return res.balance;
  }

  async getUserAnalytics(_userAddress: string) {
    return {};
  }

  // ============= Redemption =============

  async getRedemptionQuote() {
    return {};
  }

  async redeemPosition(_marketId: string) {
    return { txHash: '' };
  }

  // ============= Vault Operations (still via Supabase) =============

  async getVaults() {
    return [];
  }

  async getVaultById(_vaultId: string) {
    return {};
  }

  async getUserVaultPositions(_userAddress: string) {
    return [];
  }

  async depositToVault(_vaultId: string, _amount: number) {
    return { txHash: '' };
  }

  async withdrawFromVault(_vaultId: string, _shares: number) {
    return { txHash: '' };
  }

  async getVaultTransactions(_vaultId: string, _userAddress: string) {
    return [];
  }

  // ============= System Health =============

  async getSystemHealth() {
    const health = await molfiApi.healthCheck();
    return {
      backend: health.status === 'ok',
      relayer: true,
      chains: {} as Record<string, boolean>,
    };
  }
}

export const apiService = new ApiService();
