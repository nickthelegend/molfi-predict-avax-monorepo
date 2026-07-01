import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { useMilestones } from "@/hooks/useMilestones";
import { motion } from "framer-motion";

interface MilestonesProgressProps {
  totalCommitted: number;
}

export function MilestonesProgress({ totalCommitted }: MilestonesProgressProps) {
  const { milestones, nextMilestone, totalRewards, getProgress } = useMilestones(totalCommitted);

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Milestone Rewards
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Total Earned:</span>
          <Badge className="bg-success text-success-foreground">{totalRewards} MOLFI</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {milestones.map((milestone, index) => {
          const progress = getProgress(milestone.amount);
          const isAchieved = milestone.achieved;
          const isNext = nextMilestone?.tier === milestone.tier;

          return (
            <motion.div
              key={milestone.tier}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-lg border transition-all ${
                isAchieved 
                  ? 'bg-success/10 border-success/30' 
                  : isNext
                  ? 'bg-primary/10 border-primary/30'
                  : 'bg-muted/30 border-border'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${milestone.color}`}>
                    {isAchieved ? (
                      <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    ) : (
                      <Lock className="w-5 h-5 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">{milestone.label}</div>
                    <div className="text-xs text-muted-foreground">
                      ${milestone.amount.toLocaleString()} commitment
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-success">+{milestone.reward}</div>
                  <div className="text-xs text-muted-foreground">MOLFI</div>
                </div>
              </div>

              {/* Progress Bar */}
              {!isAchieved && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      ${totalCommitted.toLocaleString()}
                    </span>
                    <span className="font-semibold">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    ${(milestone.amount - totalCommitted).toLocaleString()} more to unlock
                  </div>
                </div>
              )}

              {isAchieved && (
                <div className="flex items-center gap-2 text-sm text-success font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Milestone Achieved!</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}
