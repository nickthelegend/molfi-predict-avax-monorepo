import { Timer } from "lucide-react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { useIndexerProtocol } from "@/hooks/useIndexer";
import { useNow } from "@/hooks/useNow";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { resolveFinalWindowMs } from "@/lib/leverx/protocol";
import {
  formatCountdownStopwatch,
  formatLeverage,
  isLeverageEnabled,
  leverageCountdownState,
  maxLeverageForExpiry,
} from "@/lib/leverx/trade-limits";
import { leverageCountdown, leverageCountdownTime } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  expiryMs?: number;
  className?: string;
}

export function LeverageWindowCountdown({ expiryMs, className }: Props) {
  const { data: protocol } = useIndexerProtocol();
  const finalWindowMs = resolveFinalWindowMs(protocol);
  const now = useNow(1000);
  const state =
    expiryMs && expiryMs > 0
      ? leverageCountdownState(expiryMs, finalWindowMs, now)
      : null;

  if (!state || state.phase === "market-closed") {
    return null;
  }

  // Leverage disabled (Molfi = 1x spot prediction): no leverage window.
  if (!isLeverageEnabled()) {
    return null;
  }

  const inFinalHour = state.phase === "leverage-closed";
  const primaryRemaining = inFinalHour
    ? state.marketRemainingMs
    : state.leverageRemainingMs;
  const maxLeverage = maxLeverageForExpiry(expiryMs!, finalWindowMs, now);
  const label = inFinalHour ? "Market closes" : "Leverage closes";
  const sublabel = inFinalHour
    ? "1× margin only — vault borrow closed"
    : `${formatLeverage(maxLeverage)} available until then`;

  return (
    <div
      className={cn(leverageCountdown, inFinalHour && "border-amber-500/30 bg-amber-500/5", className)}
      role="timer"
      aria-live="polite"
      aria-label={`${label} in ${formatCountdownStopwatch(primaryRemaining)}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Timer
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              inFinalHour ? "text-amber-400" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <LabelWithInfo
            label={label}
            labelClassName="text-sm font-medium text-muted-foreground"
            info={leverxInfo.leverageCountdown}
          />
        </div>
        <span
          className={cn(
            leverageCountdownTime,
            inFinalHour && "text-amber-300",
          )}
        >
          {formatCountdownStopwatch(primaryRemaining)}
        </span>
      </div>
      <p
        className={cn(
          "text-sm leading-snug text-muted-foreground",
          inFinalHour && "text-amber-200/80",
        )}
      >
        {sublabel}
      </p>
    </div>
  );
}
