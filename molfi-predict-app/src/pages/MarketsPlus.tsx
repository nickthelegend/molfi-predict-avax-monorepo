import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketFilters from "@/components/MarketFilters";
import { CategorySidebar } from "@/components/CategorySidebar";
import { SEO } from "@/components/SEO";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useStellarMarketsFeed as useMarketsFeed } from "@/hooks/useStellarMarketsFeed";
import { MinimalMarketCard } from "@/components/MinimalMarketCard";
import { MarketCardSkeleton } from "@/components/MarketCardSkeleton";
import { MarketFiltersSettings } from "@/components/MarketFiltersSettings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSearchParams } from "react-router-dom";
import { Search, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractGroupTitle, extractUniqueSegments } from "@/lib/market-label-utils";
import { getEffectiveEndDate, isEffectivelyResolved } from "@/lib/market-date-utils";
import type { MolfiMarket } from "@/services/molfi-api";

/** Client-side subcategory filter based on title keywords or resolution timeframe */
function filterBySubcategory(markets: MolfiMarket[], category: string, sub: string): MolfiMarket[] {
  if (category === 'crypto') {
    // Filter by resolution timeframe (time until expiry)
    const now = Date.now();
    const maxMs: Record<string, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
    };
    const max = maxMs[sub];
    if (!max) return markets;
    // For ranges: 15m = 0-15m, 1h = 15m-1h, 4h = 1h-4h, etc.
    const ranges: Record<string, [number, number]> = {
      '15m': [0, 15 * 60 * 1000],
      '1h': [0, 60 * 60 * 1000],
      '4h': [0, 4 * 60 * 60 * 1000],
      '1d': [0, 24 * 60 * 60 * 1000],
      '1w': [0, 7 * 24 * 60 * 60 * 1000],
    };
    const [, rangeMax] = ranges[sub] || [0, Infinity];
    return markets.filter(m => {
      const end = getEffectiveEndDate(m);
      if (!end) return false;
      const diff = new Date(end).getTime() - now;
      return diff > 0 && diff <= rangeMax;
    });
  }

  // Keyword-based filtering for other categories
  const keywordMap: Record<string, Record<string, RegExp>> = {
    sports: {
      nba: /\b(nba|basketball)\b/i,
      nfl: /\b(nfl|football|super bowl)\b/i,
      mlb: /\b(mlb|baseball)\b/i,
      soccer: /\b(soccer|football|premier league|la liga|champions league|mls|fifa|world cup)\b/i,
      ufc: /\b(ufc|mma|boxing|fight)\b/i,
      tennis: /\b(tennis|wimbledon|us open|french open|australian open)\b/i,
      f1: /\b(f1|formula|grand prix|racing)\b/i,
    },
    politics: {
      us: /\b(us|united states|american|congress|senate|president|trump|biden)\b/i,
      global: /\b(eu|china|india|uk|russia|global|world|international)\b/i,
      congress: /\b(congress|senate|house|representative|speaker)\b/i,
      elections: /\b(election|vote|ballot|primary|caucus)\b/i,
    },
    elections: {
      us: /\b(us|united states|american)\b/i,
      global: /\b(eu|uk|india|global|world)\b/i,
    },
    economics: {
      fed: /\b(fed|federal reserve|interest rate|fomc|powell)\b/i,
      gdp: /\b(gdp|growth|output)\b/i,
      inflation: /\b(inflation|cpi|pce|prices)\b/i,
    },
    pop_culture: {
      movies: /\b(movie|film|box office|oscar|academy)\b/i,
      music: /\b(music|album|grammy|spotify|song|artist)\b/i,
      awards: /\b(award|emmy|grammy|oscar|golden globe)\b/i,
    },
    business: {
      tech: /\b(apple|google|microsoft|meta|amazon|nvidia|openai|ai)\b/i,
      ipos: /\b(ipo|listing|public offering)\b/i,
      earnings: /\b(earnings|revenue|profit|quarterly)\b/i,
    },
    science: {
      space: /\b(space|nasa|spacex|mars|moon|rocket|satellite)\b/i,
      climate: /\b(climate|weather|temperature|carbon|emissions)\b/i,
      health: /\b(health|vaccine|fda|drug|medical|covid)\b/i,
    },
  };

  const pattern = keywordMap[category]?.[sub];
  if (!pattern) return markets;
  return markets.filter(m => pattern.test(m.title));
}

