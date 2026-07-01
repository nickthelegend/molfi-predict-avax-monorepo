import type { LeveragedPosition, PositionTrigger } from "@/lib/leverx/indexer-client";
import { formatTriggerSlippageBps, premiumRawToCents } from "@/lib/leverx/trade-math";

export function positionTriggerForPosition(
  triggers: readonly PositionTrigger[],
  position: Pick<LeveragedPosition, "oracle_id" | "is_range">,
): PositionTrigger | undefined {
  return triggers.find(
    (trigger) =>
      trigger.active &&
      trigger.oracle_id === position.oracle_id &&
      trigger.is_range === position.is_range,
  );
}

export function formatPositionTriggerSummary(trigger: PositionTrigger) {
  return {
    tpCents: premiumRawToCents(BigInt(trigger.take_profit_premium)).toFixed(1),
    slCents: premiumRawToCents(BigInt(trigger.stop_loss_premium)).toFixed(1),
    tpSlippage: formatTriggerSlippageBps(trigger.take_profit_slippage_bps),
    slSlippage: formatTriggerSlippageBps(trigger.stop_loss_slippage_bps),
  };
}
