import { LineChart, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { CHART_OHLCV_INTERVALS, type OhlcvInterval } from "@/lib/deepbook/ohlcv";
import type { ChartDisplayMode } from "@/hooks/useChartPriceSeries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  hasOhlcv: boolean;
  interval: OhlcvInterval;
  onIntervalChange: (interval: OhlcvInterval) => void;
  displayMode: ChartDisplayMode;
  onDisplayModeChange: (mode: ChartDisplayMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  className?: string;
}

function ChartTypeIcon({ mode }: { mode: ChartDisplayMode }) {
  if (mode === "line") {
    return <LineChart className="size-3.5" aria-hidden />;
  }

  return (
    <svg
      viewBox="0 0 16 16"
      className="size-3.5"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M3 11V8M6 11V5M9 11V7M12 11V3" strokeLinecap="round" />
    </svg>
  );
}

export function ChartToolbar({
  hasOhlcv,
  interval,
  onIntervalChange,
  displayMode,
  onDisplayModeChange,
  onZoomIn,
  onZoomOut,
  onReset,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {hasOhlcv ? (
          <>
            <Select
              value={interval}
              onValueChange={(value) => onIntervalChange(value as OhlcvInterval)}
            >
              <SelectTrigger
                className="h-7 w-22 border-0 bg-muted/60 px-2.5 py-1 text-sm font-medium capitalize shadow-none focus:ring-1 md:hidden"
                aria-label="Chart timeframe"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_OHLCV_INTERVALS.map((value) => (
                  <SelectItem key={value} value={value} className="capitalize">
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div
              className={cn(pillToggleGroup, "hidden max-w-full overflow-x-auto md:flex")}
              role="group"
              aria-label="Chart timeframe"
            >
              {CHART_OHLCV_INTERVALS.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    pillToggleBtn,
                    interval === value ? pillToggleActive : pillToggleIdle,
                  )}
                  onClick={() => onIntervalChange(value)}
                  aria-pressed={interval === value}
                >
                  {value}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {hasOhlcv ? (
          <div className={pillToggleGroup} role="group" aria-label="Chart type">
            {(
              [
                { id: "line" as const, label: "Line" },
                { id: "candlestick" as const, label: "Candles" },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={cn(
                  pillToggleBtn,
                  "inline-flex items-center gap-1.5",
                  displayMode === id ? pillToggleActive : pillToggleIdle,
                )}
                onClick={() => onDisplayModeChange(id)}
                aria-pressed={displayMode === id}
              >
                <ChartTypeIcon mode={id} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={pillToggleGroup} role="group" aria-label="Chart zoom">
        <button
          type="button"
          className={cn(pillToggleBtn, pillToggleIdle, "inline-flex items-center px-2")}
          onClick={onZoomOut}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(pillToggleBtn, pillToggleIdle, "inline-flex items-center px-2")}
          onClick={onZoomIn}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className={cn(pillToggleBtn, pillToggleIdle, "inline-flex items-center px-2")}
          onClick={onReset}
          title="Reset view"
          aria-label="Reset view"
        >
          <RotateCcw className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
