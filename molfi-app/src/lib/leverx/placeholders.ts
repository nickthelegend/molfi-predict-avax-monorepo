import { formatUsdc, formatAmount } from "@/lib/copy";
import { formatQuantity } from "@/lib/leverx/format-quantity";

/** Shown when indexer data is missing or unreachable — never blocks the page. */
export const DATA_PLACEHOLDER = "_";

export function orPlaceholder(
  value: string | number | null | undefined,
  formatter?: (value: number) => string,
): string {
  if (value == null) return DATA_PLACEHOLDER;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return DATA_PLACEHOLDER;
    return formatter ? formatter(value) : String(value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : DATA_PLACEHOLDER;
}

export function formatUsdcOrPlaceholder(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return DATA_PLACEHOLDER;
  return formatUsdc(amount);
}

export function formatCompactUsdOrPlaceholder(amount: number | null | undefined): string {
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return DATA_PLACEHOLDER;
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}

export function formatPercentOrPlaceholder(
  bps: number | null | undefined,
  fractionDigits = 2,
): string {
  if (bps == null || !Number.isFinite(bps)) return DATA_PLACEHOLDER;
  return `${(bps / 100).toFixed(fractionDigits)}%`;
}

export function formatCountOrPlaceholder(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value < 0) return DATA_PLACEHOLDER;
  return value.toLocaleString();
}

export function formatQuantityOrPlaceholder(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return DATA_PLACEHOLDER;
  return formatQuantity(value);
}

/** USDC balance row — distinguishes zero (0 USDC) from unknown (_). */
export function formatUsdcBalance(amount: number | null | undefined, ready: boolean): string {
  if (!ready) return "…";
  if (amount == null || !Number.isFinite(amount)) return DATA_PLACEHOLDER;
  if (amount === 0) return "0 USDC";
  return formatUsdc(amount);
}

/** Market settlement time — e.g. "Jun 12, 15:45". */
export function formatAutoClose(expiry: number): string {
  return new Date(expiry).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Compact pill label in the header. */
export function formatUsdcPill(amount: number | null | undefined, ready: boolean): string {
  if (!ready) return "…";
  if (amount == null || !Number.isFinite(amount)) return DATA_PLACEHOLDER;
  if (amount === 0) return "0";
  if (amount >= 1_000_000) return `${formatAmount(amount / 1_000_000)}M`;
  if (amount >= 1_000) return `${formatAmount(amount / 1_000)}K`;
  return formatAmount(amount);
}
