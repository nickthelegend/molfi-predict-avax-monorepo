import { MarketLeverageBadge } from "@/components/leverx/MarketLeverageBadge";
import { MarketQuotePausedBadge } from "@/components/leverx/MarketQuotePausedBadge";
import { cn } from "@/lib/utils";

interface Props {
  expiryMs?: number;
  now?: number;
  quotePaused?: boolean;
  className?: string;
}

export function MarketLeverageBadges({ expiryMs, now, quotePaused, className }: Props) {
  return (
    <div className={cn("mt-1 flex flex-wrap items-center gap-1.5", className)}>
      <MarketLeverageBadge expiryMs={expiryMs} now={now} className="mt-0" />
      {quotePaused ? <MarketQuotePausedBadge className="mt-0" /> : null}
    </div>
  );
}
