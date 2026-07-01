import { appConfig } from "@/lib/config";
import { formatAmount } from "@/lib/copy";

/** Ensure full `0x…::module::TYPE` form for RPC and comparisons. */
export function normalizeQuoteAssetType(coinType: string): string {
  const trimmed = coinType.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("0x")) return trimmed;

  const sep = trimmed.indexOf("::");
  if (sep === -1) return `0x${trimmed}`;
  return `0x${trimmed}`;
}

/** Display symbol from a predict quote coin type, e.g. `…::dusdc::DUSDC` → `DUSDC`. */
export function quoteAssetSymbol(coinType: string): string {
  const normalized = normalizeQuoteAssetType(coinType);
  const parts = normalized.split("::");
  const symbol = parts[parts.length - 1]?.trim();
  return symbol ? symbol.toUpperCase() : normalized;
}

export function normalizeQuoteAssetList(types: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of types) {
    const normalized = normalizeQuoteAssetType(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  if (out.length === 0) {
    out.push(normalizeQuoteAssetType(appConfig.quoteType));
  }

  return out;
}

export function formatCollateralAmount(coinType: string, amount: number): string {
  const symbol = quoteAssetSymbol(coinType);
  if (!Number.isFinite(amount)) return `0 ${symbol}`;
  return `${formatAmount(amount)} ${symbol}`;
}
