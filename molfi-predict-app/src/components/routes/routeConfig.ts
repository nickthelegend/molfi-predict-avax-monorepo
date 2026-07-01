import { lazy, ComponentType } from "react";

// Lazy load pages
const Index = lazy(() => import("@/pages/Index"));
const Waitlist = lazy(() => import("@/pages/Waitlist"));
const KeywordSearch = lazy(() => import("@/pages/KeywordSearch"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Rewards = lazy(() => import("@/pages/Rewards"));
const Games = lazy(() => import("@/pages/Games"));
const RedirectToMarkets = lazy(() => import("@/pages/RedirectToMarkets"));
const MarketTrade = lazy(() => import("@/pages/MarketTrade"));
const MarketsPlus = lazy(() => import("@/pages/MarketsPlus"));
const MarketDetail = lazy(() => import("@/pages/MarketDetail"));
const Portfolio = lazy(() => import("@/pages/Portfolio"));
const Vaults = lazy(() => import("@/pages/Vaults"));
const VaultLeaderboard = lazy(() => import("@/pages/VaultLeaderboard"));
const PriceAlerts = lazy(() => import("@/pages/PriceAlerts"));
const Notifications = lazy(() => import("@/pages/Notifications"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Arbitrage = lazy(() => import("@/pages/Arbitrage"));
const Settings = lazy(() => import("@/pages/Settings"));
const Admin = lazy(() => import("@/pages/Admin"));
const Profile = lazy(() => import("@/pages/Profile"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const BrandKit = lazy(() => import("@/pages/BrandKit"));
const Pitch = lazy(() => import("@/pages/Pitch"));
const ArchivedMarkets = lazy(() => import("@/pages/ArchivedMarkets"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ArenaOverview = lazy(() => import("@/pages/arena/ArenaOverview"));
const SeasonDetail = lazy(() => import("@/pages/arena/SeasonDetail"));
const CompetitionView = lazy(() => import("@/pages/arena/CompetitionView"));
const ArenaFinale = lazy(() => import("@/pages/arena/ArenaFinale"));
const TraderProfile = lazy(() => import("@/pages/arena/TraderProfile"));
const CompetitorHome = lazy(() => import("@/pages/arena/CompetitorHome"));
const ArenaRegister = lazy(() => import("@/pages/arena/ArenaRegister"));
const ArenaLearnMore = lazy(() => import("@/pages/arena/ArenaLearnMore"));
const ArenaPit = lazy(() => import("@/pages/arena/ArenaPit"));
const Wallet = lazy(() => import("@/pages/Wallet"));

// Molfi on-chain pages (read/write directly against the deployed contracts)
const MolfiDemo = lazy(() => import("@/pages/MolfiDemo"));
const StellarMarkets = lazy(() => import("@/pages/StellarMarkets"));
const StellarMarketDetail = lazy(() => import("@/pages/StellarMarketDetail"));
const Trade = lazy(() => import("@/pages/Trade"));

export type SkeletonType = "default" | "detail" | "table" | "dashboard";
export type TransitionType = "page" | "slide";

export interface RouteConfig {
  path: string;
  component: ComponentType;
  skeleton?: SkeletonType;
  transition?: TransitionType;
  /** If true, bypass waitlist gate (for dev/testing) */
  bypassGate?: boolean;
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ROUTES - No auth or waitlist required
// ─────────────────────────────────────────────────────────────
export const publicRoutes: RouteConfig[] = [
  { path: "/", component: Index, transition: "page" },
  { path: "/waitlist", component: Waitlist, transition: "page" },
  { path: "/privacy-policy", component: PrivacyPolicy, transition: "page" },
  { path: "/terms-of-service", component: TermsOfService, transition: "page" },
  // Markets browsing - publicly accessible
  // The real on-chain markets venue (formerly /markets-plus).
  { path: "/markets", component: MarketsPlus, transition: "page" },
  { path: "/markets/:slug", component: MarketTrade, skeleton: "detail", transition: "slide" },
  // Old paths → redirect to /markets.
  { path: "/markets-plus", component: RedirectToMarkets },
  { path: "/markets-plus/:id", component: MarketDetail, skeleton: "detail", transition: "slide" },
  { path: "/leaderboard", component: Leaderboard, skeleton: "table", transition: "page" },
  // Arena terminal - fully public for testing
  { path: "/arena/terminal", component: CompetitorHome, skeleton: "detail", transition: "slide" },
  // ── Molfi on-chain (live testnet contracts) ──
  { path: "/demo", component: MolfiDemo, transition: "page" },
  { path: "/markets-live", component: StellarMarkets, transition: "page" },
  { path: "/m/:id", component: StellarMarketDetail, skeleton: "detail", transition: "slide" },
  { path: "/trade", component: Trade, transition: "page" },
  { path: "/trade/:asset", component: Trade, transition: "page" },
];

// ─────────────────────────────────────────────────────────────
// GATED ROUTES - Require waitlist approval (admins bypass)
// ─────────────────────────────────────────────────────────────
export const gatedRoutes: RouteConfig[] = [
  { path: "/archived", component: ArchivedMarkets, transition: "page" },
  { path: "/search", component: KeywordSearch, transition: "page" },
  { path: "/earn", component: Vaults, transition: "page" },
  { path: "/vaults", component: Vaults, transition: "page" },
  { path: "/vault-leaderboard", component: VaultLeaderboard, skeleton: "table", transition: "page" },
  { path: "/brand-kit", component: BrandKit, transition: "page" },
  { path: "/pitch", component: Pitch, transition: "page" },
  { path: "/arbitrage", component: Arbitrage, skeleton: "table", transition: "page" },
];

// ─────────────────────────────────────────────────────────────
// PROTECTED ROUTES - Require wallet connection
// ─────────────────────────────────────────────────────────────
export const protectedRoutes: RouteConfig[] = [
  { path: "/profile", component: Profile, transition: "page" },
  { path: "/dashboard", component: Dashboard, skeleton: "dashboard", transition: "page" },
  { path: "/portfolio", component: Portfolio, skeleton: "dashboard", transition: "page" },
  { path: "/price-alerts", component: PriceAlerts, skeleton: "table", transition: "page" },
  { path: "/notifications", component: Notifications, transition: "page" },
  { path: "/rewards", component: Rewards, transition: "page" },
  { path: "/games", component: Games, transition: "page" },
  { path: "/settings", component: Settings, transition: "page" },
  { path: "/wallet", component: Wallet, transition: "page" },
  { path: "/admin", component: Admin, skeleton: "dashboard", transition: "page" },
];

// ─────────────────────────────────────────────────────────────
// ARENA ROUTES - Gated + specific to Arena feature
// ─────────────────────────────────────────────────────────────
export const arenaRoutes: RouteConfig[] = [
  { path: "/arena", component: ArenaOverview, transition: "page" },
  { path: "/arena/learn", component: ArenaLearnMore, transition: "page" },
  { path: "/arena/register", component: ArenaRegister, transition: "slide" },
  { path: "/arena/pit", component: ArenaPit, skeleton: "detail", transition: "slide" },
  { path: "/arena/compete", component: CompetitorHome, skeleton: "detail", transition: "slide", bypassGate: true },
  { path: "/arena/season/:id", component: SeasonDetail, skeleton: "detail", transition: "slide" },
  { path: "/arena/competition/:id", component: CompetitionView, skeleton: "detail", transition: "slide" },
  { path: "/arena/competitor/:id", component: CompetitorHome, skeleton: "detail", transition: "slide" },
  { path: "/arena/finale", component: ArenaFinale, transition: "slide" },
  { path: "/arena/trader/:id", component: TraderProfile, skeleton: "detail", transition: "slide" },
];

// ─────────────────────────────────────────────────────────────
// CATCH-ALL
// ─────────────────────────────────────────────────────────────
export const notFoundRoute: RouteConfig = {
  path: "*",
  component: NotFound,
  transition: "page",
};
