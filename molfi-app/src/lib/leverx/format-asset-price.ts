import { formatDecimalWithSubscript, truncateToFractionDigits } from "@/lib/format-decimal-subscript";

/** Full USD asset price — never K/M/B/T (oracle spot, strikes, chart guides). */
export function formatAssetPriceUsd(
  usd: number,
  options?: { maximumFractionDigits?: number },
): string {
  if (!Number.isFinite(usd) || usd <= 0) return "—";

  const subscript = formatDecimalWithSubscript(usd);
  if (subscript !== null) return subscript;

  const maximumFractionDigits = options?.maximumFractionDigits ?? 2;
  const truncated = truncateToFractionDigits(usd, maximumFractionDigits);
  return truncated.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

export function formatAssetPriceUsdWithSymbol(
  usd: number,
  options?: { maximumFractionDigits?: number },
): string {
  return `$${formatAssetPriceUsd(usd, options)}`;
}

/** On-chain strike field (1e9 scale) → full USD label. */
export function formatStrikeUsdFromRaw(strikeRaw: number): string {
  if (strikeRaw <= 0) return "—";
  return formatAssetPriceUsdWithSymbol(strikeRaw / 1e9);
}
