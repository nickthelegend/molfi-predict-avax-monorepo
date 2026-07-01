import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Coins } from "lucide-react";
import { SEO } from "@/components/SEO";
import { AIModelLeaderboard } from "@/components/AIModelLeaderboard";
import { FollowTraderModal } from "@/components/FollowTraderModal";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LeaderboardEntry } from "@/services/molfi-api";

const Leaderboard = () => {
  const [sortBy, setSortBy] = useState<'pnl' | 'roi' | 'winRate'>('pnl');
  const { traders, isLoading, error } = useLeaderboard({ sortBy, limit: 20 });

  const [followModalOpen, setFollowModalOpen] = useState(false);
  const [selectedTrader, setSelectedTrader] = useState<LeaderboardEntry | null>(null);

  const shortenAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const formatProfit = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${pnl.toLocaleString()}`;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: <Trophy className="w-5 h-5 text-warning" />, class: "text-warning" };
    if (rank === 2) return { icon: <Trophy className="w-5 h-5 text-muted-foreground" />, class: "text-muted-foreground" };
    if (rank === 3) return { icon: <Trophy className="w-5 h-5 text-warning/60" />, class: "text-warning/60" };
    return { icon: <span className="text-sm font-medium text-muted-foreground">#{rank}</span>, class: "text-muted-foreground" };
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Trading Leaderboard - Top Prediction Market Traders | Molfi"
        description="View the top prediction market traders on Molfi. Track rankings, win rates, total profits and trading volume."
      />
      <Header />
      
      <div className="px-4 py-8 max-w-5xl mx-auto">
        {isLoading && (
          <div className="mb-6 py-3 px-4 bg-muted border border-border rounded-md">
            <p className="text-xs text-center text-muted-foreground uppercase tracking-wide">
              Loading leaderboard...
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 py-3 px-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-xs text-center text-destructive uppercase tracking-wide">
              {error.message}
            </p>
          </div>
        )}

        {/* Header + Sort */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top traders on Molfi</p>
          </div>
          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <TabsList>
              <TabsTrigger value="pnl">P&L</TabsTrigger>
              <TabsTrigger value="roi">ROI</TabsTrigger>
              <TabsTrigger value="winRate">Win Rate</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* AI Model Leaderboard */}
        <div className="mb-8">
          <AIModelLeaderboard />
        </div>

        {/* Leaderboard Table */}
        <Card className="overflow-hidden border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Top Traders</h2>
          </div>
          
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
            <div className="col-span-1">Rank</div>
            <div className="col-span-3">Trader</div>
            <div className="col-span-2 text-right">Trades</div>
            <div className="col-span-2 text-right">Profit</div>
            <div className="col-span-2 text-right">Win Rate</div>
            <div className="col-span-2 text-center">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border">
            {traders.map((trader) => {
              const rankDisplay = getRankDisplay(trader.rank);
              const avatarEmoji = ['👑', '🎯', '⚡', '🔮', '🧠', '🎲', '👁️', '📈', '💎', '🚀'][trader.rank - 1] || '🌟';
              
              return (
                <div
                  key={trader.user_id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors duration-150"
                >
                  <div className="col-span-1 flex justify-center">
                    {rankDisplay.icon}
                  </div>

                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-lg">
                      {avatarEmoji}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm font-mono">{shortenAddress(trader.user_id)}</p>
                      <div className="flex items-center gap-1 md:hidden">
                        <span className="text-xs text-muted-foreground">{trader.total_trades} trades</span>
                        {trader.badge && <Badge variant="secondary" className="text-[10px]">{trader.badge}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-2 text-right">
                    <span className="text-sm text-muted-foreground">{trader.total_trades}</span>
                  </div>

                  <div className="col-span-2 text-right">
                    <span className={`text-sm font-medium ${trader.total_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatProfit(trader.total_pnl)}
                    </span>
                  </div>

                  <div className="col-span-2 text-right">
                    <Badge variant="secondary" className="text-xs font-medium">
                      {trader.win_rate.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        setSelectedTrader(trader);
                        setFollowModalOpen(true);
                      }}
                    >
                      <UserPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Follow</span>
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {traders.length === 0 && !isLoading && (
              <div className="px-4 py-8 text-center text-muted-foreground">
                No traders found. Start trading to appear on the leaderboard!
              </div>
            )}
          </div>
        </Card>
      </div>

      <Footer />

      {selectedTrader && (
        <FollowTraderModal
          open={followModalOpen}
          onOpenChange={setFollowModalOpen}
          traderAddress={selectedTrader.user_id}
          traderStats={{
            winRate: selectedTrader.win_rate,
            totalPnl: selectedTrader.total_pnl,
            totalTrades: selectedTrader.total_trades
          }}
        />
      )}
    </div>
  );
};

export default Leaderboard;
