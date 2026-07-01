import { Settings2 } from "lucide-react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { SLIPPAGE_PRESET_PCTS } from "@/lib/leverx/constants";
import {
  availableLimitOrderExpiryPresets,
  formatLimitOrderExpiryLabel,
} from "@/lib/leverx/trade-limits";
import { cn } from "@/lib/utils";
import {
  inputInField,
  labelCaps,
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
} from "@/lib/leverx/tw";

interface Props {
  placementSlippagePct: number;
  orderExpiresOffsetMs: number;
  onPlacementSlippageChange: (value: number) => void;
  onOrderExpiresOffsetMsChange: (value: number) => void;
  /** Market expiry — filters resting duration presets. */
  marketExpiryMs?: number;
  /** When false, resting limits cannot be placed (final hour / expiry too soon). */
  restingAllowed?: boolean;
  className?: string;
}

function formatSlippagePct(value: number): string {
  return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
}

function SlippageInput({
  value,
  onChange,
  label,
  info,
  hint,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
  info: string;
  hint: string;
}) {
  return (
    <div>
      <LabelWithInfo label={label} labelClassName={labelCaps} info={info} />
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      <div className={cn(pillToggleGroup, "mt-2 w-full")} role="group" aria-label="Slippage presets">
        {SLIPPAGE_PRESET_PCTS.map((pct) => (
          <button
            key={pct}
            type="button"
            className={cn(
              pillToggleBtn,
              "flex-1 font-mono",
              value === pct ? pillToggleActive : pillToggleIdle,
            )}
            onClick={() => onChange(pct)}
            aria-pressed={value === pct}
          >
            {pct}%
          </button>
        ))}
      </div>
      <Input
        type="number"
        inputMode="decimal"
        min={0.1}
        step={0.1}
        value={value}
        onChange={(e) => {
          const next = parseFloat(e.target.value);
          onChange(Number.isFinite(next) && next >= 0.1 ? next : 0.1);
        }}
        className={cn(inputInField, "mt-2 h-9 rounded-md border border-border px-3 font-mono")}
      />
    </div>
  );
}

export function MarketSlippagePopover({
  slippagePct,
  onSlippageChange,
  className,
}: {
  slippagePct: number;
  onSlippageChange: (value: number) => void;
  className?: string;
}) {
  const summary = formatSlippagePct(slippagePct);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
            className,
          )}
          aria-label={`Market slippage, ${summary}`}
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono text-foreground">{summary}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <SlippageInput
          value={slippagePct}
          onChange={onSlippageChange}
          label="Slippage"
          info={leverxInfo.marketSlippage}
          hint="Extra headroom above the quoted mint cost if the market moves before your trade executes."
        />
      </PopoverContent>
    </Popover>
  );
}

export function SlippagePopover({
  placementSlippagePct,
  orderExpiresOffsetMs,
  onPlacementSlippageChange,
  onOrderExpiresOffsetMsChange,
  marketExpiryMs,
  restingAllowed = true,
  className,
}: Props) {
  const expiryPresets =
    marketExpiryMs && marketExpiryMs > 0
      ? availableLimitOrderExpiryPresets(marketExpiryMs)
      : [];
  const canRest = restingAllowed && expiryPresets.length > 0;
  const summary = canRest
    ? `${formatSlippagePct(placementSlippagePct)} | ${formatLimitOrderExpiryLabel(orderExpiresOffsetMs)}`
    : formatSlippagePct(placementSlippagePct);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
            className,
          )}
          aria-label={`Limit order settings, ${summary}`}
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" />
          <span className="font-mono text-foreground">{summary}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        {!canRest ? (
          <p className="text-sm text-muted-foreground">
            Resting limits are unavailable in the final hour or when the market closes too soon.
          </p>
        ) : null}
        <SlippageInput
          value={placementSlippagePct}
          onChange={onPlacementSlippageChange}
          label="Price tolerance"
          info={leverxInfo.placementSlippage}
          hint="Live price must be within ± this % of your limit to place the order. The same cap applies when it fills."
        />
        {canRest ? (
          <div>
            <LabelWithInfo
              label="Order expires"
              labelClassName={labelCaps}
              info={leverxInfo.orderExpires}
            />
            <div className={cn(pillToggleGroup, "mt-2 flex-wrap")} role="group">
              {expiryPresets.map((preset) => (
                <button
                  key={preset.ms}
                  type="button"
                  className={cn(
                    pillToggleBtn,
                    orderExpiresOffsetMs === preset.ms ? pillToggleActive : pillToggleIdle,
                  )}
                  onClick={() => onOrderExpiresOffsetMsChange(preset.ms)}
                  aria-pressed={orderExpiresOffsetMs === preset.ms}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
