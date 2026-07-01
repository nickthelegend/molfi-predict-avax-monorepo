import type { LeveragedPosition, PositionEmptyStateKind } from "@/lib/leverx/indexer-client";
import {
  positionEmptyStateHint,
  positionIndexerStaleSuspect,
  positionNeedsCustodyRecovery,
  positionRecommendedActions,
} from "@/lib/leverx/position-indexer-hints";
import { coerceQuoteAtoms } from "@/lib/predict/scaling";
import {
  hasIndexerOpenQuantity,
  settleContractQuantity,
  type OnChainQuantityRead,
} from "@/lib/leverx/position-quantity";

export type { PositionEmptyStateKind };

export type PositionCustodyRead = {
  keyQuoteBalance: bigint | null;
  managerQuoteBalance: bigint | null;
  custodyLoading: boolean;
};

export type PositionActionAvailability = {
  canCloseRedeem: boolean;
  canSettle: boolean;
  canRepayDebt: boolean;
  canRecoverCustody: boolean;
  canRecoverKeyQuote: boolean;
  canRecoverManagerQuote: boolean;
  recoverKeyQuote: bigint;
  recoverManagerQuote: bigint;
  emptyState: PositionEmptyStateKind | null;
  primaryCta: string | null;
};

/** Portfolio index lists open qty but on-chain manager position is flat. */
export function isIndexerStaleOpenPosition(
  position: Pick<LeveragedPosition, "status" | "open_quantity" | "close_source" | "action_hints">,
  onChainQuantity: OnChainQuantityRead,
): boolean {
  if (positionIndexerStaleSuspect(position)) {
    return onChainQuantity === 0n || onChainQuantity == null;
  }
  return (
    position.status === "open" &&
    onChainQuantity === 0n &&
    hasIndexerOpenQuantity(position)
  );
}

function flatOnChain(onChainQuantity: OnChainQuantityRead, quantityLoading: boolean): boolean {
  return !quantityLoading && onChainQuantity === 0n;
}

/** Which manage actions are valid for this position (indexer hints + on-chain reads). */
export function getPositionActionAvailability(params: {
  position: LeveragedPosition;
  onChainQuantity: OnChainQuantityRead;
  quantityLoading: boolean;
  oracleSettled: boolean;
  custody?: PositionCustodyRead;
  now?: number;
}): PositionActionAvailability {
  const { position, onChainQuantity, quantityLoading, oracleSettled, custody } = params;
  const now = params.now ?? Date.now();
  const expired = position.expiry_ms > 0 && position.expiry_ms < now;
  const hasDebt = coerceQuoteAtoms(position.borrow_quote) > 0;

  const settleQty = settleContractQuantity(onChainQuantity);
  const hasRedeemableQuantity =
    onChainQuantity != null
      ? onChainQuantity > 0n
      : hasIndexerOpenQuantity(position);

  const recommended = positionRecommendedActions(position);
  const indexerNeedsRecovery = positionNeedsCustodyRecovery(position);

  const canCloseRedeem =
    hasRedeemableQuantity &&
    !oracleSettled &&
    (recommended.length === 0 || recommended.includes("close_redeem"));
  const canSettle =
    expired &&
    oracleSettled &&
    settleQty > 0n &&
    !quantityLoading &&
    onChainQuantity != null &&
    (recommended.length === 0 || recommended.includes("settle"));
  const canRepayDebt = hasDebt || recommended.includes("repay_debt");

  const custodyReady = custody != null && !custody.custodyLoading;
  const keyQuote = custodyReady ? (custody.keyQuoteBalance ?? 0n) : 0n;
  const managerQuote = custodyReady ? (custody.managerQuoteBalance ?? 0n) : 0n;
  const flat = flatOnChain(onChainQuantity, quantityLoading);

  // Key sweep requires zero borrow on-chain; manager sweep may run with debt.
  const canRecoverKeyQuote = flat && !hasDebt && keyQuote > 0n;
  const canRecoverManagerQuote = flat && managerQuote > 0n;

  const canRecoverFromIndexerHint =
    indexerNeedsRecovery &&
    flat &&
    !custodyReady &&
    recommended.includes("recover_custody");

  const externalPayoutRemaining = BigInt(
    Math.max(
      0,
      coerceQuoteAtoms(position.external_redeem_payout_quote ?? 0) -
        coerceQuoteAtoms(position.custody_recovered_quote ?? 0),
    ),
  );

  const canRecoverCustody =
    canRecoverKeyQuote ||
    canRecoverManagerQuote ||
    canRecoverFromIndexerHint ||
    (indexerNeedsRecovery && recommended.includes("recover_custody") && flat);

  const recoverManagerAmount =
    canRecoverManagerQuote
      ? managerQuote
      : canRecoverFromIndexerHint && externalPayoutRemaining > 0n
        ? externalPayoutRemaining
        : 0n;

  let emptyState: PositionEmptyStateKind | null = null;
  if (
    !quantityLoading &&
    !canCloseRedeem &&
    !canSettle &&
    !canRepayDebt &&
    !canRecoverCustody
  ) {
    if (isIndexerStaleOpenPosition(position, onChainQuantity)) {
      emptyState = positionEmptyStateHint(position) ?? "index_stale";
    } else if (positionEmptyStateHint(position)) {
      emptyState = positionEmptyStateHint(position);
    } else if (position.status !== "open" && settleQty === 0n) {
      emptyState = "fully_redeemed";
    } else if (settleQty === 0n && !hasIndexerOpenQuantity(position)) {
      emptyState = "fully_redeemed";
    } else if (expired && !oracleSettled && hasIndexerOpenQuantity(position)) {
      emptyState = "awaiting_oracle_settlement";
    } else {
      emptyState = "no_actions";
    }
  } else if (
    canRecoverCustody &&
    !canCloseRedeem &&
    !canSettle &&
    !canRepayDebt
  ) {
    emptyState = "stranded_custody";
  }

  return {
    canCloseRedeem,
    canSettle,
    canRepayDebt,
    canRecoverCustody,
    canRecoverKeyQuote,
    canRecoverManagerQuote,
    recoverKeyQuote: canRecoverKeyQuote ? keyQuote : 0n,
    recoverManagerQuote: recoverManagerAmount,
    emptyState,
    primaryCta: position.action_hints?.primary_cta ?? null,
  };
}
