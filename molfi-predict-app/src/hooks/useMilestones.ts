import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "./useWallet";
import { toast } from "sonner";

// Callback for triggering confetti
let confettiCallback: (() => void) | null = null;

export const setConfettiCallback = (callback: () => void) => {
  confettiCallback = callback;
};

export interface Milestone {
  tier: string;
  amount: number;
  reward: number;
  label: string;
  color: string;
  achieved: boolean;
}

export function useMilestones(totalCommitted: number) {
  const { address } = useWallet();
  const [achievedMilestones, setAchievedMilestones] = useState<Set<string>>(new Set());
  const [totalRewards, setTotalRewards] = useState(0);

  const milestones: Milestone[] = [
    { tier: 'bronze_1k', amount: 1000, reward: 50, label: 'Bronze Pioneer', color: 'bg-amber-600', achieved: false },
    { tier: 'silver_10k', amount: 10000, reward: 500, label: 'Silver Supporter', color: 'bg-gray-400', achieved: false },
    { tier: 'gold_50k', amount: 50000, reward: 2500, label: 'Gold Champion', color: 'bg-yellow-500', achieved: false },
    { tier: 'diamond_100k', amount: 100000, reward: 10000, label: 'Diamond Elite', color: 'bg-purple-500', achieved: false },
  ];

  useEffect(() => {
    if (address) {
      loadAchievedMilestones();
    }
  }, [address]);

  useEffect(() => {
    if (address && totalCommitted > 0) {
      checkAndAwardMilestones();
    }
  }, [address, totalCommitted]);

  const loadAchievedMilestones = async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('user_milestones')
        .select('milestone_tier, reward_amount')
        .eq('user_address', address);

      if (error) throw error;

      const achieved = new Set<string>(data?.map((m: any) => m.milestone_tier as string) || []);
      setAchievedMilestones(achieved);

      const total = data?.reduce((sum, m) => sum + Number(m.reward_amount), 0) || 0;
      setTotalRewards(total);
    } catch (error) {
      console.error("Failed to load milestones:", error);
    }
  };

  const checkAndAwardMilestones = async () => {
    if (!address) return;

    for (const milestone of milestones) {
      if (totalCommitted >= milestone.amount && !achievedMilestones.has(milestone.tier)) {
        try {
          // Award milestone
          const { error: milestoneError } = await supabase
            .from('user_milestones')
            .insert({
              user_address: address,
              milestone_tier: milestone.tier,
              reward_amount: milestone.reward
            });

          if (milestoneError) continue;

          // Create reward entry
          await supabase.from('rewards').insert({
            user_address: address,
            reward_type: 'milestone',
            amount: milestone.reward,
            description: `${milestone.label} milestone unlocked`
          });

          // Show toast and trigger confetti
          toast.success(`🎉 Milestone Unlocked: ${milestone.label}! +${milestone.reward} MOLFI`);
          
          if (confettiCallback) {
            confettiCallback();
          }

          // Refresh data
          await loadAchievedMilestones();
        } catch (error) {
          console.error("Failed to award milestone:", error);
        }
      }
    }
  };

  const getMilestonesWithProgress = (): Milestone[] => {
    return milestones.map(m => ({
      ...m,
      achieved: achievedMilestones.has(m.tier)
    }));
  };

  const getNextMilestone = (): Milestone | null => {
    const next = milestones.find(m => !achievedMilestones.has(m.tier) && totalCommitted < m.amount);
    return next ? { ...next, achieved: false } : null;
  };

  const getProgress = (milestoneAmount: number): number => {
    return Math.min((totalCommitted / milestoneAmount) * 100, 100);
  };

  return {
    milestones: getMilestonesWithProgress(),
    nextMilestone: getNextMilestone(),
    totalRewards,
    getProgress,
    refreshMilestones: loadAchievedMilestones
  };
}
