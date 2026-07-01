import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Coins, Trophy, Zap } from "lucide-react";
import { ShareCommitmentButton } from "./ShareCommitmentButton";
import { SharePreviewCard } from "./SharePreviewCard";
import { useState } from "react";
import { Button } from "./ui/button";

interface UserRewardsPanelProps {
  userAddress: string;
  totalCommitted: number;
  estimatedRewards: number;
  currentAPY: number;
}

export function UserRewardsPanel({ 
  userAddress, 
  totalCommitted, 
  estimatedRewards,
  currentAPY 
}: UserRewardsPanelProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Your Rewards
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time rewards tracking
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Live</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Total Committed */}
          <motion.div
            className="p-4 rounded-xl bg-card/50 border border-border/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Coins className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Total Committed</div>
                <div className="text-2xl font-bold">
                  ${totalCommitted.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Current APY */}
          <motion.div
            className="p-4 rounded-xl bg-card/50 border border-border/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Your APY</div>
                <div className="text-2xl font-bold text-accent">
                  {currentAPY.toFixed(2)}%
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Accumulated Rewards */}
        <motion.div
          className="p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(var(--primary-rgb), 0.2)',
              '0 0 30px rgba(var(--primary-rgb), 0.3)',
              '0 0 20px rgba(var(--primary-rgb), 0.2)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" />
              Accumulated Rewards
            </div>
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {estimatedRewards.toLocaleString()} MOLFI
            </div>
            <div className="text-xs text-muted-foreground mt-3">
              Updated every 4 hours
            </div>
          </div>
        </motion.div>


        {/* Preview Toggle */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showPreview ? "Hide Preview" : "Preview Share Image"}
          </Button>
        </div>

        {/* Share Preview */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <SharePreviewCard
              commitment={totalCommitted}
              apy={currentAPY}
              rewards={estimatedRewards}
            />
          </motion.div>
        )}

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ShareCommitmentButton
            userAddress={userAddress}
            commitment={totalCommitted}
            badge={undefined}
            apy={currentAPY}
            rewards={estimatedRewards}
          />
        </motion.div>

        {/* Wallet Address */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground">
            Tracking wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </div>
        </div>
      </div>
    </Card>
  );
}
