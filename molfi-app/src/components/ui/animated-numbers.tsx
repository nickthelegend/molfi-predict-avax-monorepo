import type { ComponentPropsWithoutRef } from "react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatAmountWithMaxDigits } from "@/lib/copy";
import { formatAssetPriceUsdWithSymbol } from "@/lib/leverx/format-asset-price";
import { formatQuantity } from "@/lib/leverx/format-quantity";
import { premiumToCents } from "@/lib/leverx/indexer-markets";
import { formatPnlUsd } from "@/lib/leverx/position-metrics";
import { DATA_PLACEHOLDER } from "@/lib/leverx/placeholders";
import { costFromPremiumPerUnit } from "@/lib/leverx/trade-math";
import { scaleQuote } from "@/lib/predict/scaling";
import { cn } from "@/lib/utils";

type PresetProps = Omit<ComponentPropsWithoutRef<typeof AnimatedNumber>, "value" | "format"> & {
  value: number | null | undefined;
  animate?: boolean;
};

function formatCompactUsdValue(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

function levelNotionalUsd(price: number, size: number): number | null {
  if (price <= 0 || size <= 0) return null;
  const quoteAtoms = Number(costFromPremiumPerUnit(BigInt(price), BigInt(size)));
  const usd = scaleQuote(quoteAtoms);
  return usd > 0 ? usd : null;
}

function formatLevelNotionalUsd(usd: number): string {
  if (usd >= 1000) return `$${formatAmountWithMaxDigits(usd / 1000, 1)}K`;
  return `$${formatAmountWithMaxDigits(usd, usd >= 10 ? 0 : 2)}`;
}

/** Contract premium in raw 1e9 scale → animated ¢ display. */
export function AnimatedPremium({ value, animate = true, decimals = 1, ...props }: PresetProps) {
  const cents = value != null && value > 0 ? premiumToCents(value) : null;
  return (
    <AnimatedNumber
      value={cents}
      enabled={animate}
      decimals={decimals}
      format={(v) => `${v.toFixed(1)}¢`}
      {...props}
    />
  );
}

/** Premium already in cents (0–100). */
export function AnimatedPremiumCents({ value, animate = true, decimals = 1, ...props }: PresetProps) {
  return (
    <AnimatedNumber
      value={value}
      enabled={animate}
      decimals={decimals}
      format={(v) => `${v.toFixed(1)}¢`}
      {...props}
    />
  );
}

export function AnimatedMarketPremium({
  premium,
  quotePaused,
  loading,
  animate = true,
  className,
}: {
  premium?: number | null;
  quotePaused?: boolean;
  loading?: boolean;
  animate?: boolean;
  className?: string;
}) {
  if (loading) {
    return <Skeleton className={cn("h-5 w-12", className)} />;
  }
  if (quotePaused) {
    return <span className={className}>0¢</span>;
  }
  return (
    <AnimatedPremium
      value={premium}
      animate={animate}
      className={className}
      placeholder={DATA_PLACEHOLDER}
    />
  );
}

export function AnimatedQuantity({ value, animate = true, ...props }: PresetProps) {
  return (
    <AnimatedNumber
      value={value != null && value > 0 ? value : null}
      enabled={animate}
      format={(v) => formatQuantity(v)}
      {...props}
    />
  );
}

export function AnimatedCount({ value, animate = true, ...props }: PresetProps) {
  return (
    <AnimatedNumber
      value={value != null && value >= 0 ? value : null}
      enabled={animate}
      format={(v) => formatCount(v)}
      decimals={0}
      {...props}
    />
  );
}

export function AnimatedCompactUsd({
  value,
  hideZero,
  animate = true,
  placeholder = DATA_PLACEHOLDER,
  ...props
}: PresetProps & { hideZero?: boolean }) {
  const display =
    value != null && Number.isFinite(value) && (!hideZero || value > 0) ? value : null;
  return (
    <AnimatedNumber
      value={display}
      enabled={animate}
      placeholder={placeholder}
      format={formatCompactUsdValue}
      {...props}
    />
  );
}

export function AnimatedAssetPrice({ value, animate = true, ...props }: PresetProps) {
  return (
    <AnimatedNumber
      value={value != null && value > 0 ? value : null}
      enabled={animate}
      format={(v) => formatAssetPriceUsdWithSymbol(v)}
      {...props}
    />
  );
}

export function AnimatedPnl({ value, animate = true, ...props }: PresetProps) {
  return (
    <AnimatedNumber
      value={value != null && Number.isFinite(value) ? value : null}
      enabled={animate}
      decimals={2}
      format={(v) => formatPnlUsd(v)}
      {...props}
    />
  );
}

export function AnimatedPercent({
  value,
  fractionDigits = 2,
  animate = true,
  ...props
}: PresetProps & { fractionDigits?: number }) {
  return (
    <AnimatedNumber
      value={value != null && Number.isFinite(value) ? value * 100 : null}
      enabled={animate}
      decimals={fractionDigits}
      format={(v) => `${v.toFixed(fractionDigits)}%`}
      {...props}
    />
  );
}

export function AnimatedLevelNotional({
  price,
  size,
  animate = true,
  className,
}: {
  price: number;
  size: number;
  animate?: boolean;
  className?: string;
}) {
  return (
    <AnimatedNumber
      value={levelNotionalUsd(price, size)}
      enabled={animate}
      className={className}
      format={formatLevelNotionalUsd}
    />
  );
}
