import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketChart } from "./MarketChart";
import {
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Activity,
  Clock,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import type { MarketOutcome } from "./MinimalMarketCard";

const OUTCOME_DOT_COLORS = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
];

interface MarketExpandedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: {
    id: string;
    title: string;
    description?: string;
    yesPercentage: number;
    noPercentage: number;
    volume?: string;
    venue?: string;
    endDate?: string;
    imageUrl?: string;
    marketType?: "binary" | "multi_outcome";
    outcomes?: MarketOutcome[];
  };
}

export function MarketExpandedModal({
  open,
  onOpenChange,
  market,
}: MarketExpandedModalProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const isMulti = market.marketType === "multi_outcome" && market.outcomes && market.outcomes.length > 2;
  const sortedOutcomes = isMulti
    ? [...(market.outcomes || [])].sort((a, b) => b.probability - a.probability)
    : [];

  const handleTrade = (side: string) => {
    toast.success(`${side.toUpperCase()} order placed (demo)`);
  };

  const openFullPage = () => {
    onOpenChange(false);
    navigate(`/markets-plus/${market.id}`);
  };

  // Mock recent trades
  const recentTrades = [
    { side: "buy", shares: 120, price: 0.63, time: "1m ago" },
    { side: "sell", shares: 45, price: 0.62, time: "3m ago" },
    { side: "buy", shares: 200, price: 0.64, time: "7m ago" },
    { side: "buy", shares: 80, price: 0.63, time: "12m ago" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-2xl">
        <div className="flex flex-col h-full max-h-[85vh]">
          {/* Header */}
          <div className="p-5 pb-3 border-b border-border flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {market.venue}
                  </Badge>
                  {market.endDate && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(market.endDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-bold text-foreground leading-snug">
                  {market.title}
                </h2>
              </div>
            </div>

            {/* Probability summary */}
            <div className="flex flex-wrap gap-4 mt-3">
              {isMulti ? (
                sortedOutcomes.map((o, i) => (
                  <div key={o.label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${OUTCOME_DOT_COLORS[i % OUTCOME_DOT_COLORS.length]}`} />
                    <span className="text-sm font-semibold">
                      {o.label} {Number(o.probability.toFixed(1))}%
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-semibold">
                      Yes {market.yesPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-semibold">
                      No {market.noPercentage.toFixed(0)}%
                    </span>
                  </div>
                </>
              )}
              <div className="text-sm text-muted-foreground ml-auto">
                Vol: {market.volume}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="chart" className="h-full">
              <TabsList className="mx-5 mt-3 mb-0">
                <TabsTrigger value="chart" className="text-xs gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Chart
                </TabsTrigger>
                {isMulti && (
                  <TabsTrigger value="outcomes" className="text-xs gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Outcomes
                  </TabsTrigger>
                )}
                <TabsTrigger value="trades" className="text-xs gap-1">
                  <Activity className="w-3 h-3" />
                  Trades
                </TabsTrigger>
                <TabsTrigger value="details" className="text-xs gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Details
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="px-5 py-3">
                <Card className="p-3">
                  <MarketChart marketId={market.id} height={240} />
                </Card>
              </TabsContent>

              {/* Multi-outcome: full outcomes list */}
              {isMulti && (
                <TabsContent value="outcomes" className="px-5 py-3">
                  <div className="space-y-2">
                    {sortedOutcomes.map((o, i) => (
                      <div
                        key={o.label}
                        onClick={() => setSelectedOutcome(selectedOutcome === o.label ? null : o.label)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedOutcome === o.label
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${OUTCOME_DOT_COLORS[i % OUTCOME_DOT_COLORS.length]}`} />
                        <span className="flex-1 text-sm font-medium">{o.label}</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${OUTCOME_DOT_COLORS[i % OUTCOME_DOT_COLORS.length]}`}
                            style={{ width: `${o.probability}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold min-w-[3rem] text-right">
                          {Number(o.probability.toFixed(1))}%
                        </span>
                        <Button
                          size="sm"
                          variant={selectedOutcome === o.label ? "default" : "outline"}
                          className="text-xs h-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrade(o.label);
                          }}
                          disabled={!amount}
                        >
                          Buy
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              )}

              <TabsContent value="trades" className="px-5 py-3">
                <div className="space-y-1.5">
                  {recentTrades.map((t, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-sm"
                    >
                      <Badge
                        className={`text-xs ${
                          t.side === "buy"
                            ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                            : "bg-red-500/20 text-red-500 border-red-500/30"
                        }`}
                        variant="outline"
                      >
                        {t.side.toUpperCase()}
                      </Badge>
                      <span>{t.shares} shares</span>
                      <span className="font-medium">
                        {(t.price * 100).toFixed(0)}¢
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {t.time}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="details" className="px-5 py-3 space-y-3">
                {market.description && (
                  <Card className="p-4">
                    <h4 className="text-sm font-semibold mb-1">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {market.description}
                    </p>
                  </Card>
                )}
                <Card className="p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Venue</span>
                    <span className="font-medium">{market.venue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-medium">{market.volume}</span>
                  </div>
                  {market.endDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">End Date</span>
                      <span className="font-medium">
                        {new Date(market.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer — Trading CTAs */}
          <div className="p-5 pt-3 border-t border-border flex-shrink-0 space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Amount ($)
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-sm flex-1"
              />
              {[10, 50, 100].map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9 px-2"
                  onClick={() => setAmount(v.toString())}
                >
                  ${v}
                </Button>
              ))}
            </div>

            {isMulti ? (
              /* Multi-outcome: prompt to select from Outcomes tab */
              <p className="text-xs text-center text-muted-foreground">
                Select an outcome in the <span className="font-semibold">Outcomes</span> tab to place a trade
              </p>
            ) : (
              /* Binary YES/NO buttons */
              <div className="flex gap-2">
                <Button
                  onClick={() => handleTrade("yes")}
                  className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                  disabled={!amount}
                >
                  <TrendingUp className="w-4 h-4 mr-1.5" />
                  Buy Yes — {market.yesPercentage.toFixed(0)}¢
                </Button>
                <Button
                  onClick={() => handleTrade("no")}
                  variant="outline"
                  className="flex-1 h-11 border-red-500/40 text-red-500 hover:bg-red-500/10 font-bold"
                  disabled={!amount}
                >
                  <TrendingDown className="w-4 h-4 mr-1.5" />
                  Buy No — {market.noPercentage.toFixed(0)}¢
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={openFullPage}
            >
              Open in full page →
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
