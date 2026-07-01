import { TradeAmountInput } from "@/components/leverx/TradeFormControls";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { AnimatedAssetPrice } from "@/components/ui/animated-numbers";
import {
  formatRangeBoundsFromRaw,
  formatStrikeUsdFromRaw,
  RANGE_PRESET_OPTIONS,
  rangeWidthPct,
  type RangePresetId,
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
  preset: RangePresetId;
  onPresetChange: (preset: RangePresetId) => void;
  customLowerUsd: string;
  customUpperUsd: string;
  onCustomLowerChange: (value: string) => void;
  onCustomUpperChange: (value: string) => void;
  lowerStrikeRaw: number;
  upperStrikeRaw: number;
  oracleSpotUsd?: number | null;
  minStrikeRaw: number;
  disabled?: boolean;
}

export function RangeStrikeSelector({
  preset,
  onPresetChange,
  customLowerUsd,
  customUpperUsd,
  onCustomLowerChange,
  onCustomUpperChange,
  lowerStrikeRaw,
  upperStrikeRaw,
  oracleSpotUsd,
  minStrikeRaw,
  disabled = false,
}: Props) {
  const showCustom = preset === "custom";
  const minStrikeLabel =
    minStrikeRaw > 0 ? formatStrikeUsdFromRaw(minStrikeRaw) : null;
  const widthPct = rangeWidthPct(lowerStrikeRaw, upperStrikeRaw, oracleSpotUsd);
  const rangeValid = lowerStrikeRaw > 0 && upperStrikeRaw > lowerStrikeRaw;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <LabelWithInfo
          label="Price range"
          labelClassName={labelCaps}
          info={leverxInfo.rangePreset}
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

      <p className="text-sm leading-relaxed text-muted-foreground">
        Pays if the final price settles inside your band at expiry.
      </p>

      <div className={cn(segTabsScroll, "seg-tabs-scroll-fade -mx-1 px-1")}>
        <div
          className={cn(pillToggleGroup, "inline-flex min-w-max flex-nowrap")}
          role="group"
          aria-label="Range width"
        >
          {RANGE_PRESET_OPTIONS.map((option) => (
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

      {showCustom ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <LabelWithInfo
              className={cn(labelCaps, "mb-2")}
              label="Low end"
              labelClassName={labelCaps}
              info={leverxInfo.lowerStrike}
            />
            <TradeAmountInput
              prefix="$"
              large
              type="number"
              inputMode="decimal"
              min={0}
              value={customLowerUsd}
              onChange={(e) => onCustomLowerChange(e.target.value)}
              placeholder="Low"
              disabled={disabled}
            />
          </div>
          <div>
            <LabelWithInfo
              className={cn(labelCaps, "mb-2")}
              label="High end"
              labelClassName={labelCaps}
              info={leverxInfo.upperStrike}
            />
            <TradeAmountInput
              prefix="$"
              large
              type="number"
              inputMode="decimal"
              min={0}
              value={customUpperUsd}
              onChange={(e) => onCustomUpperChange(e.target.value)}
              placeholder="High"
              disabled={disabled}
            />
          </div>
          {minStrikeLabel ? (
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Minimum strike:{" "}
              <span className="font-mono text-foreground">{minStrikeLabel}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-lg border border-border bg-surface/60 px-3 py-2.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted-foreground">Your range</span>
          <span className="font-mono text-sm font-medium text-foreground">
            {rangeValid
              ? formatRangeBoundsFromRaw(lowerStrikeRaw, upperStrikeRaw)
              : "—"}
          </span>
        </div>
        {rangeValid && widthPct != null ? (
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            Band width{" "}
            <span className="font-mono text-foreground">{widthPct.toFixed(1)}%</span>{" "}
            of spot
          </p>
        ) : null}
      </div>
    </div>
  );
}
