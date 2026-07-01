import type { PositionLedgerHealthInputs, RedeemQuote } from "@/lib/leverx/quotes";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { formatAmount } from "@/lib/copy";
import { DEFAULT_LIQUIDATION_BPS, resolveHealthLabel } from "@/lib/leverx/protocol";
import { premiumRawToCents, premiumPerUnitFromMintCost } from "@/lib/leverx/trade-math";
import { coerceQuoteAtoms, scaleQuote } from "@/lib/predict/scaling";

function positionAtoms(value: unknown): bigint {
  return BigInt(coerceQuoteAtoms(value));
}

export type PositionMarkToMarket = {
  positionKey: string;
  markValueUsd: number;
  /** Quote locked on the market key (mint surplus + collateral), included in health and P&L. */
  keyQuoteUsd: number;
  /** Redeem bid value plus key-locked quote — matches on-chain liquidation collateral. */
  collateralUsd: number;
  markBidPerUnit: number | null;
  markBidCents: number | null;
  entryCostUsd: number;
  entryPremiumPerUnit: number | null;
  entryPremiumCents: number | null;
  unrealizedPnlUsd: number;
  unrealizedPnlPct: number | null;
  netEquityUsd: number;
  borrowedUsd: number;
  healthBps: number | null;
  healthLabel: "healthy" | "margin_call" | "at_risk" | "unknown";
  /** True when on-chain (or indexer fallback) vault borrow exists above 1×. */
  isLeveraged: boolean;
  isLive: boolean;
};

export function positionRowId(position: LeveragedPosition): string {
  return `${position.position_key}-${position.account_id}`;
}

/** Open indexer rows with zero quantity are stale keys — not live positions. */
export function isActiveOpenPosition(position: LeveragedPosition): boolean {
  return position.status === "open" && coerceQuoteAtoms(position.open_quantity) > 0;
}

export function isEndedPosition(position: LeveragedPosition): boolean {
  return position.status !== "open";
}

export function closePrincipalRepaidAtoms(position: LeveragedPosition): number {
  return Math.max(
    0,
    coerceQuoteAtoms(position.close_debt_repaid) - coerceQuoteAtoms(position.close_interest_paid),
  );
}

/** Peak vault borrow on this key (set at open / max over life). */
export function effectivePeakBorrowAtoms(position: LeveragedPosition): number {
  const peak = coerceQuoteAtoms(position.peak_borrow_quote);
  if (peak > 0) return peak;
  const closePrincipal = closePrincipalRepaidAtoms(position);
  const mintFundedBorrow = Math.max(
    0,
    coerceQuoteAtoms(position.mint_cost) - coerceQuoteAtoms(position.margin_quote),
  );
  return Math.max(
    coerceQuoteAtoms(position.borrow_quote),
    closePrincipal,
    mintFundedBorrow,
  );
}

/** Wallet cash sent to repay vault debt before/during close (excludes borrow repaid from redeem). */
export function walletRepaidPrincipalAtoms(position: LeveragedPosition): number {
  const peakBorrow = effectivePeakBorrowAtoms(position);
  if (peakBorrow <= 0) return 0;
  if (isEndedPosition(position)) {
    const closePrincipal = closePrincipalRepaidAtoms(position);
    if (
      closePrincipal <= 0 &&
      position.status === "liquidated"
    ) {
      // Legacy indexer rows: liquidation repaid vault debt from redeem proceeds, not wallet.
      return 0;
    }
    return Math.max(0, peakBorrow - closePrincipal);
  }
  return Math.max(0, peakBorrow - coerceQuoteAtoms(position.borrow_quote));
}

export function walletRepaidPrincipalUsd(position: LeveragedPosition): number {
  return scaleQuote(walletRepaidPrincipalAtoms(position));
}

export function positionCashInUsd(position: LeveragedPosition): number {
  return positionMarginUsd(position) + walletRepaidPrincipalUsd(position);
}

/** Indexer close_* fields populated (leveraged close path). */
function hasDetailedCloseFields(position: LeveragedPosition): boolean {
  return (
    coerceQuoteAtoms(position.close_debt_repaid) > 0 ||
    coerceQuoteAtoms(position.close_interest_paid) > 0 ||
    coerceQuoteAtoms(position.close_surplus_quote) > 0
  );
}

/** Realized P&L for closed/settled/liquidated rows — net wallet result. */
export function realizedPnlUsd(position: LeveragedPosition): number | null {
  if (!isEndedPosition(position)) return null;
  if (hasDetailedCloseFields(position)) {
    return (
      scaleQuote(position.close_surplus_quote) -
      positionMarginUsd(position) -
      walletRepaidPrincipalUsd(position)
    );
  }
  if (position.status === "liquidated") {
    return -positionCashInUsd(position);
  }
  const payoutUsd = scaleQuote(position.realized_payout);
  const costUsd = scaleQuote(effectiveMintCostAtoms(position));
  return payoutUsd - costUsd;
}

