import { formatDecimalWithSubscript, truncateToFractionDigits } from "@/lib/format-decimal-subscript";

function formatSubThousand(abs: number): string {
  const subscript = formatDecimalWithSubscript(abs);
  if (subscript !== null) return subscript;
  if (Number.isInteger(abs)) return abs.toLocaleString("en-US");
  const truncated = truncateToFractionDigits(abs, 3);
  return truncated.toFixed(3).replace(/\.?0+$/, "");
}

function compactScaled(value: number, divisor: number, suffix: string): string {
  const scaled = value / divisor;
  const text = scaled.toFixed(3).replace(/\.?0+$/, "");
  return `${text}${suffix}`;
}

/** Compact counts and balances — not for oracle spot or strike prices (use `format-asset-price`). */
export function formatQuantity(value: number | bigint): string {
  const n = typeof value === "bigint" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  if (n === 0) return "0";

  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);

  if (abs < 1_000) return sign + formatSubThousand(abs);

  if (abs >= 1_000_000_000_000) return sign + compactScaled(abs, 1_000_000_000_000, "T");
  if (abs >= 1_000_000_000) return sign + compactScaled(abs, 1_000_000_000, "B");
  if (abs >= 1_000_000) return sign + compactScaled(abs, 1_000_000, "M");
  return sign + compactScaled(abs, 1_000, "K");
}

export function formatDusdc(amount: number): string {
  return `${formatQuantity(amount)} dUSDC`;
}
