import { useRouterState } from "@tanstack/react-router";
import { LayoutGrid, List, Search } from "lucide-react";
import { AppSiteShell } from "@/components/AppSiteShell";
import { SiteShell } from "@/components/SiteShell";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { MarketsHeroSection } from "@/components/leverx/MarketsHeroSection";
import { UnderlineTabs } from "@/components/leverx/UnderlineTabs";
import {
  MarketsCatalogSkeleton,
  PointsLeaderboardSkeleton,
  PortfolioPageSkeleton,
  PositionsTableSkeleton,
  SurfaceSkeleton,
  TradeTerminalSkeleton,
  VaultPageSkeleton,
} from "@/components/ui/market-skeleton";
import { ui } from "@/lib/copy";
import {
  pageSimple,
  pageSimpleActions,
  pageSimpleTitle,
  pageSimpleToolbar,
  segTab,
  segTabActive,
  segTabsClass,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";
import { readMarketListView } from "@/lib/market-list-view";
import {
  MARKETS_GRID_PAGE_SIZE,
  MARKETS_TABLE_PAGE_SIZE,
} from "@/components/leverx/MarketCatalogPagination";

const MARKET_CATEGORIES = ["All", "Live", "Favorites", "Closed"] as const;

const SIMPLE_PAGE_HEADERS: Record<string, { title: string; hint?: string }> = {
  "/portfolio": { title: "Portfolio", hint: ui.portfolioHint },
  "/vault": { title: ui.vaultPageTitle, hint: ui.vaultPageHint },
  "/points": {
    title: "Points",
    hint: "Leaderboard ranked by LeverX leveraged trading volume (LVX points = quote notional).",
  },
  "/guide": { title: "How LeverX works" },
};

/** Route-level shimmer body — rendered inside `SiteShell` via layout or leaf outlets. */
export function RoutePendingContent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (pathname.startsWith("/predictions/")) {
    const oracleId = pathname.match(/^\/predictions\/([^/]+)/)?.[1];
    return <TradeTerminalSkeleton oracleId={oracleId} />;
  }

  if (pathname === "/markets") {
    return (
      <section className={pageSimple}>
        <MarketsHeroSection />

        <div className={pageSimpleToolbar}>
          <h1 className={pageSimpleTitle}>All markets</h1>
          <div className={pageSimpleActions}>
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                disabled
                placeholder="Search markets…"
                className="border-border bg-card pl-9"
              />
            </div>
            <div
              className={cn(segTabsClass("icon"), "hidden shrink-0 lg:inline-flex")}
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                className={cn(segTab, segTabActive)}
                disabled
                aria-label="Grid view"
                aria-pressed
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button type="button" className={segTab} disabled aria-label="List view">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <UnderlineTabs
          variant="plain"
          className="pointer-events-none"
          value="Live"
          onValueChange={() => {}}
          options={MARKET_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
        />

        {readMarketListView() === "list" ? (
          <>
            <div className="hidden lg:block">
              <MarketsCatalogSkeleton view="list" tableRows={MARKETS_TABLE_PAGE_SIZE} />
            </div>
            <div className="lg:hidden">
              <MarketsCatalogSkeleton view="grid" gridCount={MARKETS_GRID_PAGE_SIZE} />
            </div>
          </>
        ) : (
          <MarketsCatalogSkeleton view="grid" gridCount={MARKETS_GRID_PAGE_SIZE} />
        )}
      </section>
    );
  }

  const pageHeader = SIMPLE_PAGE_HEADERS[pathname];
  if (pageHeader) {
    return (
      <section
        className={cn(
          pageSimple,
          pathname === "/vault" && "mx-auto max-w-[var(--page-max)]",
        )}
      >
        <div>
          <h1 className={pageSimpleTitle}>{pageHeader.title}</h1>
          {pageHeader.hint ? (
            <p className="mt-1 text-sm text-muted-foreground">{pageHeader.hint}</p>
          ) : null}
        </div>
        {pathname === "/portfolio" ? (
          <PortfolioPageSkeleton />
        ) : pathname === "/points" ? (
          <PointsLeaderboardSkeleton rows={10} />
        ) : pathname === "/vault" ? (
          <VaultPageSkeleton />
        ) : (
          <SurfaceSkeleton lines={6} hideHeader />
        )}
      </section>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <LoadingState />
    </div>
  );
}

/** Leaf routes — content only (parent layout already renders `SiteShell`). */
export const RoutePending = RoutePendingContent;

/** Layout route pending — keeps header/nav/footer while loaders run. */
export function AppShellRoutePending() {
  return (
    <AppSiteShell>
      <RoutePendingContent />
    </AppSiteShell>
  );
}

/** Trade terminal layout route pending — full-width shell. */
export function DetailShellRoutePending() {
  return (
    <SiteShell fullWidth>
      <RoutePendingContent />
    </SiteShell>
  );
}
