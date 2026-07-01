/** Predict public server — https://docs.sui.io/onchain-finance/deepbook-predict/contract-information */

/** Row from `GET /predicts/:predict_id/oracles` (OracleInfo). */
export interface PredictOracleSummary {
  predict_id?: string;
  oracle_id: string;
  oracle_cap_id?: string;
  underlying_asset?: string;
  expiry?: number;
  min_strike?: number;
  tick_size?: number;
  status?: string;
  activated_at?: number | null;
  settlement_price?: number | null;
  settled_at?: number | null;
  created_checkpoint?: number;
}

export interface PredictOraclesResponse {
  oracles?: PredictOracleSummary[];
}

export interface PredictOracleState {
  oracle_id: string;
  underlying_asset?: string;
  expiry?: number;
  spot_price?: number;
  status?: string;
}

/** Parsed `GET /oracles/:id/state` plus list-row fields when available. */
export interface PredictOracleDetail extends PredictOracleState {
  predict_id?: string;
  oracle_cap_id?: string;
  min_strike?: number;
  tick_size?: number;
  activated_at?: number | null;
  settlement_price?: number;
  settled_at?: number | null;
  created_checkpoint?: number;
  latest_price_at?: number;
}

/** `GET /predicts/:predict_id/state` */
export interface PredictState {
  predict_id?: string;
  pricing?: unknown;
  risk?: unknown;
  trading_paused?: boolean | null;
  quote_assets?: string[];
}

export interface PredictServerStatus {
  status?: string;
  latest_onchain_checkpoint?: number;
  max_checkpoint_lag?: number;
  max_time_lag_seconds?: number;
}

/** `GET /predicts/:predict_id/vault/summary` */
export interface PredictVaultSummary {
  predict_id?: string;
  quote_assets?: string[];
  vault_balance?: number;
  vault_value?: number;
  total_mtm?: number;
  total_max_payout?: number;
  available_liquidity?: number;
  available_withdrawal?: number;
  plp_total_supply?: number;
  plp_share_price?: number;
  utilization?: number;
  max_payout_utilization?: number;
  net_deposits?: number;
  total_supplied?: number;
  total_withdrawn?: number;
}

export interface PredictVaultPerformancePoint {
  timestamp_ms: number;
  share_price: number;
  vault_value: number;
  total_shares: number;
}

export interface PredictVaultPerformance {
  predict_id?: string;
  range?: string;
  points?: PredictVaultPerformancePoint[];
}

/** `GET /managers/:manager_id/summary` */
export interface PredictManagerSummary {
  manager_id?: string;
  owner?: string;
  trading_balance?: number;
  open_exposure?: number;
  redeemable_value?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  account_value?: number;
  open_positions?: number;
  awaiting_settlement_positions?: number;
  balances?: { quote_asset?: string; balance?: number }[];
}

/** Row from `GET /managers/:manager_id/positions/summary` */
export interface PredictManagerPositionSummary {
  predict_id?: string;
  manager_id?: string;
  quote_asset?: string;
  oracle_id?: string;
  underlying_asset?: string;
  expiry?: number;
  strike?: number;
  is_up?: boolean;
  minted_quantity?: number;
  redeemed_quantity?: number;
  open_quantity?: number;
  total_cost?: number;
  total_payout?: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  open_cost_basis?: number;
  average_entry_price?: number;
  average_exit_price?: number;
  mark_price?: number | null;
  mark_value?: number | null;
  status?: string;
  first_minted_at?: number;
  last_activity_at?: number;
}

export interface PredictManagerPnlPoint {
  timestamp_ms: number;
  realized_pnl?: number;
  cumulative_realized_pnl?: number;
}

export interface PredictManagerPnl {
  manager_id?: string;
  range?: string;
  series_type?: string;
  points?: PredictManagerPnlPoint[];
  current_unrealized_pnl?: number;
  current_total_pnl?: number;
}

/** Raw price update from predict-server history endpoints. */
export interface PredictOraclePriceUpdate {
  oracle_id?: string;
  spot?: number;
  forward?: number;
  checkpoint_timestamp_ms?: number;
  onchain_timestamp?: number;
}

export interface PredictLpSupplyEvent {
  predict_id?: string;
  supplier?: string;
  quote_asset?: string;
  amount?: number;
  shares_minted?: number;
  checkpoint_timestamp_ms?: number;
}

export interface PredictLpWithdrawalEvent {
  predict_id?: string;
  withdrawer?: string;
  quote_asset?: string;
  amount?: number;
  shares_burned?: number;
  checkpoint_timestamp_ms?: number;
}
