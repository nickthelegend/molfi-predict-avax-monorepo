import type {
  LeveragedPosition,
  PositionActionHints,
  PositionEmptyStateKind,
} from "@/lib/leverx/indexer-client";
import { coerceQuoteAtoms } from "@/lib/predict/scaling";

export type PositionCloseSource =
  | "leverx_redeem"
  | "leverx_settle"
  | "predict_external"
  | "stranded_recovery"
  | "manager_surplus_recovery"
  | "liquidation"
  | "bad_debt_writeoff";

export function positionActionHints(
  position: Pick<LeveragedPosition, "action_hints">,
): PositionActionHints | undefined {
  return position.action_hints;
}

export function positionCloseSource(
  position: Pick<LeveragedPosition, "close_source" | "action_hints">,
): string | null {
  return position.close_source ?? position.action_hints?.close_source ?? null;
}

export function positionLeverxCustodyComplete(
  position: Pick<LeveragedPosition, "leverx_custody_complete" | "action_hints">,
): boolean {
  return (
    position.leverx_custody_complete ??
    position.action_hints?.leverx_custody_complete ??
    false
  );
}

export function positionNeedsCustodyRecovery(
  position: Pick<
    LeveragedPosition,
    | "action_hints"
    | "close_source"
    | "leverx_custody_complete"
    | "external_redeem_payout_quote"
    | "custody_recovered_quote"
  >,
): boolean {
  const hints = position.action_hints;
  if (hints?.needs_custody_recovery) return true;
  if (positionLeverxCustodyComplete(position)) return false;

  const payout = coerceQuoteAtoms(
    position.external_redeem_payout_quote ??
      hints?.external_redeem_payout_quote ??
      0,
  );
  const recovered = coerceQuoteAtoms(
    position.custody_recovered_quote ?? hints?.custody_recovered_quote ?? 0,
  );
  if (payout > 0 && recovered < payout) return true;

  const source = positionCloseSource(position);
  return source === "predict_external" || source === "manager_surplus_recovery";
}

export function positionIndexerStaleSuspect(
  position: Pick<
    LeveragedPosition,
    "status" | "open_quantity" | "close_source" | "action_hints"
  >,
): boolean {
  if (position.action_hints?.empty_state_hint === "index_stale") return true;
  return (
    position.status === "open" &&
    coerceQuoteAtoms(position.open_quantity) > 0 &&
    positionCloseSource(position) === "predict_external"
  );
}

export function positionRecommendedActions(
  position: Pick<LeveragedPosition, "action_hints">,
): readonly string[] {
  return position.action_hints?.recommended_actions ?? [];
}

export function positionPrimaryCta(
  position: Pick<LeveragedPosition, "action_hints">,
): string | null {
  return position.action_hints?.primary_cta ?? null;
}

export function positionEmptyStateHint(
  position: Pick<LeveragedPosition, "action_hints">,
): PositionEmptyStateKind | null {
  return position.action_hints?.empty_state_hint ?? null;
}

/** Whether portfolio should expose Manage for this row (indexer + debt/surplus). */
export function positionShowsManageFromIndexer(
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
  if (position.status === "open") return true;
  if (coerceQuoteAtoms(position.borrow_quote) > 0) return true;
  if (positionNeedsCustodyRecovery(position)) return true;
  if (positionRecommendedActions(position).includes("withdraw_trading")) return true;
  if (
    positionLeverxCustodyComplete(position) &&
    coerceQuoteAtoms(position.close_surplus_quote) > 0
  ) {
    return true;
  }
  return false;
}
