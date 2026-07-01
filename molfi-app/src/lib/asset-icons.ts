import btcIcon from "@/assets/btc.png";
import suiIcon from "@/assets/sui.png";
import usdcIcon from "@/assets/usdc.png";
import { normalizeProtectionBase } from "@/lib/markets";

/** Icons under `src/assets/` — import here so Vite bundles them. */
const ASSET_ICON_BY_SYMBOL: Record<string, string> = {
  BTC: btcIcon,
  DBTC: btcIcon,
  SUI: suiIcon,
  USDC: usdcIcon,
  DUSDC: usdcIcon,
  DBUSDC: usdcIcon,
  DBUSDT: usdcIcon,
  USDT: usdcIcon,
};

/** Resolve a coin symbol (e.g. DUSDC, BTC/USD) to a bundled icon URL, if we have one. */
export function assetIconUrl(symbol: string): string | undefined {
  const raw = symbol.trim().toUpperCase();
  if (!raw) return undefined;

  const direct = ASSET_ICON_BY_SYMBOL[raw];
  if (direct) return direct;

  const normalized = normalizeProtectionBase(symbol);
  if (normalized && ASSET_ICON_BY_SYMBOL[normalized]) {
    return ASSET_ICON_BY_SYMBOL[normalized];
  }

  const first = raw.split(/[/\s_-]/)[0];
  return first ? ASSET_ICON_BY_SYMBOL[first] : undefined;
}

export function hasAssetIcon(symbol: string): boolean {
  return assetIconUrl(symbol) != null;
}

const QUOTE_ASSET_SYMBOLS = new Set(["USDC", "DUSDC", "DBUSDC", "USDT", "DBUSDT"]);

/** True when the symbol should render with the quote icon instead of a text suffix. */
export function isQuoteAssetSymbol(symbol: string): boolean {
  return QUOTE_ASSET_SYMBOLS.has(symbol.trim().toUpperCase());
}