export type ClosedPositionPnlBreakdown = {
  marginPostedUsd: number;
  walletRepaidUsd: number;
  cashBackUsd: number;
  borrowRepaidUsd: number;
  interestPaidUsd: number;
  netPnlUsd: number;
  hasBreakdown: boolean;
};

export function hasClosePnlBreakdown(position: LeveragedPosition): boolean {
  return isEndedPosition(position);
}

export function closedPositionPnlBreakdown(
  position: LeveragedPosition,
): ClosedPositionPnlBreakdown | null {
  if (!isEndedPosition(position)) return null;
  const hasDetailedClose = hasDetailedCloseFields(position);
  const marginPostedUsd = positionMarginUsd(position);
  const walletRepaidUsd = walletRepaidPrincipalUsd(position);
  const cashBackUsd = hasDetailedClose
    ? scaleQuote(position.close_surplus_quote)
    : scaleQuote(position.realized_payout);
  const borrowRepaidUsd = scaleQuote(closePrincipalRepaidAtoms(position));
  const interestPaidUsd = scaleQuote(position.close_interest_paid);
  const netPnlUsd = realizedPnlUsd(position) ?? 0;
  return {
    marginPostedUsd,
    walletRepaidUsd,
    cashBackUsd,
    borrowRepaidUsd,
    interestPaidUsd,
    netPnlUsd,
    hasBreakdown: true,
  };
}

export function entryMarkPremiumRaw(position: LeveragedPosition): bigint | null {
  const fromCost = entryPremiumPerUnitRaw(position);
  if (fromCost != null) return fromCost;
  const entryMark = coerceQuoteAtoms(position.entry_mark);
  if (entryMark > 0) return positionAtoms(position.entry_mark);
  return null;
}

export function closingMarkPremiumRaw(position: LeveragedPosition): bigint | null {
  if (
    isEndedPosition(position) &&
    coerceQuoteAtoms(position.realized_payout) > 0 &&
    coerceQuoteAtoms(position.open_quantity) > 0
  ) {
    return premiumPerUnitFromMintCost(
      positionAtoms(position.realized_payout),
      positionAtoms(position.open_quantity),
    );
  }
  const closingMark = coerceQuoteAtoms(position.closing_mark);
  if (closingMark > 0) return positionAtoms(position.closing_mark);
  return null;
}

export function realizedPnlPct(position: LeveragedPosition): number | null {
  const pnlUsd = realizedPnlUsd(position);
  const basisUsd = hasDetailedCloseFields(position)
    ? positionCashInUsd(position)
    : scaleQuote(effectiveMintCostAtoms(position));
  if (pnlUsd == null || basisUsd <= 0) return null;
  return (pnlUsd / basisUsd) * 100;
}

export function closedEntryPremiumCents(position: LeveragedPosition): number | null {
  const premium = entryMarkPremiumRaw(position);
  return premium != null ? premiumRawToCents(premium) : null;
}

export function closedClosingPremiumCents(position: LeveragedPosition): number | null {
  const premium = closingMarkPremiumRaw(position);
  return premium != null ? premiumRawToCents(premium) : null;
}

/** Cap ghost mint_cost until indexer migration repairs historical rows. */
export function effectiveMintCostAtoms(position: LeveragedPosition): number {
  const mintCost = coerceQuoteAtoms(position.mint_cost);
  if (mintCost <= 0) return 0;
  // Closed rows zero borrow_quote; use full mint_cost for entry premium and P&L basis.
  if (isEndedPosition(position)) return mintCost;
  const cap =
    coerceQuoteAtoms(position.margin_quote) + coerceQuoteAtoms(position.borrow_quote);
  return cap > 0 ? Math.min(mintCost, cap) : mintCost;
}

/** Matches on-chain `ltv::effective_health_debt` (quote atoms). */
export function effectiveHealthDebtAtoms(
  vaultDebtAtoms: number,
  marginDebtAtoms: number,
  leverageBps: number,
): number {
  if (leverageBps <= 10_000) return 0;
  if (vaultDebtAtoms > 0) return vaultDebtAtoms;
  return marginDebtAtoms;
}

function effectiveHealthDebtUsd(
  vaultDebtUsd: number,
  marginDebtUsd: number,
  leverageBps: number,
): number {
  if (leverageBps <= 10_000) return 0;
  if (vaultDebtUsd > 0) return vaultDebtUsd;
  return marginDebtUsd;
}

/** Average fill premium — always mint_cost ÷ qty (unchanged by repay / deleverage). */
export function entryPremiumPerUnitRaw(position: LeveragedPosition): bigint | null {
  const openQuantity = coerceQuoteAtoms(position.open_quantity);
  const mintCost = coerceQuoteAtoms(position.mint_cost);
  if (openQuantity <= 0 || mintCost <= 0) return null;
  return premiumPerUnitFromMintCost(positionAtoms(mintCost), positionAtoms(openQuantity));
}

