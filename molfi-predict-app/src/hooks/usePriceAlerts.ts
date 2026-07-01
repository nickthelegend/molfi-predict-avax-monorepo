import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/db";
import { useActivityTracking } from "./useActivityTracking";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";

export interface PriceAlert {
  id: string;
  wallet_address: string;
  market_id: string;
  market_title: string;
  target_price: number;
  condition: "above" | "below";
  is_active: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const usePriceAlerts = (marketId?: string) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { trackActivity } = useActivityTracking();
  const { address } = useWallet();
  const normalizedAddress = address?.toLowerCase();

  const fetchAlerts = async () => {
    if (!normalizedAddress) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("price_alerts")
        .select("*")
        .eq("wallet_address", normalizedAddress)
        .order("created_at", { ascending: false });

      if (marketId) {
        query = query.eq("market_id", marketId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts((data || []) as PriceAlert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error("Failed to load price alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const createAlert = async (
    marketId: string,
    marketTitle: string,
    targetPrice: number,
    condition: "above" | "below"
  ) => {
    if (!normalizedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const { error } = await supabase.from("price_alerts").insert({
        wallet_address: normalizedAddress,
        market_id: marketId,
        market_title: marketTitle,
        target_price: targetPrice,
        condition: condition,
        user_id: "00000000-0000-0000-0000-000000000000", // Placeholder for migration compatibility
      } as any);

      if (error) throw error;

      trackActivity({
        activityType: "alert_created",
        details: { marketId, marketTitle, targetPrice, condition },
      });
      
      toast.success("Price alert created successfully");
      await fetchAlerts();
    } catch (error) {
      console.error("Error creating alert:", error);
      toast.error("Failed to create price alert");
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;

      trackActivity({
        activityType: "alert_deleted",
        details: { alertId },
      });
      
      toast.success("Price alert deleted");
      await fetchAlerts();
    } catch (error) {
      console.error("Error deleting alert:", error);
      toast.error("Failed to delete price alert");
    }
  };

  const toggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("price_alerts")
        .update({ is_active: isActive })
        .eq("id", alertId);

      if (error) throw error;
      
      toast.success(isActive ? "Alert activated" : "Alert deactivated");
      await fetchAlerts();
    } catch (error) {
      console.error("Error toggling alert:", error);
      toast.error("Failed to update alert");
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Set up realtime subscription for alerts
    const channel = supabase
      .channel("price_alerts_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "price_alerts",
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [marketId, normalizedAddress]);

  return {
    alerts,
    isLoading,
    createAlert,
    deleteAlert,
    toggleAlert,
    refresh: fetchAlerts,
  };
};