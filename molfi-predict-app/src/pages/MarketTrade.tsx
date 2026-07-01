import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { ResolutionChart } from "@/components/markets/ResolutionChart";
import { PeriodTimeline, type PeriodSlot } from "@/components/markets/PeriodTimeline";
import { OrderForm } from "@/components/markets/OrderForm";
import { OrderBookMini } from "@/components/markets/OrderBookMini";
import { MarketRules } from "@/components/markets/MarketRules";
import { AIMarketAnalyzer } from "@/components/markets/AIMarketAnalyzer";
import { PositionManagement } from "@/components/markets/PositionManagement";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { useMarketBaseline } from "@/hooks/useMarketBaseline";
import { usePriceTicker } from "@/hooks/usePriceTicker";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
const TIMEFRAMES = ["hourly", "daily"] as const;

function buildOrderedList() {
  const list: { asset: string; timeframe: "hourly" | "daily" }[] = [];
  for (const tf of TIMEFRAMES) {
    for (const asset of ASSETS) {
      list.push({ asset, timeframe: tf });
    }
  }
  return list;
}

const ORDERED_MARKETS = buildOrderedList();

function useMarketData(asset: string, timeframe: "hourly" | "daily") {
  const { baseline } = useMarketBaseline(asset, timeframe);
  const { price: currentPrice } = usePriceTicker(asset);
  const yesProb = (baseline <= 0 || currentPrice <= 0)
    ? 50
    : Math.min(95, Math.max(5, 50 + ((currentPrice - baseline) / baseline) * 100 * 25));
  return { yesProb, baseline, currentPrice };
}

function parseSlug(slug: string): { asset: string; timeframe: "hourly" | "daily" } | null {
  const parts = slug.split("-");
  if (parts.length !== 2) return null;
  const [asset, tf] = parts;
  const upperAsset = asset.toUpperCase();
  if (!(ASSETS as readonly string[]).includes(upperAsset)) return null;
  if (tf !== "hourly" && tf !== "daily") return null;
  return { asset: upperAsset, timeframe: tf };
}

/** Get current period start for the given timeframe */
function getCurrentPeriodStart(timeframe: "hourly" | "daily"): number {
  const now = new Date();
  if (timeframe === "daily") {
    now.setUTCHours(0, 0, 0, 0);
  } else {
    now.setUTCMinutes(0, 0, 0);
  }
  return now.getTime();
}

const MarketTrade = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeSide, setActiveSide] = useState<"yes" | "no">("yes");
  const [clickedPrice, setClickedPrice] = useState<number | null>(null);
  const [openPanel, setOpenPanel] = useState<"ai" | "orderbook" | null>(null);

  const parsed = slug ? parseSlug(slug) : null;
  const selected = parsed ?? { asset: "BTC", timeframe: "hourly" as const };
  const { yesProb, baseline, currentPrice } = useMarketData(selected.asset, selected.timeframe);

  // Derive canonical backend market ID from slug: "BTC-hourly" → "btc-hourly"
  const canonicalMarketId = slug
    ? slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    : undefined;

  // Timeline state — scoped to selected card's timeframe
  const currentPeriodStart = useMemo(
    () => getCurrentPeriodStart(selected.timeframe),
    [selected.timeframe]
  );
  const [selectedSlot, setSelectedSlot] = useState<PeriodSlot | null>(null);

  // Reset timeline selection when switching markets
  const marketKey = `${selected.asset}-${selected.timeframe}`;
  const [lastMarketKey, setLastMarketKey] = useState(marketKey);
  if (marketKey !== lastMarketKey) {
    setLastMarketKey(marketKey);
    setSelectedSlot(null);
  }

  const activeSlotStart = selectedSlot?.start ?? currentPeriodStart;
  const activeSlotState = selectedSlot?.state ?? "current";

  const handleSelect = (m: { asset: string; timeframe: "hourly" | "daily" }) => {
    navigate(`/markets/${m.asset}-${m.timeframe}`, { replace: true });
  };

  const togglePanel = (panel: "ai" | "orderbook") => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <SEO
        title={`${selected.asset} ${selected.timeframe} | Molfi`}
        description="Trade prediction markets."
      />
      <Header />

      <div className="flex-1 min-h-0 grid grid-cols-12 overflow-hidden">

        {/* Left: market list */}
        <div className="col-span-3 border-r border-border hidden md:flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate("/markets")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Markets</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {ORDERED_MARKETS.map(({ asset, timeframe }) => (
                <div key={`${asset}-${timeframe}`} onClick={() => handleSelect({ asset, timeframe })} className="cursor-pointer">
                  <CoinbaseMarketCard
                    asset={asset}
                    timeframe={timeframe}
                    isSelected={selected.asset === asset && selected.timeframe === timeframe}
                    compact
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Center: chart + timeline + panels */}
        <div className="col-span-12 md:col-span-6 flex flex-col overflow-hidden">
          {/* Resolution Chart */}
          <div className="flex-1 min-h-0">
            <ResolutionChart
              asset={selected.asset}
              timeframe={selected.timeframe}
              periodStart={activeSlotState !== "current" ? activeSlotStart : undefined}
              periodEnd={activeSlotState !== "current" ? (selectedSlot?.end ?? undefined) : undefined}
              periodState={activeSlotState}
            />
          </div>

          {/* Period Timeline */}
          <PeriodTimeline
            timeframe={selected.timeframe}
            selectedStart={activeSlotStart}
            onSelect={setSelectedSlot}
          />

          {/* AI analyzer */}
          <AIMarketAnalyzer
            asset={selected.asset}
            timeframe={selected.timeframe}
            currentPrice={currentPrice}
            baseline={baseline}
            yesProb={yesProb}
            isOpen={openPanel === "ai"}
            onToggle={() => togglePanel("ai")}
          />

          <OrderBookMini yesProb={yesProb} side={activeSide} onPriceClick={setClickedPrice} isOpen={openPanel === "orderbook"} onToggle={() => togglePanel("orderbook")} />
          <PositionManagement />

          <div className="md:hidden p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => navigate("/markets")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
            </Button>
          </div>
        </div>

        {/* Right: order form + rules */}
        <div className="col-span-3 border-l border-border hidden lg:flex flex-col overflow-hidden">
          <OrderForm asset={selected.asset} yesProb={yesProb} marketId={canonicalMarketId} onSideChange={setActiveSide} externalLimitPrice={clickedPrice} isLeverage={selected.timeframe === "daily"} />
          <div className="border-t border-border" />
          <MarketRules asset={selected.asset} timeframe={selected.timeframe} />
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <Drawer>
          <DrawerTrigger asChild>
            <Button size="icon" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <ShoppingCart className="w-6 h-6" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh]">
            <div className="overflow-y-auto">
              <OrderForm asset={selected.asset} yesProb={yesProb} marketId={canonicalMarketId} onSideChange={setActiveSide} externalLimitPrice={clickedPrice} isLeverage={selected.timeframe === "daily"} />
              <div className="border-t border-border" />
              <MarketRules asset={selected.asset} timeframe={selected.timeframe} />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default MarketTrade;
