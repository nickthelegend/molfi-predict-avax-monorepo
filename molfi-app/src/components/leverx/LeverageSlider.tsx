import { Minus, Plus } from "lucide-react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { Slider } from "@/components/ui/slider";
import {
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  LEVERAGE_STEP,
  clampLeverage,
  formatLeverage,
  isLeverageEnabled,
} from "@/lib/leverx/trade-limits";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { cn } from "@/lib/utils";
import {
  labelCaps,
  leveragePickerHeader,
  leveragePickerValue,
  pillToggleBtn,
  pillToggleIdle,
} from "@/lib/leverx/tw";

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Upper bound (e.g. 1× when leveraged mint window is closed). */
  maxLeverage?: number;
  info?: string;
  className?: string;
  disabled?: boolean;
}

export function LeverageSlider({
  value,
  onChange,
  maxLeverage = LEVERAGE_MAX,
  info = leverxInfo.leverage,
  className,
  disabled = false,
}: Props) {
  // Leverage disabled (Molfi = 1x spot prediction): render nothing.
  if (!isLeverageEnabled()) return null;

  const effectiveMax = Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, maxLeverage));
  const clamped = Math.min(clampLeverage(value), effectiveMax);

  const step = (delta: number) => {
    onChange(clampLeverage(clamped + delta));
  };

  return (
    <div className={className}>
      <div className={leveragePickerHeader}>
        <LabelWithInfo
          label="Leverage"
          labelClassName={labelCaps}
          info={info}
        />
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={cn(pillToggleBtn, pillToggleIdle, "flex h-7 w-7 items-center justify-center p-0")}
            aria-label="Decrease leverage"
            disabled={disabled || clamped <= LEVERAGE_MIN}
            onClick={() => step(-LEVERAGE_STEP)}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className={cn(leveragePickerValue, "min-w-[3ch] text-center")}>
            {formatLeverage(clamped)}
          </span>
          <button
            type="button"
            className={cn(pillToggleBtn, pillToggleIdle, "flex h-7 w-7 items-center justify-center p-0")}
            aria-label="Increase leverage"
            disabled={disabled || clamped >= effectiveMax}
            onClick={() => step(LEVERAGE_STEP)}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <Slider
        variant="leverage"
        min={LEVERAGE_MIN}
        max={effectiveMax}
        step={LEVERAGE_STEP}
        value={[clamped]}
        disabled={disabled}
        onValueChange={([next]) =>
          next != null && onChange(Math.min(clampLeverage(next), effectiveMax))
        }
        aria-label="Leverage multiplier"
      />
      <div className="mt-1.5 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>{formatLeverage(LEVERAGE_MIN)}</span>
        <span>{formatLeverage(effectiveMax)}</span>
      </div>
    </div>
  );
}
