export type MarketListView = "grid" | "list";

const STORAGE_KEY = "lx-markets-view";
const DEFAULT_VIEW: MarketListView = "grid";

function parseView(raw: string | null): MarketListView {
  if (raw === "grid" || raw === "list") return raw;
  return DEFAULT_VIEW;
}

export function readMarketListView(): MarketListView {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  try {
    return parseView(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_VIEW;
  }
}

export function writeMarketListView(view: MarketListView): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, view);
  } catch {
    /* private mode */
  }
}
