import { TradeAmountInput } from "@/components/leverx/TradeFormControls";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { AnimatedAssetPrice } from "@/components/ui/animated-numbers";
import {
  formatStrikeUsdFromRaw,
  STRIKE_PRESET_OPTIONS,
  type StrikePresetId,
} from "@/lib/leverx/strike-selection";
import {
  labelCaps,
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
  segTabsScroll,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  preset: StrikePresetId;
  onPresetChange: (preset: StrikePresetId) => void;
  customStrikeUsd: string;
  onCustomStrikeChange: (value: string) => void;
  resolvedStrikeRaw: number;
  oracleSpotUsd?: number | null;
  minStrikeRaw: number;
  disabled?: boolean;
}

export function StrikePriceSelector({
  preset,
  onPresetChange,
  customStrikeUsd,
  onCustomStrikeChange,
  resolvedStrikeRaw,
  oracleSpotUsd,
  minStrikeRaw,
  disabled = false,
}: Props) {
  const showCustomInput = preset === "custom";
  const minStrikeLabel =
    minStrikeRaw > 0 ? formatStrikeUsdFromRaw(minStrikeRaw) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <LabelWithInfo
          label="Strike price"
          labelClassName={labelCaps}
          info={leverxInfo.strikePrice}
        />
        {oracleSpotUsd != null && oracleSpotUsd > 0 ? (
          <span className="shrink-0 text-sm text-muted-foreground">
            Spot{" "}
            <span className="font-mono text-foreground">
            <AnimatedAssetPrice value={oracleSpotUsd} className="text-foreground" />
            </span>
          </span>
        ) : null}
      </div>

      <div className={cn(segTabsScroll, "seg-tabs-scroll-fade -mx-1 px-1")}>
        <div
          className={cn(pillToggleGroup, "inline-flex min-w-max flex-nowrap")}
          role="group"
          aria-label="Strike offset"
        >
          {STRIKE_PRESET_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              className={cn(
                pillToggleBtn,
                "whitespace-nowrap px-2 py-1.5 sm:px-2.5",
                preset === option.id ? pillToggleActive : pillToggleIdle,
                disabled && "pointer-events-none opacity-50",
              )}
              onClick={() => onPresetChange(option.id)}
              aria-pressed={preset === option.id}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {showCustomInput ? (
        <div>
          <TradeAmountInput
            prefix="$"
            large
            type="number"
            inputMode="decimal"
            min={0}
            value={customStrikeUsd}
            onChange={(e) => onCustomStrikeChange(e.target.value)}
            placeholder="Enter strike"
            disabled={disabled}
          />
          {minStrikeLabel ? (
            <p className="mt-1.5 text-sm text-muted-foreground">
              Minimum strike:{" "}
              <span className="font-mono text-foreground">{minStrikeLabel}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-baseline justify-between gap-2 rounded-lg border border-border bg-surface/60 px-3 py-2">
        <span className="text-sm text-muted-foreground">Your strike</span>
        <span className="font-mono text-sm font-medium text-foreground">
          {formatStrikeUsdFromRaw(resolvedStrikeRaw)}
        </span>
      </div>
    </div>
  );
}
