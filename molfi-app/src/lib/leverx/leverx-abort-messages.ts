/**
 * Human-readable messages for LeverX on-chain abort codes.
 * Keep in sync with `contracts/sources/errors.move` and
 * `keeper/src/lib/leverx-abort-messages.ts` (identical copy).
 */

export type MoveAbortContext = {
  code: number;
  module?: string;
  functionName?: string;
};

/** Default message per `leverx::errors` abort code. */
export const LEVERX_ABORT_MESSAGES: Readonly<Record<number, string>> = {
  1: "This action can only be performed by the wallet that owns this trading account.",
  2: "Trading is paused for new opens and limit fills. You can still close, repay debt, and settle expired positions.",
  3: "Amount must be greater than zero.",
  4: "Contract quantity must be greater than zero.",
  5: "Leverage is outside the allowed range (1×–10×).",
  6: "Insufficient dUSDC in your trading account for this action. Deposit more or reduce size.",
  7: "The vault does not have enough idle liquidity for this operation.",
  8: "This app build is linked to a different DeepBook Predict deployment. Refresh and try again.",
  9: "This trading account is linked to a different settlement account. Refresh your portfolio and try again.",
  11: "Repayment exceeds outstanding borrow on this market key.",
  12: "A resting limit order is still active on this key. Cancel it or wait for expiry first.",
  17: "Your wallet isn't authorized to act on this trading account. Refresh your portfolio and try again.",
  18: "Position health is above the liquidation threshold — it cannot be liquidated.",
  19: "The oracle has not settled yet. Wait for settlement, then use Settle expired.",
  20: "No take-profit or stop-loss rules are set for this market.",
  21: "Redemption proceeds do not cover the required vault repayment.",
  22: "Flash-loan repayment does not match the borrowed amount plus fee.",
  23: "Mint cost exceeds your leveraged position size. Try a smaller deposit, lower leverage, or a better price.",
  25: "Live contract price does not meet your limit. Raise the limit or switch to a resting order.",
  26: "Market moved beyond your slippage tolerance before the trade executed. Try again or increase slippage.",
  27: "Contract price is outside DeepBook Predict's tradable range (1¢–99¢). Try another strike or wait for updated prices.",
  28: "Invalid order type for this action.",
  29: "No resting limit order was found for this market.",
  30: "Live contract price is outside your limit ± price tolerance. Set a limit closer to market or widen tolerance.",
  31: "A limit order with this ID already exists on this key.",
  32: "Slippage exceeds the maximum allowed (50%). Lower slippage and try again.",
  33: "This limit order has expired.",
  34: "Limit order expiry must be in the future and before the market expires.",
  35: "Protocol fee collector balance is insufficient for this operation.",
  36: "Vault object does not match the protocol registry.",
  37: "Fee collector object does not match the protocol registry.",
  41: "Margin must be between 0.1 and 100 dUSDC.",
  42: "Leverage above 1× is blocked in the final hour before this market expires.",
  43: "This action requires the market to have expired.",
  44: "The oracle has already settled. Close or settle the position instead of trading live.",
  45: "Position is underwater — it must be liquidated instead of force-deleveraged.",
  46: "This key has no vault borrow (already 1× or debt was repaid).",
  47: "Force deleverage only runs in the final hour before market expiry.",
  48: "This action is only available after the market has expired.",
  49: "Invalid liquidation threshold configuration.",
  50: "Take-profit or stop-loss threshold was not met at the current market bid.",
  51: "Projected position health is below the protocol liquidation threshold. Lower leverage, add margin, or wait for a better price.",
  52: "Protocol keeper address is not configured on-chain.",
  53: "The trading service isn't authorized for this action right now. Try again shortly.",
  55: "Final trading window configuration is invalid.",
  56: "Contracts are still open on this market key. Close or settle before recovering stranded quote.",
  57: "Recovery amount exceeds the quote balance held in the settlement account.",
};