const Markets = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL is the single source of truth for filters
  const category = searchParams.get('category') || 'all';
  const venue = searchParams.get('venue') || 'all';
  const sortBy = searchParams.get('sort') || 'trending';
  const searchQuery = searchParams.get('q') || '';
  const subcategory = searchParams.get('sub') || 'all';

  const [animationsEnabled, setAnimationsEnabled] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [minVolume, setMinVolume] = useState<number | undefined>(
    searchParams.get('minVolume') ? Number(searchParams.get('minVolume')) : undefined
  );
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable');

  // Debounce search input → URL
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      updateParams({ q: value || undefined });
    }, 300);
  }, []);

  // Helper to update URL params without circular effects
  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, val]) => {
        if (val && val !== 'all' && val !== 'trending') {
          params.set(key, val);
        } else {
          params.delete(key);
        }
      });
      return params;
    }, { replace: true });
  }, [setSearchParams]);

  // Fetch markets from API with server-side filtering
  const { markets, isLoading, isLoadingMore, error, hasMore, loadMore, refresh, total } = useMarketsFeed({
    category: category,
    venue: venue,
    status: showClosed ? undefined : 'active',
    search: searchQuery,
    limit: 40,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load markets from Molfi API.");
    }
  }, [error]);

  // Client-side filters (on top of server-side category/venue)
  const searchFiltered = useMemo(() => {
    let filtered = markets;

    // Filter out ended/resolved markets unless showClosed is on
    if (!showClosed) {
      filtered = filtered.filter(m => !isEffectivelyResolved(m));
    }

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(m => m.title.toLowerCase().includes(query));
    }

    // Subcategory filtering
    if (subcategory && subcategory !== 'all') {
      filtered = filterBySubcategory(filtered, category, subcategory);
    }

    return filtered;
  }, [markets, searchQuery, showClosed, subcategory, category]);

  // Group markets and build display items
  const displayMarkets = useMemo(() => {
    const groupMap = new Map<string, typeof searchFiltered>();
    const standalone: typeof searchFiltered = [];

    searchFiltered.forEach(market => {
      if (market.outcomes && Array.isArray(market.outcomes) && market.outcomes.length > 2) {
        standalone.push(market);
        return;
      }
      if (market.group_id) {
        const existing = groupMap.get(market.group_id) || [];
        existing.push(market);
        groupMap.set(market.group_id, existing);
      } else {
        standalone.push(market);
      }
    });

    const items: Array<{ type: 'binary' | 'multi_outcome'; market: any }> = [];

    groupMap.forEach((groupMarkets, groupId) => {
      if (groupMarkets.length <= 2) {
        groupMarkets.forEach(m => standalone.push(m));
        return;
      }
      const first = groupMarkets[0];
      const totalVol = groupMarkets.reduce((s, m) => s + (m.volume_total || m.volume_24h || 0), 0);
      const groupTitle = extractGroupTitle(groupMarkets.map(m => m.title));
      const rawLabels = groupMarkets.map(m => (m as any).group_item_title || m.title);
      const shortLabels = extractUniqueSegments(rawLabels);
      const outcomes = groupMarkets.map((m, i) => ({
        label: shortLabels[i],
        // yes_price is 0-1 decimal; convert to 0-100 integer for probability display
        probability: Math.round((m.yes_price ?? 0.5) * 100),
      }));

      items.push({
        type: 'multi_outcome',
        market: {
          id: groupId,
          title: groupTitle,
          description: first.description || '',
          yesPercentage: 50,
          noPercentage: 50,
          totalVolume: totalVol,
          liquidity: groupMarkets.reduce((s, m) => s + (m.liquidity || 0), 0),
          volume24h: groupMarkets.reduce((s, m) => s + (m.volume_24h || 0), 0),
          endDate: getEffectiveEndDate(first) || '',
          imageUrl: first.image_url || '',
          status: first.status,
          venue: first.venue || 'molfi',
          category: first.category || '',
          createdAt: first.created_at || '',
          trendingScore: first.trending_score || 0,
          marketType: 'multi_outcome' as const,
          outcomes,
          isResolved: isEffectivelyResolved(first),
        },
      });
    });

    standalone.forEach(market => {
      const apiOutcomes = market.outcomes;
      const isMulti = apiOutcomes && Array.isArray(apiOutcomes) && apiOutcomes.length > 2;
      const effectiveVolume = (market.volume_total || market.volume_24h || 0);

      items.push({
        type: isMulti ? 'multi_outcome' : 'binary',
        market: {
          id: market.id,
          title: market.title,
          description: market.description || '',
          // yes_price/no_price are 0-1 decimals from the API
          yesPrice: market.yes_price ?? 0.5,
          noPrice: market.no_price ?? 0.5,
          // Convert to 0-100 integer for the probability bar
          yesPercentage: Math.round((market.yes_price ?? 0.5) * 100),
          noPercentage: Math.round((market.no_price ?? 0.5) * 100),
          totalVolume: effectiveVolume,
          liquidity: market.liquidity ?? 0,
          volume24h: market.volume_24h ?? 0,
          openInterest: market.open_interest ?? 0,
          endDate: getEffectiveEndDate(market) || '',
          imageUrl: market.image_url || '',
          status: market.status,
          venue: market.venue || 'molfi',
          category: market.category || '',
          createdAt: market.created_at || '',
          trendingScore: market.trending_score || 0,
          marketType: isMulti ? 'multi_outcome' as const : 'binary' as const,
          outcomes: isMulti
            ? apiOutcomes.map((o: any) => ({ label: o.label || o.name, probability: Math.round((o.price ?? 0) * 100) }))
            : undefined,
          isResolved: isEffectivelyResolved(market),
        },
      });
    });

    // Sort
    items.sort((a, b) => {
      const ma = a.market;
      const mb = b.market;
      switch (sortBy) {
        case 'trending':
          return (mb.trendingScore || 0) - (ma.trendingScore || 0);
        case 'liquidity_desc':
          return (mb.liquidity || 0) - (ma.liquidity || 0);
        case 'volume24h_desc':
          return (mb.volume24h || mb.totalVolume || 0) - (ma.volume24h || ma.totalVolume || 0);
        case 'createdAt_desc':
          return new Date(mb.createdAt || 0).getTime() - new Date(ma.createdAt || 0).getTime();
        case 'endingSoon': {
          const now = Date.now();
          const endA = new Date(ma.endDate || '2099-01-01').getTime();
          const endB = new Date(mb.endDate || '2099-01-01').getTime();
          return (endA > now ? endA : Infinity) - (endB > now ? endB : Infinity);
        }
        default:
          return 0;
      }
    });

    return items;
  }, [searchFiltered, sortBy]);

  // Infinite scroll observer with debouncing to prevent rapid requests
  const sentinelRef = useRef<HTMLDivElement>(null);
  const lastLoadTimeRef = useRef(0);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Don't set up observer if conditions aren't met
    if (!sentinelRef.current || !hasMore || isLoading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;

        const now = Date.now();
        const timeSinceLastLoad = now - lastLoadTimeRef.current;

        // Only trigger if:
        // 1. Element is intersecting
        // 2. Not currently loading (check both ref and state)
        // 3. No error
        // 4. Has more data to load
        // 5. At least 500ms since last load (debounce)
        if (!isLoadingRef.current && !isLoadingMore && !error && hasMore && timeSinceLastLoad > 500) {
          isLoadingRef.current = true;
          lastLoadTimeRef.current = now;
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Trigger before user reaches the end
        threshold: 0.1
      }
    );

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore, error, isLoadingMore, isLoading]);

  // Reset loading ref when isLoadingMore changes
  useEffect(() => {
    if (!isLoadingMore) {
      isLoadingRef.current = false;
    }
  }, [isLoadingMore]);

  const gridColsClass = density === 'compact'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
    : density === 'spacious'
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO
        title="Prediction Markets | Trade on Real-World Events | Molfi"
        description="Explore thousands of prediction markets on politics, crypto, sports & more. Trade with deep liquidity across Polymarket, Kalshi, Limitless and Molfi native markets."
      />
      <Header />
      <CategoryNav />

      {/* Sidebar + Main Content */}
      <div className="flex flex-1">
        <CategorySidebar />

        <div className="flex-1 min-w-0">
          {/* Search & Filters Bar */}
          <div className="px-4 py-4 border-b border-border">
            <div className="relative mb-3 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search markets..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-9"
              />
              {localSearch && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <MarketFilters
                  venue={venue}
                  sortBy={sortBy}
                  onVenueChange={(v) => updateParams({ venue: v })}
                  onSortChange={(s) => updateParams({ sort: s })}
                />
                <div className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md">
                  <Switch
                    id="show-closed-markets"
                    checked={showClosed}
                    onCheckedChange={setShowClosed}
                  />
                  <Label htmlFor="show-closed-markets" className="text-xs cursor-pointer whitespace-nowrap">
                    Show closed
                  </Label>
                </div>
                <MarketFiltersSettings
                  animationsEnabled={animationsEnabled}
                  onAnimationsChange={setAnimationsEnabled}
                  minVolume={minVolume}
                  onMinVolumeChange={setMinVolume}
                  density={density}
                  onDensityChange={setDensity}
                />
              </div>
              <div className="flex items-center gap-3">
                {total > 0 && (
                  <span className="text-xs text-muted-foreground">{total} markets</span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refresh}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Market Grid */}
          <div className="px-4 py-6">
            <div className={`grid ${gridColsClass} gap-4`}>
              {isLoading ? (
                [1, 2, 3, 4, 5, 6].map((n) => (
                  <MarketCardSkeleton key={n} />
                ))
              ) : displayMarkets.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p className="text-sm">No markets found.</p>
                </div>
              ) : (
                displayMarkets.map((item) => (
                  <MinimalMarketCard
                    key={item.market.id}
                    id={item.market.id}
                    title={item.market.title}
                    description={item.market.description}
                    yesPercentage={item.market.yesPercentage}
                    noPercentage={item.market.noPercentage}
                    totalVolume={item.market.totalVolume}
                    liquidity={item.market.liquidity}
                    venue={item.market.venue}
                    imageUrl={item.market.imageUrl}
                    endDate={item.market.endDate}
                    animationsEnabled={animationsEnabled}
                    marketType={item.market.marketType}
                    outcomes={item.market.outcomes}
                    isResolved={item.market.isResolved}
                  />
                ))
              )}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-8">
                {isLoadingMore && (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
