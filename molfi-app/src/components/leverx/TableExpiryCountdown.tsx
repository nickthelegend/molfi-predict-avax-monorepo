import { useNow } from "@/hooks/useNow";
import { formatCountdownStopwatch } from "@/lib/leverx/trade-limits";
import { tableCountdownCell, tableCountdownTime } from "@/lib/leverx/tw";

/** Live expiry countdown for table cells — fixed width so ticks don't reflow columns. */
export function TableExpiryCountdown({ expiryMs }: { expiryMs: number }) {
  const now = useNow(1000);

  if (!expiryMs) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const remaining = expiryMs - now;
  if (remaining <= 0) {
    return (
      <span className="text-sm text-muted-foreground">
        {new Date(expiryMs).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </span>
    );
  }

  return (
    <span
      className={tableCountdownCell}
      aria-label={`${formatCountdownStopwatch(remaining)} left`}
    >
      <span className={tableCountdownTime} aria-hidden>
        {formatCountdownStopwatch(remaining)}
      </span>
      <span aria-hidden>left</span>
    </span>
  );
}
