import { Clock, Layers, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCategoryIcon } from "@/lib/category-icons";
import { useMemo } from "react";

export interface MarketCardSimpleProps {
  id: string;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  totalVolume?: number;
  imageUrl?: string;
  endDate?: string;
  isSelected?: boolean;
  isDaily?: boolean;
  /** e.g. "Hourly" or "Daily" — shown as a tag on the card */
  timeframeLabel?: string;
  onClick?: () => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}mn`;
  if (volume >= 10_000) return `$${(volume / 1_000).toFixed(1)}k`;
  if (volume > 0) return `$${volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return "$0";
}

function formatTimeLeft(endDate: string): { text: string; urgent: boolean } | null {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  if (isNaN(end)) return null;
  const diff = end - now;
  if (diff <= 0) return { text: "Ended", urgent: false };
  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) return { text: `${Math.floor(diff / 60000)}m left`, urgent: true };
  if (hours < 24) return { text: `${Math.floor(hours)}h left`, urgent: true };
  return { text: `${Math.floor(hours / 24)}d left`, urgent: false };
}

export function MarketCardSimple({
  id,
  title,
  yesPercentage,
  noPercentage,
  totalVolume = 0,
  imageUrl,
  endDate,
  isSelected = false,
  isDaily = false,
  timeframeLabel,
  onClick,
}: MarketCardSimpleProps) {
  const timeLeft = useMemo(() => (endDate ? formatTimeLeft(endDate) : null), [endDate]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Timeframe + Leverage badges */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
        {timeframeLabel && (
          <span className={cn(
            "inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border",
            isDaily
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border"
          )}>
            {timeframeLabel}
          </span>
        )}
        {isDaily && (
          <span className="inline-flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
            <TrendingUp className="w-2.5 h-2.5" />
            Leverage
          </span>
        )}
      </div>

      {/* Image + Title */}
      <div className="flex gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (() => {
            const Icon = getCategoryIcon(undefined, title);
            return (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Icon className="w-4 h-4" />
              </div>
            );
          })()}
        </div>
        <h3 className={cn("font-semibold text-sm leading-snug line-clamp-2 flex-1 min-w-0", isDaily ? "pr-16" : "pr-2")}>
          {title}
        </h3>
      </div>

      {/* Expiry */}
      {timeLeft && (
        <div className="mb-2">
          <span className={cn(
            "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            timeLeft.urgent ? "bg-red-500/15 text-red-500" : "bg-muted text-muted-foreground"
          )}>
            <Clock className="w-2.5 h-2.5" />
            {timeLeft.text}
          </span>
        </div>
      )}

      {/* YES/NO bar */}
      <div className="flex h-6 rounded-md overflow-hidden mb-1.5">
        <div
          className="flex items-center justify-center text-[11px] font-bold text-white bg-emerald-500 transition-all"
          style={{ width: `${Math.max(yesPercentage, 10)}%` }}
        >
          {yesPercentage >= 15 && `${yesPercentage.toFixed(0)}%`}
        </div>
        <div
          className="flex items-center justify-center text-[11px] font-bold text-white bg-red-500 transition-all"
          style={{ width: `${Math.max(noPercentage, 10)}%` }}
        >
          {noPercentage >= 15 && `${noPercentage.toFixed(0)}%`}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Yes <span className="font-semibold text-emerald-500">{yesPercentage.toFixed(0)}%</span></span>
        <span className="font-medium">{formatVolume(totalVolume)}</span>
      </div>
    </div>
  );
}