export function positionMintCostUsd(position: LeveragedPosition): number {
  return scaleQuote(position.mint_cost);
}

export function positionMarginUsd(position: LeveragedPosition): number {
  return scaleQuote(position.margin_quote);
}

export function positionBorrowUsd(position: LeveragedPosition): number {
  return scaleQuote(position.borrow_quote);
}

export function positionLeverageMultiplier(position: LeveragedPosition): number {
  return coerceQuoteAtoms(position.leverage_bps) / 10_000;
}

export function computePositionMarkToMarket(
  position: LeveragedPosition,
  redeemQuote: RedeemQuote | null | undefined,
  quoteLoading: boolean,
  liquidationBps: number = DEFAULT_LIQUIDATION_BPS,
  ledger?: PositionLedgerHealthInputs | null,
  ledgerReady = ledger != null,
): PositionMarkToMarket {
  const entryCostUsd = scaleQuote(position.mint_cost);
  const marginUsd = scaleQuote(position.margin_quote);
  const borrowedUsd = scaleQuote(
    ledger?.borrowedQuote ?? position.borrow_quote,
  );
  const leverageBps = Number(
    ledger?.leverageBps ?? coerceQuoteAtoms(position.leverage_bps),
  );
  const keyQuoteUsd = ledger ? scaleQuote(ledger.keyQuoteBalance) : 0;
  const positionSizeUsd = marginUsd + borrowedUsd;
  const isLeveraged =
    leverageBps > 10_000 && effectiveHealthDebtUsd(borrowedUsd, marginUsd, leverageBps) > 0;

  const entryPremium = entryMarkPremiumRaw(position);
  const entryPremiumCents = entryPremium != null ? premiumRawToCents(entryPremium) : null;

  if (!redeemQuote || coerceQuoteAtoms(position.open_quantity) <= 0) {
    return {
      positionKey: positionRowId(position),
      markValueUsd: 0,
      keyQuoteUsd,
      collateralUsd: keyQuoteUsd,
      markBidPerUnit: null,
      markBidCents: null,
      entryCostUsd,
      entryPremiumPerUnit: entryPremium != null ? Number(entryPremium) : null,
      entryPremiumCents,
      unrealizedPnlUsd: 0,
      unrealizedPnlPct: null,
      netEquityUsd: 0,
      borrowedUsd,
      healthBps: null,
      healthLabel: quoteLoading ? "unknown" : "unknown",
      isLeveraged,
      isLive: false,
    };
  }

  const markValueUsd = scaleQuote(Number(redeemQuote.expectedPayout));
  const collateralUsd = markValueUsd + keyQuoteUsd;
  const netEquityUsd = collateralUsd - borrowedUsd;
  const walletRepaidUsd = walletRepaidPrincipalUsd(position);
  const unrealizedPnlUsd = netEquityUsd - marginUsd - walletRepaidUsd;
  const cashInUsd = marginUsd + walletRepaidUsd;
  const unrealizedPnlPct =
    cashInUsd > 0 ? (unrealizedPnlUsd / cashInUsd) * 100 : null;
  const healthDebtUsd = effectiveHealthDebtUsd(borrowedUsd, marginUsd, leverageBps);
  const healthBps =
    healthDebtUsd > 0
      ? Math.round((collateralUsd / healthDebtUsd) * 10_000)
      : positionSizeUsd > 0
        ? 100_000
        : null;

  let healthLabel: PositionMarkToMarket["healthLabel"] = "unknown";
  if (healthBps != null) {
    healthLabel = resolveHealthLabel(healthBps, liquidationBps);
  }

  const markBidCents = premiumRawToCents(redeemQuote.marketBidPerUnit);

  return {
    positionKey: positionRowId(position),
    markValueUsd,
    keyQuoteUsd,
    collateralUsd,
    markBidPerUnit: Number(redeemQuote.marketBidPerUnit),
    markBidCents,
    entryCostUsd,
    entryPremiumPerUnit: entryPremium != null ? Number(entryPremium) : null,
    entryPremiumCents,
    unrealizedPnlUsd,
    unrealizedPnlPct,
    netEquityUsd,
    borrowedUsd,
    healthBps,
    healthLabel,
    isLeveraged,
    isLive: Boolean(redeemQuote && !quoteLoading && ledgerReady),
  };
}

export function formatPnlUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}$${formatAmount(Math.abs(value))}`;
}

export function formatPnlPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1)}%`;
}

export function formatHealthBps(bps: number | null): string {
  if (bps == null) return "—";
  return `${(bps / 100).toFixed(1)}%`;
}
