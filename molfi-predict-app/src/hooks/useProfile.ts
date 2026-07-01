import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export function useProfile() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const normalizedAddress = address?.toLowerCase();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", normalizedAddress],
    queryFn: async () => {
      if (!normalizedAddress) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", normalizedAddress)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!normalizedAddress,
  });

  const { data: activity, isLoading: activityLoading } = useQuery({
    queryKey: ["user_activity", normalizedAddress],
    queryFn: async () => {
      if (!normalizedAddress) return [];
      
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("wallet_address", normalizedAddress)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!normalizedAddress,
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["user_preferences", normalizedAddress],
    queryFn: async () => {
      if (!normalizedAddress) return null;
      
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("wallet_address", normalizedAddress)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!normalizedAddress,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["user_orders", normalizedAddress],
    queryFn: async () => {
      if (!normalizedAddress) return { open: [], closed: [] };
      
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("maker_address", normalizedAddress)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const openOrders = data?.filter(o => o.status === 'pending') || [];
      const closedOrders = data?.filter(o => ['filled', 'cancelled'].includes(o.status)) || [];
      
      return { open: openOrders, closed: closedOrders };
    },
    enabled: !!normalizedAddress,
  });

  // Calculate trading stats from activity
  const trading_stats = {
    totalActivities: activity?.length || 0,
    alertsCreated: activity?.filter(a => a.activity_type === "alert_created").length || 0,
    marketsViewed: activity?.filter(a => a.activity_type === "market_viewed").length || 0,
    tradesExecuted: activity?.filter(a => a.activity_type === "trade_executed").length || 0,
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!normalizedAddress) throw new Error("No wallet connected");

      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("wallet_address", normalizedAddress)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("wallet_address", normalizedAddress);
        
        if (error) throw error;
      } else {
        // Insert new profile with generated UUID
        const { error } = await supabase
          .from("profiles")
          .insert({
            id: crypto.randomUUID(),
            wallet_address: normalizedAddress,
            ...updates,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", normalizedAddress] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    },
  });

  return {
    profile,
    user_activity: activity || [],
    user_preferences: preferences,
    orders: orders || { open: [], closed: [] },
    trading_stats,
    isLoading: profileLoading || activityLoading || preferencesLoading || ordersLoading,
    updateProfile: updateProfileMutation.mutate,
  };
}