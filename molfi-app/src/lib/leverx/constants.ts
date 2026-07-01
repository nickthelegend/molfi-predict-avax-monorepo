/** Shared Sui system clock object. */
export const SUI_CLOCK_OBJECT_ID = "0x6";

/** DeepBook Predict premium scale (1.0 = 1e9). */
export const PREDICT_PRICE_SCALE = 1_000_000_000n;

/**
 * Quantity used when simulating per-contract ask via dev-inspect.
 * Predict mint costs are integer quote atoms; qty=1 often rounds to 0 and reads as untradeable.
 */
export const PREDICT_QUOTE_REFERENCE_QUANTITY = 1_000_000n;

/** React Query cache + poll cadence for devInspect quote simulations. */
export const DEV_INSPECT_QUOTE_STALE_MS = 15_000;
export const DEV_INSPECT_QUOTE_REFETCH_MS = 15_000;

/** DevInspect poll while waiting for the first successful on-chain read. */
export const DEV_INSPECT_HOT_POLL_INTERVAL_MS = 3_000;

/** Trading account balance devInspect (slightly less frequent than quote ticks). */
export const DEV_INSPECT_BALANCE_REFETCH_MS = 22_500;

/** Aggressive oracle poll while waiting for Predict spot (not devInspect). */
export const ORACLE_HOT_POLL_INTERVAL_MS = 2_000;

/** Headroom below leveraged position size so mint_cost <= margin + borrow on-chain. */
export const MINT_BUDGET_SAFETY_BPS = 50;

/** Quick-pick slippage options in the trade form (percent). */
export const SLIPPAGE_PRESET_PCTS = [2, 5, 10] as const;

/** Default slippage for market mint/redeem (5%). */
export const DEFAULT_SLIPPAGE_BPS = 500;

/** Default placement slippage for limit orders (5%). */
export const DEFAULT_PLACEMENT_SLIPPAGE_BPS = 500;

/** On-chain max for limit / placement slippage (`protocol_constants::max_limit_order_slippage_bps`). */
export const MAX_LIMIT_ORDER_SLIPPAGE_BPS = 5_000;
export const MAX_LIMIT_ORDER_SLIPPAGE_PCT = MAX_LIMIT_ORDER_SLIPPAGE_BPS / 100;

/** Resting limit order lifetime options (hours). */
export const LIMIT_ORDER_EXPIRY_HOURS = [1, 4, 6, 12, 24] as const;

export type LimitOrderExpiryHours = (typeof LIMIT_ORDER_EXPIRY_HOURS)[number];

export const DEFAULT_LIMIT_ORDER_EXPIRY_HOURS: LimitOrderExpiryHours = 6;

/** Leveraged mints (>1x) blocked in the final window before oracle expiry. */
/** Default final window at registry init (30 minutes). */
export const DEFAULT_FINAL_WINDOW_MS = 1_800_000;
/** Minimum admin-configurable final window (1 minute). */
export const MIN_FINAL_WINDOW_MS = 60_000;
/** Maximum admin-configurable final window (4 hours). */
export const MAX_FINAL_WINDOW_MS = 14_400_000;

/** Gas budget for simple trades. */
export const TRADE_GAS_BUDGET = 150_000_000;

/** Gas budget for onboarding (proxy + manager). */
export const ONBOARD_GAS_BUDGET = 100_000_000;
