/**
 * local-backend.ts
 * =================
 * Typed client for the Molfi backend running at http://localhost:4000
 * (or VITE_LOCAL_BACKEND_URL in production).
 *
 * This is the frontend's interface to the off-chain ledger: balance, positions,
 * markets, settlements, and withdrawals.  It should NOT be used for raw market
 * price feeds — those come from the public api.molfi.com aggregator.
 */

const BASE =
  (import.meta.env.VITE_LOCAL_BACKEND_URL as string | undefined) ??
  "http://localhost:4000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  walletAddress?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(walletAddress ? { "x-wallet-address": walletAddress } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let errBody: any = {};
    try {
      errBody = await res.json();
    } catch { /* response body may not be JSON */ }
    const message = errBody?.error ?? errBody?.message ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LedgerBalance {
  available: number;
  locked: number;
  total: string | number;
}

export interface PositionResponse {
  positionId: string;
  status: "PENDING_MATCH" | "OPEN" | "CLOSED" | "SETTLED";
  side: "YES" | "NO";
  amount: number;
  marketId: string;
}

export interface WithdrawalResponse {
  requestId: string;
  status: string;
  tx_hash?: string;
}

export interface MolfiMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'resolved' | 'expired';
  yes_price: number;
  no_price: number;
  volume_24h: number;
  liquidity: number;
  expires_at: string;
  accepting_orders: boolean;
}

export interface MarketResponse {
  id: string;
  venueId: string;
  title: string;
  status: string;
  winner?: string;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const localBackend = {
  /** Health check */
  health(): Promise<{ status: string; node: string }> {
    return request("/health");
  },

  // ── Balance ────────────────────────────────────────────────────────────────

  /** Fetch the ledger balance for a wallet address */
  getBalance(walletAddress: string): Promise<LedgerBalance> {
    return request<LedgerBalance>(`/api/balance/${encodeURIComponent(walletAddress)}`);
  },

  // ── Positions ─────────────────────────────────────────────────────────────

  /**
   * Open a new YES or NO position on a market.
   * The backend deducts `amount` USDC from the user's available balance.
   */
  openPosition(params: {
    walletAddress: string;
    marketId: string;
    side: "YES" | "NO";
    amount: number;  // USDC value
  }): Promise<PositionResponse> {
    return request<PositionResponse>(
      "/api/positions",
      {
        method: "POST",
        body: JSON.stringify({
          marketId: params.marketId,
          side: params.side,
          amount: params.amount,
        }),
      },
      params.walletAddress,
    );
  },

  /** List all positions for a wallet address */
  getPositions(walletAddress: string): Promise<PositionResponse[]> {
    return request<PositionResponse[]>(
      `/api/positions?walletAddress=${encodeURIComponent(walletAddress)}`,
    );
  },

  // ── Markets ────────────────────────────────────────────────────────────────

  /** Get a single market by ID */
  getMarket(marketId: string): Promise<MarketResponse> {
    return request<MarketResponse>(`/api/molfi/markets/${encodeURIComponent(marketId)}`);
  },

  /** List active Molfi markets (canonical markets the frontend trades against) */
  listMarkets(params?: { status?: string; limit?: number }): Promise<MolfiMarket[]> {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit)  qs.set('limit',  String(params.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{ markets: MolfiMarket[] }>(`/api/molfi/markets${suffix}`)
      .then((r) => r.markets ?? []);
  },

  /** Resolve a market.  Admin only. */
  resolveMarket(
    marketId: string,
    outcome: "YES" | "NO",
    adminKey: string,
  ): Promise<MarketResponse> {
    return request<MarketResponse>(
      `/api/molfi/markets/${encodeURIComponent(marketId)}/resolve`,
      {
        method: "PATCH",
        body: JSON.stringify({ outcome }),
        headers: { "x-admin-key": adminKey },
      },
    );
  },

  // ── Withdrawals ───────────────────────────────────────────────────────────

  /**
   * Request an on-chain withdrawal via the vault.
   * Uses Path 3 (x-wallet-address header) which calls `requestAndProcess()`
   * and attempts the vault transfer immediately.
   */
  requestWithdrawal(params: {
    walletAddress: string;
    amount: string;     // USDC string, e.g. "50"
    destinationAddress: string;
  }): Promise<WithdrawalResponse> {
    return request<WithdrawalResponse>(
      "/api/withdrawals/request",
      {
        method: "POST",
        body: JSON.stringify({
          amount: params.amount,
          destinationAddress: params.destinationAddress,
        }),
      },
      params.walletAddress,
    );
  },

  // ── Settlement (admin) ────────────────────────────────────────────────────

  /** Trigger settlement payout for a specific market.  Admin only. */
  triggerSettlement(
    marketId: string,
    adminKey: string,
  ): Promise<{ totalPositions: number; winners: number; totalPayout: number }> {
    return request(
      `/api/scheduler/trigger/settle/${encodeURIComponent(marketId)}`,
      {
        method: "POST",
        headers: { "x-admin-key": adminKey },
      },
    );
  },
};
