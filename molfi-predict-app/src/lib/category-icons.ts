/**
 * Maps market categories/titles to Lucide icon names for fallback display
 */
import {
  Trophy, Vote, Bitcoin, Cpu, Cloud, Landmark, Globe,
  Microscope, Clapperboard, Gamepad2, Plane, Heart,
  TrendingUp, type LucideIcon,
} from "lucide-react";

const categoryIconMap: Record<string, LucideIcon> = {
  sports: Trophy,
  politics: Vote,
  crypto: Bitcoin,
  technology: Cpu,
  tech: Cpu,
  weather: Cloud,
  economics: Landmark,
  finance: Landmark,
  world: Globe,
  global: Globe,
  science: Microscope,
  entertainment: Clapperboard,
  culture: Clapperboard,
  gaming: Gamepad2,
  travel: Plane,
  health: Heart,
};

// Keywords to match when category isn't explicitly set
const titleKeywords: [RegExp, LucideIcon][] = [
  [/\b(nba|nfl|mlb|nhl|fifa|premier league|super bowl|championship|tennis|golf|soccer|football|baseball|basketball|hockey|ufc|boxing|f1|formula|olympics|world cup)\b/i, Trophy],
  [/\b(president|election|senate|congress|governor|vote|democrat|republican|trump|biden|political|fed chair|supreme court)\b/i, Vote],
  [/\b(bitcoin|btc|ethereum|eth|crypto|token|blockchain|defi|nft|solana|sol|memecoin|altcoin|market cap)\b/i, Bitcoin],
  [/\b(ai|artificial intelligence|tech|apple|google|microsoft|openai|chip|semiconductor)\b/i, Cpu],
  [/\b(movie|oscar|grammy|emmy|album|box office|netflix|disney|spotify|music|film|tv show|celebrity)\b/i, Clapperboard],
  [/\b(climate|weather|hurricane|tornado|temperature|earthquake)\b/i, Cloud],
  [/\b(gdp|inflation|interest rate|fed|recession|stock|s&p|nasdaq|dow|economy|unemployment)\b/i, Landmark],
];

/**
 * Get a Lucide icon component for a market based on its category or title.
 */
export function getCategoryIcon(category?: string, title?: string): LucideIcon {
  // Try explicit category first
  if (category) {
    const key = category.toLowerCase().trim();
    if (categoryIconMap[key]) return categoryIconMap[key];
  }

  // Try matching title keywords
  if (title) {
    for (const [pattern, icon] of titleKeywords) {
      if (pattern.test(title)) return icon;
    }
  }

  // Default fallback
  return TrendingUp;
}
