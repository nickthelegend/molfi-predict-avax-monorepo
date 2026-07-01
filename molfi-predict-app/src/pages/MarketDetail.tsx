import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink, Lock } from "lucide-react";
import { MarketChart } from "@/components/MarketChart";
import { OrderbookWidget } from "@/components/OrderbookWidget";
import { TradingModal } from "@/components/TradingModal";
import { MobileMarketDetail } from "@/components/MobileMarketDetail";
import { useIsMobile } from "@/hooks/use-mobile";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useTradeHistory } from "@/hooks/useTradeHistory";
import { useActivityTracking } from "@/hooks/useActivityTracking";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { molfiApi, type MolfiMarket } from "@/services/molfi-api";
import type { WebSocketEvent, MarketUpdateEvent } from "@/services/websocket";

function formatVolume(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
}

function priceToCents(price: number | null | undefined): number {
  if (price == null) return 50;
  return Math.round(price);
}

const MarketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [preselectedSide, setPreselectedSide] = useState<'yes' | 'no'>('yes');
  const { trackActivity } = useActivityTracking();
  const isMobile = useIsMobile();
  const { service } = useWebSocket();

  const [market, setMarket] = useState<MolfiMarket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    molfiApi.listAggregatedMarkets({ limit: 300 }).then((res) => {
      const found = res.markets.find((m) => 
        m.id === id || 
        m.venue_market_id === id
      );
      if (found) {
        setMarket(found);
      } else {
        setError("Market not found");
      }
    }).catch((err) => {
      console.error("Failed to fetch market:", err);
      setError("Failed to load market data");
    }).finally(() => setIsLoading(false));
  }, [id]);

  // Subscribe to real-time price updates via WebSocket
  useEffect(() => {
    if (!id || !market) return;

    service.subscribeToMarkets([market.venue_market_id || id]);

    const handler = (event: WebSocketEvent) => {
      if (event.type === 'market_update') {
        const update = event as unknown as MarketUpdateEvent;
        if (update.market_id === id || update.market_id === market.venue_market_id) {
          setMarket((prev) =>
            prev ? {
              ...prev,
              yes_price: update.yes_price ?? prev.yes_price,
              no_price: update.no_price ?? prev.no_price,
              volume_24h: update.volume_24h ?? prev.volume_24h,
            } : prev
          );
        }
      }
    };

    service.on('market_update', handler);
    return () => { service.off('market_update', handler); };
  }, [id, market?.venue_market_id, service]);

  // Track page view
  useEffect(() => {
    if (market) {
      trackActivity({
        activityType: "market_viewed",
        details: {
          marketId: market.id,
          marketTitle: market.title,
          category: market.category,
        },
      });
    }
  }, [market?.id]);

  const { trades } = useTradeHistory(id || "");

  const handleTrade = (side: "yes" | "no") => {
    setPreselectedSide(side);
    setTradingModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-2">Market Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || "This market doesn't exist."}</p>
          <Button onClick={() => navigate("/markets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Markets
          </Button>
        </div>
      </div>
    );
  }

  const yesCents = priceToCents(market.yes_price);
  const noCents = priceToCents(market.no_price);
  const isMolfi = market.venue === 'molfi';

  const tradingMarket = {
    id: market.id,
    title: market.title,
    yesPercentage: yesCents,
    noPercentage: noCents,
    venue: market.venue,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Markets
        </Button>

        {/* Market Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge>{market.category}</Badge>
                <Badge variant="outline" className="capitalize">{market.venue}</Badge>
                <Badge variant={market.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                  {market.status}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{market.title}</h1>
              {market.description && (
                <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: market.description }} />
              )}
            </div>
            {market.external_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={market.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1" /> Source
                </a>
              </Button>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Volume (24h)</div>
              <div className="text-2xl font-bold">${formatVolume(market.volume_24h)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Liquidity</div>
              <div className="text-2xl font-bold">${formatVolume(market.liquidity)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Traders</div>
              <div className="text-2xl font-bold">{market.num_traders.toLocaleString()}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Expires</div>
              <div className="text-lg font-bold">
                {new Date(market.expires_at).toLocaleDateString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </div>
            </Card>
          </div>

          {/* Trading Buttons */}
          {market.accepting_orders && (
            <div className="grid grid-cols-2 gap-4">
              <Button
                size="lg"
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={() => handleTrade("yes")}
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Buy YES @ {yesCents}¢
              </Button>
              <Button
                size="lg"
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={() => handleTrade("no")}
              >
                <TrendingDown className="w-5 h-5 mr-2" />
                Buy NO @ {noCents}¢
              </Button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Price Chart</h2>
              <MarketChart marketId={market.id} height={400} />
            </Card>

            <Card className="p-6">
              <Tabs defaultValue="trades">
                <TabsList className="w-full">
                  <TabsTrigger value="trades" className="flex-1">Recent Trades</TabsTrigger>
                  <TabsTrigger value="leverage" className="flex-1">Margin Trading</TabsTrigger>
                  <TabsTrigger value="info" className="flex-1">Market Info</TabsTrigger>
                </TabsList>

                <TabsContent value="trades" className="mt-4">
                  <div className="space-y-2">
                    {trades.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground text-sm">No trades yet for this market.</p>
                    ) : (
                      trades.slice(0, 10).map((trade) => (
                        <div
                          key={trade.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={trade.side === "buy" ? "default" : "outline"}
                              className={trade.side === "buy" ? "bg-success" : "bg-destructive"}
                            >
                              {trade.side.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{trade.size.toFixed(2)} shares</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{(trade.price * 100).toFixed(1)}¢</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(trade.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="leverage" className="mt-4">
                  {isMolfi ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <p className="font-medium mb-2">Margin Trading</p>
                      <p>Open leveraged positions on this market via the trade modal.</p>
                      <Button className="mt-4" onClick={() => handleTrade("yes")}>
                        Open Trade Modal
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Lock className="w-10 h-10 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="font-semibold text-lg mb-1">Margin Trading available only on Molfi</p>
                      <p className="text-muted-foreground text-sm">
                        For <span className="capitalize font-medium">{market.venue}</span> markets — coming soon.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="info" className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium capitalize">{market.venue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium">{market.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Volume</span>
                      <span className="font-medium">${formatVolume(market.volume_total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Open Interest</span>
                      <span className="font-medium">${formatVolume(market.open_interest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">24h Trades</span>
                      <span className="font-medium">{market.num_trades_24h}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order</span>
                      <span className="font-medium">${market.min_order_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tick Size</span>
                      <span className="font-medium">{market.tick_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expires</span>
                      <span className="font-medium">{new Date(market.expires_at).toLocaleString()}</span>
                    </div>
                    {market.resolution_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Resolution Date</span>
                        <span className="font-medium">{new Date(market.resolution_date).toLocaleString()}</span>
                      </div>
                    )}
                    {market.external_url && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Source</span>
                        <a href={market.external_url} target="_blank" rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline flex items-center gap-1">
                          View on {market.venue} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Orderbook */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Book</h2>
              <OrderbookWidget marketId={market.id} />
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {isMobile ? (
        <MobileMarketDetail
          open={tradingModalOpen}
          onOpenChange={setTradingModalOpen}
          market={{
            ...tradingMarket,
            volume: formatVolume(market.volume_total),
          }}
        />
      ) : (
        <TradingModal
          open={tradingModalOpen}
          onOpenChange={setTradingModalOpen}
          market={tradingMarket}
          preselectedSide={preselectedSide}
        />
      )}
    </div>
  );
};

export default MarketDetail;
