import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";
import { LeaderboardEntry } from "@/types/demo";

export function Leaderboard() {
  const entries: LeaderboardEntry[] = [
    { rank: 1, name: "Alice", avatar: "A", profit: 450, roi: 120 },
    { rank: 2, name: "Bob", avatar: "B", profit: 380, roi: 95 },
    { rank: 3, name: "Charlie", avatar: "C", profit: 320, roi: 80 },
    { rank: 4, name: "Diana", avatar: "D", profit: 290, roi: 72 },
    { rank: 5, name: "Eve", avatar: "E", profit: 265, roi: 68 },
    { rank: 6, name: "Frank", avatar: "F", profit: 240, roi: 60 },
    { rank: 7, name: "Grace", avatar: "G", profit: 215, roi: 54 },
    { rank: 8, name: "Henry", avatar: "H", profit: 190, roi: 48 },
    { rank: 9, name: "Iris", avatar: "I", profit: 170, roi: 42 },
    { rank: 10, name: "Jack", avatar: "J", profit: 150, roi: 38 },
  ];

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Top 10 Demo Traders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                entry.rank <= 3 ? 'bg-warning/10 border border-warning/20' : 'bg-muted/30'
              }`}
            >
              <div className="w-8 text-center font-bold">
                {getMedalEmoji(entry.rank) || `#${entry.rank}`}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarFallback>{entry.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-semibold">{entry.name}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-success">+${entry.profit}</div>
                <div className="text-sm text-muted-foreground">+{entry.roi}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
