import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { coerceQuoteAtoms } from "@/lib/predict/scaling";
import { positionShowsManageFromIndexer } from "@/lib/leverx/position-indexer-hints";

/** `null` = on-chain read failed; `0n` = read succeeded with no contracts. */
export type OnChainQuantityRead = bigint | null;

/** Quantity to use for post-expiry settlement — on-chain only (never indexer fallback). */
export function settleContractQuantity(onChain: OnChainQuantityRead): bigint {
  return onChain ?? 0n;
}

export function hasIndexerOpenQuantity(position: Pick<LeveragedPosition, "open_quantity">): boolean {
  return coerceQuoteAtoms(position.open_quantity) > 0;
}

/** Whether a row should expose Manage (settle, withdraw, repay, recover, etc.). */
export function positionShowsManageAction(
  position: Pick<
    LeveragedPosition,
    | "status"
    | "borrow_quote"
    | "action_hints"
    | "leverx_custody_complete"
    | "close_surplus_quote"
    | "close_source"
    | "external_redeem_payout_quote"
    | "custody_recovered_quote"
  >,
): boolean {
  return positionShowsManageFromIndexer(position);
}
