import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, TrendingUp, AlertCircle, Filter, RefreshCw } from "lucide-react";
import { useArbitrage } from "@/hooks/useArbitrage";
import { useState } from "react";
import { ArbitrageFilters, ArbitrageSortOptions } from "@/types/arbitrage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SEO } from "@/components/SEO";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

const Arbitrage = () => {
  const { isConnected } = useWallet();
  const [filters, setFilters] = useState<ArbitrageFilters>({});
  const [sort, setSort] = useState<ArbitrageSortOptions>({
    field: "spread",
    direction: "desc",
  });
  const [tradeAmount, setTradeAmount] = useState<number>(1000);

  const { opportunities, isLoading, filteredCount } = useArbitrage({ filters, sort });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Arbitrage Scanner - Cross-Venue Market Opportunities | Molfi"
        description="Discover real-time arbitrage opportunities across Molfi CLOB, Polymarket and Limitless. Find profitable price discrepancies with our advanced arbitrage scanner. Instant alerts for high-spread opportunities."
      />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Arbitrage Scanner</h1>
              <p className="text-muted-foreground text-lg">
                Real-time arbitrage opportunities across Molfi CLOB, Polymarket & Limitless
              </p>
            </div>
            <Button variant="outline" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-muted-foreground">Live Updates</span>
            </div>
            <div className="text-muted-foreground">
              {filteredCount} opportunities found
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select
                    value={sort.field}
                    onValueChange={(value) =>
                      setSort({ ...sort, field: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spread">Spread %</SelectItem>
                      <SelectItem value="profit">Profit USD</SelectItem>
                      <SelectItem value="volume">Volume</SelectItem>
                      <SelectItem value="updated">Last Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Min Spread %</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minSpread: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min Profit (USD)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minProfit: parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Venues</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Polymarket</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="text-sm">Limitless</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Label className="mb-3 block">PnL Calculator</Label>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Trade Amount (USD)</Label>
                    <Input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 1000)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities Grid */}
          <div className="lg:col-span-9">
            {isLoading ? (
              <div className="flex justify-center items-center h-96">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {opportunities.map((opp) => {
                  const calculatedProfit = (opp.spreadPercentage / 100) * tradeAmount;
                  
                  return (
                    <Card key={opp.id} className="hover:border-primary/50 transition-all">
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Market Info */}
                          <div className="lg:col-span-5">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className="font-semibold text-lg leading-tight">
                                  {opp.marketTitle}
                                </h3>
                                <Badge variant="outline" className={getRiskColor(opp.riskLevel)}>
                                  {opp.riskLevel}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary">{opp.category}</Badge>
                                <span>•</span>
                                <span>{formatTime(opp.lastUpdated)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Pricing Comparison */}
                          <div className="lg:col-span-4">
                            <Tabs defaultValue="prices" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="prices">Prices</TabsTrigger>
                                <TabsTrigger value="profit">Profit</TabsTrigger>
                              </TabsList>
                              <TabsContent value="prices" className="space-y-2 mt-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Molfi CLOB:</span>
                                  <span className="font-mono font-semibold">
                                    ${opp.molfiPrice.toFixed(3)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground capitalize">
                                    {opp.externalVenue}:
                                  </span>
                                  <span className="font-mono font-semibold">
                                    ${opp.externalPrice.toFixed(3)}
                                  </span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                  <span className="text-sm font-medium">Spread:</span>
                                  <span className="text-lg font-bold text-primary">
                                    {opp.spreadPercentage.toFixed(2)}%
                                  </span>
                                </div>
                              </TabsContent>
                              <TabsContent value="profit" className="space-y-2 mt-3">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Per Unit:</span>
                                  <span className="font-mono font-semibold text-green-500">
                                    +${opp.potentialProfit.toFixed(3)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-muted-foreground">Your Size:</span>
                                  <span className="font-mono">${tradeAmount.toFixed(0)}</span>
                                </div>
                                <div className="pt-2 border-t flex justify-between items-center">
                                  <span className="text-sm font-medium">Est. Profit:</span>
                                  <span className="text-lg font-bold text-green-500">
                                    +${calculatedProfit.toFixed(2)}
                                  </span>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>

                          {/* Action */}
                          <div className="lg:col-span-3 flex flex-col justify-center gap-2">
                            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
                              <div className="flex items-center gap-1 text-green-500">
                                <TrendingUp className="w-3 h-3" />
                                <span className="font-medium">Buy: {opp.buyVenue}</span>
                              </div>
                              <div className="flex items-center gap-1 text-red-500">
                                <TrendingUp className="w-3 h-3 rotate-180" />
                                <span className="font-medium">Sell: {opp.sellVenue}</span>
                              </div>
                            </div>
                            <Button 
                              className="w-full" 
                              size="sm"
                              onClick={() => {
                                if (!isConnected) {
                                  toast.error("Please connect your wallet to trade");
                                } else {
                                  toast.info("Trading feature coming soon!");
                                }
                              }}
                            >
                              {isConnected ? "Execute Trade" : "Connect Wallet to Trade"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Arbitrage;
