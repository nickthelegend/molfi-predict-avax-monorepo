/** Map testnet coin symbols to display base assets. */
export function normalizeProtectionBase(symbol: string): string {
  const token =
    symbol
      .trim()
      .toUpperCase()
      .split(/[/\s_-]/)[0] ?? "";
  if (!token) return "";
  if (token === "DBTC") return "BTC";
  return token;
}

/** Parse predict oracle `underlying_asset` into a single base symbol. */
export function baseFromUnderlying(underlying: string): string {
  return normalizeProtectionBase(underlying);
}

function marketIdFor(base: string, quote = "USDT"): string {
  return `${base}-${quote}`.toLowerCase();
}

/** Lightweight market id row for oracle catalog tables. */
export function makeTradeMarket(base: string, quote = "USDT") {
  const normalized = normalizeProtectionBase(base);
  return {
    id: marketIdFor(normalized, quote),
    base: normalized,
  };
}
