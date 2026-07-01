import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Clock, LayoutGrid, List, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UnderlineTabs } from "@/components/leverx/UnderlineTabs";
import { MarketsSortPopover } from "@/components/leverx/MarketsSortPopover";
import { PredictMarketsGrid } from "@/components/leverx/PredictMarketsGrid";
import { PredictMarketsTable } from "@/components/leverx/PredictMarketsTable";
import { MarketsHeroSection } from "@/components/leverx/MarketsHeroSection";
import { useMolfiMarkets } from "@/hooks/useMolfiMarkets";
import { MarketsCatalogSkeleton } from "@/components/ui/market-skeleton";
import {
  MARKETS_GRID_PAGE_SIZE,
  MARKETS_TABLE_PAGE_SIZE,
} from "@/components/leverx/MarketCatalogPagination";
import { pageTitle } from "@/lib/brand";
import { ui } from "@/lib/copy";
import { MARKET_CATEGORIES, DEFAULT_CATEGORY } from "@/lib/market-categories";
import {
  marketsCatalogRegion,
  pageSimple,
  pageSimpleActions,
  pageSimpleTitle,
  pageSimpleToolbar,
  segTab,
  segTabActive,
  segTabsClass,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MARKET_SORT,
  sortMarketRows,
  type MarketSortId,
} from "@/lib/leverx/market-sort";
import { routePendingOptions } from "@/lib/router/route-options";
import {
  readMarketListView,
  writeMarketListView,
  type MarketListView,
} from "@/lib/market-list-view";

export const Route = createFileRoute("/_app/markets")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Markets") },
      {
        name: "description",
        content:
          "Browse live prediction markets — crypto settled on-chain on Stellar, plus sports, politics, and more.",
      },
    ],
  }),
  component: MarketsPage,
});

function MarketsPage() {
  const [categoryId, setCategoryId] = useState<string>(DEFAULT_CATEGORY);
  const [search, setSearch] = useState("");
  const [view, setViewState] = useState<MarketListView>(readMarketListView);
  const setView = useCallback((next: MarketListView) => {
    setViewState(next);
    writeMarketListView(next);
  }, []);
  const [sort, setSort] = useState<MarketSortId>(DEFAULT_MARKET_SORT);
  const [status, setStatus] = useState<"open" | "closed">("open");

  const {
    markets: catalogMarkets,
    offline,
    loading: catalogLoading,
    comingSoon,
  } = useMolfiMarkets({ categoryId, search, status });

  const markets = useMemo(
    () => sortMarketRows(catalogMarkets, sort),
    [catalogMarkets, sort],
  );

  const emptyTitle = status === "closed" ? "No settled markets yet" : ui.emptyMarkets;
  const emptyDescription =
    status === "closed"
      ? "Markets show up here once they close and settle against the final spot price."
      : ui.emptyMarketsHint;

  return (
    <section className={pageSimple}>
      <MarketsHeroSection />

      <div className={pageSimpleToolbar}>
        <h1 className={pageSimpleTitle}>Markets</h1>
        <div className={pageSimpleActions}>
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              className={cn(segTab, view === "list" && segTabActive)}
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={cn(segTab, view === "grid" && segTabActive)}
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <UnderlineTabs
          variant="plain"
          className="min-w-0 flex-1"
          value={categoryId}
          onValueChange={setCategoryId}
          options={MARKET_CATEGORIES.map((cat) => ({
            value: cat.id,
            label: cat.label,
          }))}
        />
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          {!comingSoon ? (
            <div className={segTabsClass()} role="group" aria-label="Market status">
              <button
                type="button"
                className={cn(segTab, status === "open" && segTabActive)}
                onClick={() => setStatus("open")}
                aria-pressed={status === "open"}
              >
                Open
              </button>
              <button
                type="button"
                className={cn(segTab, status === "closed" && segTabActive)}
                onClick={() => setStatus("closed")}
                aria-pressed={status === "closed"}
              >
                Closed
              </button>
            </div>
          ) : null}
          <MarketsSortPopover value={sort} onChange={setSort} />
        </div>
      </div>

      {!comingSoon ? (
        <p className="flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
          Real on-chain markets — your stake is escrowed as mUSDC in the predict-escrow contract and
          settled by the live Reflector oracle. Bets are transparent on-chain; the order-book depth is indicative.
        </p>
      ) : null}

      <div className={cn(view === "list" && marketsCatalogRegion)}>
        {comingSoon ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
            <div className="rounded-full bg-accent/10 p-3">
              <Clock className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {MARKET_CATEGORIES.find((c) => c.id === categoryId)?.label} markets — coming soon
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Molfi is live on <strong className="text-foreground">Crypto</strong> — auto-rolling 15 &amp;
                30-minute markets across BTC, ETH, SOL, XLM and more, settled on-chain. More categories are
                on the way.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCategoryId("crypto")}
              className="btn-connect gap-1.5 text-sm"
            >
              Explore Crypto markets
            </button>
          </div>
        ) : catalogLoading ? (
          view === "grid" ? (
            <MarketsCatalogSkeleton view="grid" gridCount={MARKETS_GRID_PAGE_SIZE} />
          ) : (
            <>
              <div className="hidden lg:block">
                <MarketsCatalogSkeleton view="list" tableRows={MARKETS_TABLE_PAGE_SIZE} />
              </div>
              <div className="lg:hidden">
                <MarketsCatalogSkeleton view="grid" gridCount={MARKETS_GRID_PAGE_SIZE} />
              </div>
            </>
          )
        ) : view === "grid" ? (
          <PredictMarketsGrid
            markets={markets}
            offline={offline}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <PredictMarketsTable
                markets={markets}
                sort={sort}
                onSortChange={setSort}
                offline={offline}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
              />
            </div>
            <div className="lg:hidden">
              <PredictMarketsGrid
                markets={markets}
                offline={offline}
                emptyTitle={emptyTitle}
                emptyDescription={emptyDescription}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
