/**
 * Polymarket Gamma API — public, no-auth, CORS-open. Used to pull live
 * real-world reference markets (sports, politics, …) to show alongside Molfi's
 * on-chain Stellar markets. Docs: https://docs.polymarket.com/developers/gamma-markets-api/overview
 */
const GAMMA_BASE = "https://gamma-api.polymarket.com";

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  image: string | null;
  icon: string | null;
  /** Implied YES probability, 0–1. */
  yesPrice: number | null;
  noPrice: number | null;
  volume24h: number;
  liquidity: number;
  /** Close time in ms (or null). */
  endDate: number | null;
  active: boolean;
  closed: boolean;
}

/** Gamma returns `outcomes` / `outcomePrices` as STRINGIFIED JSON, not arrays. */
function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** S3 image filenames can contain spaces — encode so <img src> is valid. */
function safeUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  try {
    return encodeURI(url);
  } catch {
    return null;
  }
}

interface RawMarket {
  id?: string | number;
  question?: string;
  slug?: string;
  image?: string;
  icon?: string;
  outcomes?: string;
  outcomePrices?: string;
  volume24hr?: number | string;
  volume?: number | string;
  liquidity?: number | string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
}

function mapMarket(m: RawMarket): PolymarketMarket {
  const outcomes = parseJsonArray(m.outcomes).map((s) => s.toLowerCase());
  const prices = parseJsonArray(m.outcomePrices).map((s) => Number(s));
  const yesIdx = outcomes.indexOf("yes");
  const yes = yesIdx >= 0 ? prices[yesIdx] : prices[0];
  const no = yesIdx >= 0 ? prices[yesIdx === 0 ? 1 : 0] : prices[1];
  return {
    id: String(m.id ?? m.slug ?? ""),
    question: m.question ?? m.slug ?? "Market",
    slug: m.slug ?? "",
    image: safeUrl(m.image ?? m.icon),
    icon: safeUrl(m.icon ?? m.image),
    yesPrice: Number.isFinite(yes) ? (yes as number) : null,
    noPrice: Number.isFinite(no) ? (no as number) : null,
    volume24h: Number(m.volume24hr ?? m.volume ?? 0) || 0,
    liquidity: Number(m.liquidity ?? 0) || 0,
    endDate: m.endDate ? Date.parse(m.endDate) || null : null,
    active: Boolean(m.active),
    closed: Boolean(m.closed),
  };
}

/** Hottest active binary markets, optionally filtered to a category tag. */
export async function fetchPolymarketMarkets(opts: {
  tagId?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<PolymarketMarket[]> {
  const params = new URLSearchParams({
    active: "true",
    closed: "false",
    order: "volume24hr",
    ascending: "false",
    limit: String(opts.limit ?? 24),
  });
  if (opts.tagId != null) params.set("tag_id", String(opts.tagId));

  const res = await fetch(`${GAMMA_BASE}/markets?${params.toString()}`, {
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Polymarket Gamma ${res.status}`);
  const data = (await res.json()) as RawMarket[] | { data?: RawMarket[] };
  const list = Array.isArray(data) ? data : (data?.data ?? []);
  return list
    .map(mapMarket)
    .filter((m) => m.id && m.question && (m.yesPrice != null || m.volume24h > 0));
}
