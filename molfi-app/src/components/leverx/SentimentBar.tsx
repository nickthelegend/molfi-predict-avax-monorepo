import { cn } from "@/lib/utils";

/**
 * Market sentiment bar — YES vs NO split from the live implied odds.
 * `yesPct` is 0–100 (the YES probability). Renders nothing if unknown.
 */
export function SentimentBar({
  yesPct,
  className,
  compact = false,
}: {
  yesPct: number | null | undefined;
  className?: string;
  compact?: boolean;
}) {
  if (yesPct == null || !Number.isFinite(yesPct)) return null;
  const yes = Math.max(0, Math.min(100, yesPct));
  const no = 100 - yes;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex items-center justify-between", compact ? "text-[10px]" : "text-xs")}>
        <span className="font-semibold text-[var(--long-text)]">YES {Math.round(yes)}%</span>
        <span className="font-semibold text-[var(--short-text)]">NO {Math.round(no)}%</span>
      </div>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full bg-[var(--short-bg)]",
          compact ? "h-1.5" : "h-2",
        )}
        role="img"
        aria-label={`Sentiment: ${Math.round(yes)}% YES, ${Math.round(no)}% NO`}
      >
        <div
          className="h-full bg-[var(--long-text)] transition-[width] duration-500"
          style={{ width: `${yes}%` }}
        />
      </div>
    </div>
  );
}
