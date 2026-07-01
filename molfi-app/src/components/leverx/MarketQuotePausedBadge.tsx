import { leverageBadge } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function MarketQuotePausedBadge({ className }: Props) {
  return (
    <span
      className={cn(
        leverageBadge,
        "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      Paused
    </span>
  );
}
