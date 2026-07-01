/** Market categories shown as tabs on /markets. Crypto is the live priority venue. */
export interface MarketCategoryDef {
  id: string;
  label: string;
  /** Where the category's markets come from. */
  source: "stellar" | "polymarket" | "onchain";
  /** Polymarket Gamma tag id (for future categories). */
  tagId?: number;
  /** Not live yet — shows a "coming soon" panel. */
  comingSoon?: boolean;
}

export const MARKET_CATEGORIES: MarketCategoryDef[] = [
  { id: "crypto", label: "Crypto", source: "stellar" },
  { id: "sports", label: "Sports", source: "polymarket", tagId: 1, comingSoon: true },
  { id: "politics", label: "Politics", source: "polymarket", tagId: 2, comingSoon: true },
  { id: "economy", label: "Economy", source: "polymarket", tagId: 100328, comingSoon: true },
  { id: "culture", label: "Culture", source: "polymarket", tagId: 596, comingSoon: true },
];

export const DEFAULT_CATEGORY = "crypto";

export function findCategory(id: string): MarketCategoryDef {
  return MARKET_CATEGORIES.find((c) => c.id === id) ?? MARKET_CATEGORIES[0]!;
}
