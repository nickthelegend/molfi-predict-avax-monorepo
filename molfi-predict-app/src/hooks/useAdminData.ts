import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/db";
import { format, subDays } from "date-fns";

export const useAdminData = () => {
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
  });

  const { data: allAlerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: userActivity, isLoading: loadingActivity } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: customMarkets, isLoading: loadingMarkets } = useQuery({
    queryKey: ["admin-markets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custom_markets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin === true,
  });

  const { data: systemStats, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [alertsCount, activityCount, marketsCount] = await Promise.all([
        supabase.from("price_alerts").select("*", { count: "exact", head: true }),
        supabase.from("user_activity").select("*", { count: "exact", head: true }),
        supabase.from("custom_markets").select("*", { count: "exact", head: true }),
      ]);

      return {
        totalAlerts: alertsCount.count || 0,
        totalActivity: activityCount.count || 0,
        totalMarkets: marketsCount.count || 0,
      };
    },
    enabled: isAdmin === true,
  });

  const { data: analytics, isLoading: loadingAnalytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data: activities, error } = await supabase
        .from("user_activity")
        .select("*")
        .gte("created_at", subDays(new Date(), 7).toISOString());

      if (error) throw error;

      // Activity by type
      const activityByType = activities?.reduce((acc: any, activity) => {
        const type = activity.activity_type;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const activityByTypeArray = Object.entries(activityByType || {}).map(([name, value]) => ({
        name: name.replace(/_/g, ' '),
        value: value as number,
      }));

      // Activity by day
      const activityByDay = activities?.reduce((acc: any, activity) => {
        const date = format(new Date(activity.created_at), 'MM/dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const activityByDayArray = Object.entries(activityByDay || {}).map(([date, count]) => ({
        date,
        count: count as number,
      }));

      // Page views
      const pageViews = activities
        ?.filter(a => a.activity_type === 'page_viewed')
        .reduce((acc: any, activity) => {
          const details = activity.details as any;
          const page = details?.path || 'unknown';
          acc[page] = (acc[page] || 0) + 1;
          return acc;
        }, {});

      const pageViewsArray = Object.entries(pageViews || {})
        .map(([page, views]) => ({
          page: page === '/' ? 'Home' : page.slice(1),
          views: views as number,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      return {
        activityByType: activityByTypeArray,
        activityByDay: activityByDayArray,
        pageViews: pageViewsArray,
      };
    },
    enabled: isAdmin === true,
  });

  return {
    isAdmin: isAdmin || false,
    checkingAdmin,
    allAlerts,
    loadingAlerts,
    userActivity,
    loadingActivity,
    customMarkets,
    loadingMarkets,
    systemStats,
    loadingStats,
    analytics,
    loadingAnalytics,
  };
};