const FUNCTION_HINTS: Readonly<Record<string, string>> = {
  assert_market_slippage: LEVERX_ABORT_MESSAGES[26]!,
  assert_premium_within_bounds: LEVERX_ABORT_MESSAGES[27]!,
  assert_placement_price_aligned: LEVERX_ABORT_MESSAGES[30]!,
  slippage_exceeded: LEVERX_ABORT_MESSAGES[26]!,
  mint_cost_exceeds_position: LEVERX_ABORT_MESSAGES[23]!,
  limit_price_not_met: LEVERX_ABORT_MESSAGES[25]!,
  leveraged_mint_outside_window: LEVERX_ABORT_MESSAGES[42]!,
  force_deleverage_outside_window: LEVERX_ABORT_MESSAGES[47]!,
  open_health_below_liquidation: LEVERX_ABORT_MESSAGES[51]!,
  trading_paused: LEVERX_ABORT_MESSAGES[2]!,
  oracle_not_settled: LEVERX_ABORT_MESSAGES[19]!,
  oracle_already_settled: LEVERX_ABORT_MESSAGES[44]!,
  not_owner: LEVERX_ABORT_MESSAGES[1]!,
  not_authorized: LEVERX_ABORT_MESSAGES[17]!,
  invalid_manager: LEVERX_ABORT_MESSAGES[9]!,
  not_keeper: LEVERX_ABORT_MESSAGES[53]!,
};

const PREDICT_MANAGER_INSUFFICIENT_CONTRACTS =
  "Your account does not hold enough contracts for this market. Refresh your portfolio — the position may already be settled.";

const PREDICT_INVALID_OWNER =
  "The trade could not be completed on your account. Refresh your portfolio and try again in a moment.";

function extractAbortCode(error: string): number | null {
  const subStatus = error.match(/sub_status:\s*Some\((\d+)\)/)?.[1];
  if (subStatus) return Number(subStatus);

  const trailing = error.match(/,\s*(\d+)\)(?:\s*$|\s*[,}])/);
  if (trailing) return Number(trailing[1]);

  return null;
}

function extractModule(error: string): string | undefined {
  const identifier = error.match(/name:\s*Identifier\("([^"]+)"\)/)?.[1];
  if (identifier) return identifier.toLowerCase();

  const path = error.match(/::([a-z_][a-z0-9_]*)::[a-z_][a-z0-9_]*/i)?.[1];
  return path?.toLowerCase();
}

function extractFunctionName(error: string): string | undefined {
  const named = error.match(/function_name:\s*Some\("([^"]+)"\)/)?.[1];
  if (named) return named;

  const pathFn = error.match(/::([a-z_][a-z0-9_]*)$/i)?.[1];
  return pathFn;
}

/** Parse Sui devInspect / execution error strings for Move abort metadata. */
export function parseMoveAbort(error: string): MoveAbortContext | null {
  const code = extractAbortCode(error);
  if (code == null || !Number.isFinite(code)) return null;

  return {
    code,
    module: extractModule(error),
    functionName: extractFunctionName(error),
  };
}

function messageForCode(ctx: MoveAbortContext, raw: string): string | undefined {
  const { code, module, functionName } = ctx;

  if (code === 1) {
    if (
      module === "predict_manager" ||
      raw.includes("decrease_position") ||
      raw.includes("predict_manager")
    ) {
      return PREDICT_MANAGER_INSUFFICIENT_CONTRACTS;
    }
    if (module === "user_proxy" || module === "trade" || module === "triggers") {
      return LEVERX_ABORT_MESSAGES[1];
    }
  }

  if (code === 7) {
    if (raw.includes("borrow_flash_liquidity")) {
      return "Vault idle liquidity is too low for a flash loan right now.";
    }
    if (module === "leverage_vault" || raw.includes("withdraw_liquidity")) {
      return "Vault does not have enough liquidity to honor this withdrawal.";
    }
    return LEVERX_ABORT_MESSAGES[7];
  }

  if (functionName && FUNCTION_HINTS[functionName]) {
    return FUNCTION_HINTS[functionName];
  }

  for (const [fn, message] of Object.entries(FUNCTION_HINTS)) {
    if (raw.includes(fn)) return message;
  }

  return LEVERX_ABORT_MESSAGES[code];
}

/** Map a raw on-chain error string to a user-facing message, or null if not a Move abort. */
export function describeLeverxAbort(error: string): string | null {
  const raw = error.trim();
  if (!raw) return null;

  if (raw.includes("EInvalidOwner") || raw.includes("invalid_owner")) {
    return PREDICT_INVALID_OWNER;
  }

  const ctx = parseMoveAbort(raw);
  if (!ctx) return null;

  return messageForCode(ctx, raw) ?? `On-chain transaction rejected (error ${ctx.code}).`;
}
