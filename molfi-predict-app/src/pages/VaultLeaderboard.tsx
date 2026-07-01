import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp, Crown } from "lucide-react";
import { SEO } from "@/components/SEO";
import { supabase } from "@/integrations/supabase/db";
import { ShareButton } from "@/components/ShareButton";

interface LeaderboardEntry {
  user_address: string;
  total_committed: number;
  usdc_amount: number;
  usdt_amount: number;
  rank: number;
}

export default function VaultLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('soft_staking')
        .select('user_address, token, committed_amount')
        .eq('status', 'active');

      if (error) throw error;

      // Aggregate by user
      const userMap = new Map<string, { usdc: number; usdt: number }>();
      
      data?.forEach((entry) => {
        const address = entry.user_address;
        const amount = Number(entry.committed_amount) / 1e18;
        
        if (!userMap.has(address)) {
          userMap.set(address, { usdc: 0, usdt: 0 });
        }
        
        const user = userMap.get(address)!;
        if (entry.token === 'USDC') {
          user.usdc += amount;
        } else {
          user.usdt += amount;
        }
      });

      // Convert to array and sort
      const sorted = Array.from(userMap.entries())
        .map(([address, amounts]) => ({
          user_address: address,
          usdc_amount: amounts.usdc,
          usdt_amount: amounts.usdt,
          total_committed: amounts.usdc + amounts.usdt,
          rank: 0,
        }))
        .sort((a, b) => b.total_committed - a.total_committed)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(sorted);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-primary" />;
      case 2:
        return <Trophy className="w-6 h-6 text-accent" />;
      case 3:
        return <Medal className="w-6 h-6 text-secondary" />;
      default:
        return <Award className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getRankBadge = (amount: number) => {
    if (amount >= 100000) return { label: "Whale", color: "bg-primary" };
    if (amount >= 50000) return { label: "Diamond", color: "bg-accent" };
    if (amount >= 25000) return { label: "Gold", color: "bg-secondary" };
    if (amount >= 10000) return { label: "Silver", color: "bg-muted" };
    return { label: "Bronze", color: "bg-muted-foreground" };
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <SEO 
        title="Vault Leaderboard - Top Soft Stakers"
        description="View the top soft stakers on Molfi's delta-neutral vaults. Early supporters earn exclusive badges and rewards."
      />
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Soft Staking Leaders</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Vault Leaderboard
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Top early supporters committing to Molfi's delta-neutral vaults. Higher commitments earn exclusive badges and priority access.
            </p>
          </motion.div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-3 gap-4 mb-12"
            >
              {/* 2nd Place */}
              <div className="pt-12">
                <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-transparent">
                  <CardContent className="pt-6 text-center">
                    <Trophy className="w-12 h-12 mx-auto mb-3 text-accent" />
                    <div className="text-sm text-muted-foreground mb-1">2nd Place</div>
                    <div className="font-mono text-sm mb-2">{shortenAddress(leaderboard[1].user_address)}</div>
                    <div className="text-2xl font-bold mb-2">${leaderboard[1].total_committed.toLocaleString()}</div>
                    <Badge className={getRankBadge(leaderboard[1].total_committed).color}>
                      {getRankBadge(leaderboard[1].total_committed).label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* 1st Place */}
              <div>
                <Card className="border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-transparent shadow-lg shadow-yellow-500/20">
                  <CardContent className="pt-6 text-center">
                    <Crown className="w-16 h-16 mx-auto mb-3 text-yellow-500 animate-pulse" />
                    <div className="text-sm text-muted-foreground mb-1">1st Place</div>
                    <div className="font-mono text-sm mb-2">{shortenAddress(leaderboard[0].user_address)}</div>
                    <div className="text-3xl font-bold mb-2 text-yellow-500">${leaderboard[0].total_committed.toLocaleString()}</div>
                    <Badge className={getRankBadge(leaderboard[0].total_committed).color}>
                      {getRankBadge(leaderboard[0].total_committed).label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* 3rd Place */}
              <div className="pt-12">
                <Card className="border-amber-600/30 bg-gradient-to-br from-amber-600/10 to-transparent">
                  <CardContent className="pt-6 text-center">
                    <Medal className="w-12 h-12 mx-auto mb-3 text-amber-600" />
                    <div className="text-sm text-muted-foreground mb-1">3rd Place</div>
                    <div className="font-mono text-sm mb-2">{shortenAddress(leaderboard[2].user_address)}</div>
                    <div className="text-2xl font-bold mb-2">${leaderboard[2].total_committed.toLocaleString()}</div>
                    <Badge className={getRankBadge(leaderboard[2].total_committed).color}>
                      {getRankBadge(leaderboard[2].total_committed).label}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Full Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>All Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No commitments yet. Be the first!</div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry, index) => (
                      <motion.div
                        key={entry.user_address}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 flex items-center justify-center">
                            {getRankIcon(entry.rank)}
                          </div>
                          <div>
                            <div className="font-mono text-sm">{shortenAddress(entry.user_address)}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              {entry.usdc_amount > 0 && <span>USDC: ${entry.usdc_amount.toLocaleString()}</span>}
                              {entry.usdt_amount > 0 && <span>USDT: ${entry.usdt_amount.toLocaleString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold">${entry.total_committed.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Total Committed</div>
                          </div>
                          <Badge className={getRankBadge(entry.total_committed).color}>
                            {getRankBadge(entry.total_committed).label}
                          </Badge>
                          <ShareButton
                            amount={entry.total_committed}
                            rank={entry.rank}
                            badge={getRankBadge(entry.total_committed).label}
                            size="sm"
                            variant="ghost"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <Footer />
      </div>
    </>
  );
}
