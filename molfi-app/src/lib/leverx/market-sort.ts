import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";

export const MARKET_SORT_OPTIONS = [
  { id: "volume-desc", label: "Highest volume" },
  { id: "ending-soon", label: "Ending soon" },
  { id: "price-desc", label: "Highest price" },
  { id: "price-asc", label: "Lowest price" },
] as const;

export type MarketSortOptionId = (typeof MARKET_SORT_OPTIONS)[number]["id"];
export type MarketSortId = MarketSortOptionId | "ending-latest";

export type MarketSortKey = "volume" | "expiry" | "price" | "liquidity";
export type MarketSortDir = "asc" | "desc";

export const DEFAULT_MARKET_SORT: MarketSortId = "ending-soon";

export function marketSortLabel(sort: MarketSortId): string {
  const option = MARKET_SORT_OPTIONS.find((entry) => entry.id === sort);
  if (option) return option.label;
  if (sort === "ending-latest") return "Ending latest";
  return "Sort";
}

export function marketSortToKeyDir(sort: MarketSortId): {
  key: MarketSortKey;
  dir: MarketSortDir;
} {
  switch (sort) {
    case "ending-soon":
      return { key: "expiry", dir: "asc" };
    case "ending-latest":
      return { key: "expiry", dir: "desc" };
    case "price-desc":
      return { key: "price", dir: "desc" };
    case "price-asc":
      return { key: "price", dir: "asc" };
    case "volume-desc":
    default:
      return { key: "volume", dir: "desc" };
  }
}

export function marketSortFromKeyDir(key: MarketSortKey, dir: MarketSortDir): MarketSortId {
  if (key === "expiry") return dir === "asc" ? "ending-soon" : "ending-latest";
  if (key === "price") return dir === "asc" ? "price-asc" : "price-desc";
  return "volume-desc";
}

export function toggleMarketTableSort(sort: MarketSortId, key: MarketSortKey): MarketSortId {
  const current = marketSortToKeyDir(sort);
  if (current.key === key) {
    return marketSortFromKeyDir(key, current.dir === "asc" ? "desc" : "asc");
  }
  return marketSortFromKeyDir(key, key === "expiry" ? "asc" : "desc");
}

export function sortMarketRows(
  markets: readonly LeverxMarketRow[],
  sort: MarketSortId,
): LeverxMarketRow[] {
  const { key, dir } = marketSortToKeyDir(sort);
  const rows = [...markets];
  const factor = dir === "asc" ? 1 : -1;

  rows.sort((a, b) => {
    switch (key) {
      case "price":
        return ((a.lastAskPremium ?? 0) - (b.lastAskPremium ?? 0)) * factor;
      case "volume":
      case "liquidity":
        return (a.volume - b.volume) * factor;
      case "expiry":
        return (a.expiry - b.expiry) * factor;
      default:
        return 0;
    }
  });

  return rows;
}
