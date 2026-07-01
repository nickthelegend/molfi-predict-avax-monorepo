import { PauseCircle } from "lucide-react";
import { InfoPopover } from "@/components/leverx/InfoPopover";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Shorter label for tight layouts (trade panel footer). */
  compact?: boolean;
}

/** Protocol maintenance — new mints/fills paused; exits and debt repay stay on-chain. */
export function TradingPausedNotice({ className, compact }: Props) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-50",
        className,
      )}
      role="status"
    >
      <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 leading-snug">
        {compact ? "New opens paused." : "Trading is paused for new opens and limit fills."}{" "}
        <span className="text-muted-foreground">
          Close, repay, and settle still work.
        </span>{" "}
        <InfoPopover title="Trading paused">{leverxInfo.tradingPaused}</InfoPopover>
      </p>
    </div>
  );
}
