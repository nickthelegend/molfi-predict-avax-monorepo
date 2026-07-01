import type { PredictSide } from "@/lib/predict/instruments";
import { payoutMultiplier } from "./featured-market-utils";

export type TradeOrderType = "market" | "limit";

const sideCtaLabel: Record<PredictSide, string> = {
  up: "Up",
  down: "Down",
  range: "Range",
};

export function tradeActionLabel(
  side: PredictSide,
  orderType: TradeOrderType,
  lastAskPremium: number | bigint | null | undefined,
): string {
  const sideLabel = sideCtaLabel[side];
  if (orderType === "limit") {
    return `Place ${sideLabel} limit`;
  }

  const multiplier = payoutMultiplier(lastAskPremium);
  return multiplier ? `${sideLabel} ${multiplier}` : sideLabel;
}

export function tradeCtaLabel(args: {
  side: PredictSide;
  orderType: TradeOrderType;
  needsDeposit: boolean;
  lastAskPremium: number | bigint | null | undefined;
}): string {
  if (args.needsDeposit) {
    return "Deposit funds to trade";
  }
  return tradeActionLabel(args.side, args.orderType, args.lastAskPremium);
}

/** True when the chosen source must fund the margin before the trade can open. */
export function tradeNeedsDeposit(args: {
  marginUsd: number;
  availableQuoteBalance?: number | null;
  walletQuoteBalance?: number | null;
}): boolean {
  const available = args.availableQuoteBalance ?? args.walletQuoteBalance ?? null;
  if (args.marginUsd <= 0) return false;
  if (available == null) return false;
  return available + 1e-6 < args.marginUsd;
}
