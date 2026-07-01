import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, Sparkles } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { brand, getThemedIcon } from "@/config/brand";

interface SharePreviewCardProps {
  commitment: number;
  apy: number;
  rewards: number;
  rank?: number;
  badge?: string;
}

export function SharePreviewCard({ commitment, apy, rewards, rank, badge }: SharePreviewCardProps) {
  const { theme, resolvedTheme } = useTheme();
  const logoIcon = getThemedIcon(theme, resolvedTheme);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-lg"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border-2 border-primary/30 p-8">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 text-6xl">💎</div>
          <div className="absolute bottom-4 left-4 text-5xl">🚀</div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl opacity-5">⭐</div>
        </div>

        <div className="relative z-10 space-y-6 text-center">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <img src={logoIcon} alt="Molfi" className="w-8 h-8" />
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Molfi Soft Staking
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">Share Preview</p>
          </div>

          {/* Main Stats */}
          <div className="space-y-4">
            {/* Commitment Amount */}
            <div className="p-6 rounded-xl bg-card/50 border border-border/50">
              <div className="text-sm text-muted-foreground mb-2">Total Committed</div>
              <div className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
                ${commitment.toLocaleString()}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* APY */}
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  <div className="text-xs text-muted-foreground">APY</div>
                </div>
                <div className="text-2xl font-bold text-accent">{apy.toFixed(0)}%</div>
              </div>

              {/* Rewards */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  <div className="text-xs text-muted-foreground">Rewards</div>
                </div>
                <div className="text-lg font-bold text-primary">{rewards.toLocaleString()}</div>
              </div>
            </div>

            {/* Rank & Badge */}
            {(rank || badge) && (
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {rank && (
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <span className="text-sm font-semibold">Rank #{rank}</span>
                  </div>
                )}
                {badge && (
                  <div className="px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                    <span className="text-sm font-semibold">{badge}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm font-semibold text-primary">Join me at molfi.com/earn</p>
          </div>
        </div>

        {/* Animated sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-primary"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 1,
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </Card>
      
      <p className="text-xs text-center text-muted-foreground mt-2">
        This is a preview. Click "Generate & Share" to create the actual image.
      </p>
    </motion.div>
  );
}
