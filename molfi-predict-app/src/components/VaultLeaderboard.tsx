import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/db";

interface LeaderboardEntry {
  rank: number;
  user_address: string;
  total_commitment: number;
  badge?: string;
  isEarlySupporter?: boolean;
}

export function VaultLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('soft_staking')
        .select('user_address, committed_amount, created_at')
        .eq('status', 'active')
        .order('committed_amount', { ascending: false });

      if (error) throw error;

      // Group by user and sum commitments
      const userCommitments = new Map<string, { amount: number; earliestDate: Date }>();
      
      data?.forEach(commitment => {
        const address = commitment.user_address;
        const amount = Number(commitment.committed_amount) / 1e18; // Changed from 1e6 to 1e18
        const date = new Date(commitment.created_at);
        
        if (userCommitments.has(address)) {
          const existing = userCommitments.get(address)!;
          existing.amount += amount;
          if (date < existing.earliestDate) {
            existing.earliestDate = date;
          }
        } else {
          userCommitments.set(address, { amount, earliestDate: date });
        }
      });

      // Convert to array and sort
      const sortedLeaders = Array.from(userCommitments.entries())
        .map(([address, data]) => ({
          user_address: address,
          total_commitment: data.amount,
          earliestDate: data.earliestDate
        }))
        .sort((a, b) => b.total_commitment - a.total_commitment)
        .slice(0, 10);

      // Add ranks and badges
      const leaderboardData: LeaderboardEntry[] = sortedLeaders.map((leader, index) => {
        const rank = index + 1;
        let badge = undefined;
        
        // Assign badges based on commitment amount
        if (leader.total_commitment >= 100000) {
          badge = "Diamond Staker 💎";
        } else if (leader.total_commitment >= 50000) {
          badge = "Platinum Staker 🏆";
        } else if (leader.total_commitment >= 10000) {
          badge = "Gold Staker 🥇";
        } else if (leader.total_commitment >= 1000) {
          badge = "Silver Staker 🥈";
        }
        
        // Early supporter badge (first 100 commitments)
        const isEarlySupporter = sortedLeaders.length > 0 && 
          leader.earliestDate.getTime() < Date.now() - (7 * 24 * 60 * 60 * 1000);

        return {
          rank,
          user_address: leader.user_address,
          total_commitment: leader.total_commitment,
          badge,
          isEarlySupporter
        };
      });

      setLeaders(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <TrendingUp className="w-6 h-6 text-primary" />;
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Soft Staking Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Top Soft Stakers
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Leaders earning the highest rewards
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <motion.div
              key={leader.user_address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border transition-all ${
                leader.rank <= 3
                  ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50'
                  : 'bg-card/30 border-border/30 hover:border-border/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getRankIcon(leader.rank)}
                    <span className="text-xl font-bold">#{leader.rank}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {shortenAddress(leader.user_address)}
                      </span>
                      {leader.isEarlySupporter && (
                        <Badge variant="outline" className="text-xs border-accent/50 text-accent">
                          <Award className="w-3 h-3 mr-1" />
                          Early Supporter
                        </Badge>
                      )}
                    </div>
                    {leader.badge && (
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {leader.badge}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">
                    ${leader.total_commitment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Commitment</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
