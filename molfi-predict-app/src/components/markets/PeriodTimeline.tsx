import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface PeriodSlot {
  /** Start of this period (ms) */
  start: number;
  /** End of this period (ms) */
  end: number;
  /** Display label */
  label: string;
  /** "past" | "current" | "future" */
  state: "past" | "current" | "future";
}

interface PeriodTimelineProps {
  timeframe: "hourly" | "daily";
  /** Currently selected slot start (ms). Defaults to the current period. */
  selectedStart: number;
  onSelect: (slot: PeriodSlot) => void;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function formatHourLabel(ms: number): string {
  const d = new Date(ms);
  const h = d.getUTCHours();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12} ${ampm}`;
}

function formatDayLabel(ms: number): string {
  const d = new Date(ms);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function buildHourlySlots(): PeriodSlot[] {
  const now = Date.now();
  const currentHourStart = new Date();
  currentHourStart.setUTCMinutes(0, 0, 0);
  const currentMs = currentHourStart.getTime();

  const slots: PeriodSlot[] = [];

  // Show 3 past hours, current hour, 3 future hours
  for (let offset = -3; offset <= 3; offset++) {
    const start = currentMs + offset * HOUR_MS;
    const end = start + HOUR_MS;
    const state: PeriodSlot["state"] =
      offset < 0 ? "past" : offset === 0 ? "current" : "future";

    slots.push({
      start,
      end,
      label: formatHourLabel(start),
      state,
    });
  }

  return slots;
}

function buildDailySlots(): PeriodSlot[] {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const slots: PeriodSlot[] = [];

  // Show 3 past days, today, 3 future days
  for (let offset = -3; offset <= 3; offset++) {
    const start = todayMs + offset * DAY_MS;
    const end = start + DAY_MS;
    const state: PeriodSlot["state"] =
      offset < 0 ? "past" : offset === 0 ? "current" : "future";

    slots.push({
      start,
      end,
      label: formatDayLabel(start),
      state,
    });
  }

  return slots;
}

export function PeriodTimeline({ timeframe, selectedStart, onSelect }: PeriodTimelineProps) {
  const slots = useMemo(
    () => (timeframe === "hourly" ? buildHourlySlots() : buildDailySlots()),
    [timeframe]
  );

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-t border-border overflow-x-auto scrollbar-hide">
      {slots.map((slot) => {
        const isSelected = slot.start === selectedStart;

        return (
          <button
            key={slot.start}
            onClick={() => onSelect(slot)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
              isSelected && slot.state === "current" && "bg-primary text-primary-foreground shadow-sm",
              isSelected && slot.state === "past" && "bg-muted text-foreground ring-1 ring-border",
              isSelected && slot.state === "future" && "bg-muted text-foreground ring-1 ring-border",
              !isSelected && slot.state === "current" && "bg-muted/50 text-foreground hover:bg-muted",
              !isSelected && slot.state === "past" && "text-muted-foreground hover:bg-muted/50",
              !isSelected && slot.state === "future" && "text-muted-foreground/50 hover:bg-muted/30",
            )}
          >
            {/* Live dot for current period */}
            {slot.state === "current" && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
            {slot.label}
          </button>
        );
      })}
    </div>
  );
}
