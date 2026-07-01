import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "@/hooks/useWallet";

type SparkTask = {
  id: string;
  title: string;
  description: string;
  sparks: number;
  category: "onboarding" | "daily" | "social" | "trading";
  oneTime: boolean;
};

type SparkTier = {
  name: string;
  minSparks: number;
  multiplier: number;
};

type SparksProfile = {
  id: string;
  wallet_address: string;
  sparks: number | null;
  streak: number | null;
  rank: number | null;
  completed_tasks: string[] | null;
};

type SparkHistoryRow = {
  id: string;
  created_at: string;
  amount: number | null;
  description: string | null;
  task_id: string | null;
};

type SparksProfileResponse = {
  profile?: SparksProfile;
  history?: SparkHistoryRow[];
};

const SPARK_TIERS: SparkTier[] = [
  { name: "Bronze", minSparks: 0, multiplier: 1.0 },
  { name: "Silver", minSparks: 500, multiplier: 1.25 },
  { name: "Gold", minSparks: 2000, multiplier: 1.5 },
  { name: "Platinum", minSparks: 5000, multiplier: 2.0 },
  { name: "Diamond", minSparks: 15000, multiplier: 3.0 },
];

const SPARK_TASKS: SparkTask[] = [
  { id: "connect_wallet", title: "Connect Wallet", description: "Connect your first wallet", sparks: 100, category: "onboarding", oneTime: true },
  { id: "complete_profile", title: "Complete Profile", description: "Fill out your profile", sparks: 50, category: "onboarding", oneTime: true },
  { id: "first_prediction", title: "First Prediction", description: "Place your first prediction", sparks: 150, category: "onboarding", oneTime: true },
  { id: "daily_login", title: "Daily Login", description: "Log in today", sparks: 10, category: "daily", oneTime: false },
  { id: "daily_prediction", title: "Daily Prediction", description: "Place at least one prediction today", sparks: 25, category: "daily", oneTime: false },
  { id: "refer_friend", title: "Refer a Friend", description: "Invite a friend", sparks: 300, category: "social", oneTime: false },
  { id: "win_prediction", title: "Win a Prediction", description: "Correctly predict an outcome", sparks: 50, category: "trading", oneTime: false },
  { id: "volume_100", title: "$100 Volume", description: "Reach $100 prediction volume", sparks: 500, category: "trading", oneTime: true },
];

const STREAK_BONUS_MULTIPLIER = 0.1;
const MAX_STREAK_DAYS = 7;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

async function fetchBackend<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!API_BASE_URL) return null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      ...init,
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isYesterdayUtc(now: Date, last: Date) {
  const y = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return isSameUtcDay(y, last);
}

export function useSparks() {
  const { address } = useWallet();
  const [profile, setProfile] = useState<SparksProfile | null>(null);
  const [history, setHistory] = useState<SparkHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address) {
      setProfile(null);
      setHistory([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Preferred path: backend-authoritative rewards rules
    const backendPayload = await fetchBackend<SparksProfileResponse>(`/api/sparks/profile?walletAddress=${encodeURIComponent(address.toLowerCase())}`);

    if (backendPayload?.profile) {
      setProfile(backendPayload.profile);
      setHistory(backendPayload.history ?? []);
      setLoading(false);
      return;
    }

    const { data: queriedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", address.toLowerCase())
      .maybeSingle();

    let p = queriedProfile as SparksProfile | null;

    if (!p) {
      const insertPayload = {
        id: crypto.randomUUID(),
        wallet_address: address.toLowerCase(),
        username: `Predictor ${address.slice(2, 6)}`,
        sparks: 0,
        streak: 0,
        rank: 0,
        completed_tasks: [],
      };
      const { data: created } = await supabase
        .from("profiles")
        .insert(insertPayload)
        .select("*")
        .single();
      p = created as unknown as SparksProfile;
    }

    const { data: rewards } = await supabase
      .from("rewards")
      .select("*")
      .eq("user_id", p.id)
      .in("reward_type", ["spark_earn", "spark_spend", "spark_bonus"])
      .order("created_at", { ascending: false })
      .limit(100);

    setProfile(p);
    setHistory((rewards as unknown as SparkHistoryRow[]) || []);
    setLoading(false);
  }, [address]);

  useEffect(() => {
    load();
  }, [load]);

  const currentTier = useMemo(() => {
    const total = profile?.sparks ?? 0;
    return [...SPARK_TIERS].reverse().find((t) => total >= t.minSparks) ?? SPARK_TIERS[0];
  }, [profile?.sparks]);

  const availableTasks = useMemo(() => {
    const completed: string[] = profile?.completed_tasks ?? [];
    return SPARK_TASKS.filter((t) => !(t.oneTime && completed.includes(t.id)));
  }, [profile?.completed_tasks]);

  const awardTask = useCallback(async (taskId: string) => {
    if (!profile) return 0;

    const backendAward = await fetchBackend<{ earned?: number }>("/api/sparks/award", {
      method: "POST",
      body: JSON.stringify({ walletAddress: profile.wallet_address, taskId }),
    });

    if (typeof backendAward?.earned === "number") {
      await load();
      return backendAward.earned;
    }

    const task = SPARK_TASKS.find((t) => t.id === taskId);
    if (!task) return 0;

    const completedTasks: string[] = profile.completed_tasks ?? [];
    if (task.oneTime && completedTasks.includes(taskId)) return 0;

    if (taskId === "daily_login" || taskId === "daily_prediction") {
      const { data: latest } = await supabase
        .from("rewards")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest?.created_at && isSameUtcDay(new Date(), new Date(latest.created_at))) {
        return 0;
      }
    }

    let nextStreak = profile.streak ?? 0;
    if (taskId === "daily_login") {
      const { data: latestLogin } = await supabase
        .from("rewards")
        .select("created_at")
        .eq("user_id", profile.id)
        .eq("task_id", "daily_login")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestLogin?.created_at) {
        nextStreak = 1;
      } else {
        const lastDate = new Date(latestLogin.created_at);
        nextStreak = isYesterdayUtc(new Date(), lastDate) ? (profile.streak ?? 0) + 1 : 1;
      }
    }

    const streakMultiplier = 1 + Math.min(nextStreak, MAX_STREAK_DAYS) * STREAK_BONUS_MULTIPLIER;
    const earned = Math.floor(task.sparks * currentTier.multiplier * streakMultiplier);

    const nextCompletedTasks = task.oneTime
      ? Array.from(new Set([...(profile.completed_tasks ?? []), taskId]))
      : profile.completed_tasks ?? [];

    const updates: Record<string, unknown> = {
      sparks: (profile.sparks ?? 0) + earned,
      completed_tasks: nextCompletedTasks,
    };
    if (taskId === "daily_login") {
      updates.streak = nextStreak;
    }

    await supabase.from("profiles").update(updates).eq("id", profile.id);

    await supabase.from("rewards").insert({
      user_id: profile.id,
      user_address: profile.wallet_address,
      reward_type: "spark_earn",
      amount: earned,
      task_id: taskId,
      description: `Completed: ${task.title}`,
    });

    await load();
    return earned;
  }, [profile, currentTier, load]);

  const awardDailyLogin = useCallback(async () => {
    await awardTask("daily_login");
  }, [awardTask]);

  useEffect(() => {
    if (profile?.id) {
      void awardDailyLogin();
    }
  }, [profile?.id, awardDailyLogin]);

  return {
    loading,
    profile,
    history,
    currentTier,
    availableTasks,
    awardTask,
    sparks: profile?.sparks ?? 0,
    streak: profile?.streak ?? 0,
    rank: profile?.rank ?? 0,
  };
}
