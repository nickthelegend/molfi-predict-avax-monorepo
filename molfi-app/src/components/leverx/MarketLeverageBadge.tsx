import { useIndexerProtocol } from "@/hooks/useIndexer";
import { resolveFinalWindowMs } from "@/lib/leverx/protocol";
import {
  formatLeverageBadge,
  isLeverageEnabled,
  leverageBadgeToneClass,
  maxLeverageForExpiry,
} from "@/lib/leverx/trade-limits";
import { leverageBadge } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  expiryMs?: number;
  now?: number;
  className?: string;
}

export function MarketLeverageBadge({ expiryMs, now, className }: Props) {
  const { data: protocol } = useIndexerProtocol();
  const finalWindowMs = resolveFinalWindowMs(protocol);
  const maxLeverage = maxLeverageForExpiry(expiryMs ?? 0, finalWindowMs, now);
  const label = formatLeverageBadge(maxLeverage);

  // Leverage disabled (Molfi = 1x spot prediction): render nothing.
  if (!isLeverageEnabled()) return null;

  return (
    <span
      className={cn(
        leverageBadge,
        leverageBadgeToneClass(maxLeverage),
        "mt-1",
        className,
      )}
    >
      {label}
    </span>
  );
}
