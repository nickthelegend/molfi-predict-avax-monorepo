/** Client-side trade intent message builders (must match keeper/src/trade/trade-message.ts). */

export const TRADE_MINT_MESSAGE_PREFIX = "leverx:trade:mint:v1";
export const TRADE_REDEEM_MESSAGE_PREFIX = "leverx:trade:redeem:v1";
export const TRADE_SETTLE_MESSAGE_PREFIX = "leverx:trade:settle:v1";
export const TRADE_RECOVER_MANAGER_MESSAGE_PREFIX = "leverx:trade:recover_manager:v1";

export const TRADE_INTENT_TTL_MS = 5 * 60_000;

export type MintOrderKind = "market" | "limit";
export type RedeemMode = "market" | "limit";

export type MarketKeyIntentFields = {
  oracleId: string;
  expiryMs: number;
  strike: number;
  higherStrike: number;
  isUp: boolean;
  isRange: boolean;
};

export type MintIntentFields = MarketKeyIntentFields & {
  address: string;
  accountId: string;
  predictManagerId: string;
  expiresAtMs: number;
  marginQuoteAtoms: bigint;
  leverageBps: bigint;
  quantity: bigint;
  maxMintCost: bigint;
  marketSlippageBps: number;
  remintAfterDeleverage: boolean;
  /** `market` immediate fill or `limit` immediate marketable-limit fill. */
  orderKind: MintOrderKind;
  /** Limit premium (raw per-unit) — only used when `orderKind === "limit"`. */
  limitPremiumPerUnit: bigint;
  /** Placement slippage bps — only used when `orderKind === "limit"`. */
  placementSlippageBps: number;
};

export type RedeemIntentFields = MarketKeyIntentFields & {
  address: string;
  accountId: string;
  predictManagerId: string;
  expiresAtMs: number;
  quantity: bigint;
  minPayout: bigint;
  /** `market` redeem or `limit` (marketable) redeem. */
  redeemMode: RedeemMode;
  /** Minimum premium per unit — only used when `redeemMode === "limit"`. */
  minPremiumPerUnit: bigint;
};

export type SettleIntentFields = MarketKeyIntentFields & {
  address: string;
  accountId: string;
  predictManagerId: string;
  expiresAtMs: number;
  quantity: bigint;
};

export type RecoverManagerIntentFields = MarketKeyIntentFields & {
  address: string;
  accountId: string;
  predictManagerId: string;
  expiresAtMs: number;
  managerQuoteAtoms: bigint;
};

function encodeBool(value: boolean): string {
  return value ? "true" : "false";
}

export function tradeIntentExpiryMs(nowMs = Date.now(), ttlMs = TRADE_INTENT_TTL_MS): number {
  return nowMs + ttlMs;
}

export function buildMintIntentMessage(fields: MintIntentFields): Uint8Array {
  const lines = [
    TRADE_MINT_MESSAGE_PREFIX,
    `address=${fields.address.trim().toLowerCase()}`,
    `account_id=${fields.accountId.trim().toLowerCase()}`,
    `predict_manager_id=${fields.predictManagerId.trim().toLowerCase()}`,
    `expires_ms=${fields.expiresAtMs}`,
    `oracle_id=${fields.oracleId.trim().toLowerCase()}`,
    `market_expiry_ms=${fields.expiryMs}`,
    `strike=${fields.strike}`,
    `higher_strike=${fields.higherStrike}`,
    `is_up=${encodeBool(fields.isUp)}`,
    `is_range=${encodeBool(fields.isRange)}`,
    `margin_quote_atoms=${fields.marginQuoteAtoms.toString()}`,
    `leverage_bps=${fields.leverageBps.toString()}`,
    `quantity=${fields.quantity.toString()}`,
    `max_mint_cost=${fields.maxMintCost.toString()}`,
    `market_slippage_bps=${fields.marketSlippageBps}`,
    `remint_after_deleverage=${encodeBool(fields.remintAfterDeleverage)}`,
    `order_kind=${fields.orderKind}`,
    `limit_premium_per_unit=${fields.limitPremiumPerUnit.toString()}`,
    `placement_slippage_bps=${fields.placementSlippageBps}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

export function buildRedeemIntentMessage(fields: RedeemIntentFields): Uint8Array {
  const lines = [
    TRADE_REDEEM_MESSAGE_PREFIX,
    `address=${fields.address.trim().toLowerCase()}`,
    `account_id=${fields.accountId.trim().toLowerCase()}`,
    `predict_manager_id=${fields.predictManagerId.trim().toLowerCase()}`,
    `expires_ms=${fields.expiresAtMs}`,
    `oracle_id=${fields.oracleId.trim().toLowerCase()}`,
    `market_expiry_ms=${fields.expiryMs}`,
    `strike=${fields.strike}`,
    `higher_strike=${fields.higherStrike}`,
    `is_up=${encodeBool(fields.isUp)}`,
    `is_range=${encodeBool(fields.isRange)}`,
    `quantity=${fields.quantity.toString()}`,
    `min_payout=${fields.minPayout.toString()}`,
    `redeem_mode=${fields.redeemMode}`,
    `min_premium_per_unit=${fields.minPremiumPerUnit.toString()}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

export function buildSettleIntentMessage(fields: SettleIntentFields): Uint8Array {
  const lines = [
    TRADE_SETTLE_MESSAGE_PREFIX,
    `address=${fields.address.trim().toLowerCase()}`,
    `account_id=${fields.accountId.trim().toLowerCase()}`,
    `predict_manager_id=${fields.predictManagerId.trim().toLowerCase()}`,
    `expires_ms=${fields.expiresAtMs}`,
    `oracle_id=${fields.oracleId.trim().toLowerCase()}`,
    `market_expiry_ms=${fields.expiryMs}`,
    `strike=${fields.strike}`,
    `higher_strike=${fields.higherStrike}`,
    `is_up=${encodeBool(fields.isUp)}`,
    `is_range=${encodeBool(fields.isRange)}`,
    `quantity=${fields.quantity.toString()}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}

export function buildRecoverManagerIntentMessage(
  fields: RecoverManagerIntentFields,
): Uint8Array {
  const lines = [
    TRADE_RECOVER_MANAGER_MESSAGE_PREFIX,
    `address=${fields.address.trim().toLowerCase()}`,
    `account_id=${fields.accountId.trim().toLowerCase()}`,
    `predict_manager_id=${fields.predictManagerId.trim().toLowerCase()}`,
    `expires_ms=${fields.expiresAtMs}`,
    `oracle_id=${fields.oracleId.trim().toLowerCase()}`,
    `market_expiry_ms=${fields.expiryMs}`,
    `strike=${fields.strike}`,
    `higher_strike=${fields.higherStrike}`,
    `is_up=${encodeBool(fields.isUp)}`,
    `is_range=${encodeBool(fields.isRange)}`,
    `manager_quote_atoms=${fields.managerQuoteAtoms.toString()}`,
  ];
  return new TextEncoder().encode(lines.join("\n"));
}
