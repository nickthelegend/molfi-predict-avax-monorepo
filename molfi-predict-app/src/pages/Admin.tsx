import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AdminStats } from "@/components/admin/AdminStats";
import { AlertsMonitor } from "@/components/admin/AlertsMonitor";
import { ActivityMonitor } from "@/components/admin/ActivityMonitor";
import { MarketsManager } from "@/components/admin/MarketsManager";
import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { ApiHealthMonitor } from "@/components/admin/ApiHealthMonitor";
import { RateLimitMonitor } from "@/components/admin/RateLimitMonitor";
import { ArenaAdminTab } from "@/components/admin/ArenaAdminTab";
import { WalletButton } from "@/components/WalletButton";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "sonner";
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Trophy,
  Shield,
  LogOut,
  Clock,
  Wallet,
} from "lucide-react";

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "dashboard";
  
  const { address, isConnected, disconnect } = useWallet();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  
  // Session timeout (30 minutes)
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Dashboard data
  const [allAlerts, setAllAlerts] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [customMarkets, setCustomMarkets] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    disconnect();
    setIsAdmin(false);
    toast.warning("Session expired due to inactivity. Please reconnect your wallet.");
  }, [disconnect]);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Set up session timeout tracking
  useEffect(() => {
    if (!isConnected || !isAdmin) return;

    const checkTimeout = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        handleSessionTimeout();
      }
    };

    timeoutRef.current = setInterval(checkTimeout, 60 * 1000);
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetActivityTimer));

    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetActivityTimer));
    };
  }, [isConnected, isAdmin, handleSessionTimeout, resetActivityTimer]);

  // Check admin status when wallet connects
  useEffect(() => {
    async function checkAdmin() {
      if (!isConnected || !address) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        // Check if wallet address has admin role using security definer function
        const { data: isAdminWallet, error } = await supabase
          .rpc("is_admin_wallet", { _wallet_address: address });

        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!isAdminWallet);
          
          if (isAdminWallet) {
            toast.success("Admin access granted");
          }
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    }
    
    setCheckingAdmin(true);
    checkAdmin();
  }, [isConnected, address]);

  // Fetch dashboard data when admin
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [alertsRes, activityRes, marketsRes] = await Promise.all([
        supabase.from("price_alerts").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("user_activity").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("custom_markets").select("*").order("created_at", { ascending: false }),
      ]);

      setAllAlerts(alertsRes.data || []);
      setUserActivity(activityRes.data || []);
      setCustomMarkets(marketsRes.data || []);
      setSystemStats({
        totalAlerts: alertsRes.data?.length || 0,
        totalActivity: activityRes.data?.length || 0,
        totalMarkets: marketsRes.data?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const handleLogout = () => {
    disconnect();
    setIsAdmin(false);
    toast.success("Disconnected");
  };

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  if (checkingAdmin && isConnected) {
    return <LoadingSpinner />;
  }

  // Not connected - show wallet connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="p-8 border border-border max-w-md w-full">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-2">Admin Access</h1>
                <p className="text-sm text-muted-foreground mb-6">
                  Connect your wallet to access the admin dashboard. Only authorized wallet addresses can access this area.
                </p>
              </div>
              <WalletButton />
              <p className="text-xs text-muted-foreground">
                Your wallet address must be registered as an admin to proceed.
              </p>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Access denied if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="p-8 border border-destructive/30 max-w-md">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-lg font-semibold">Access Denied</h1>
              <p className="text-sm text-muted-foreground">
                This wallet is not authorized for admin access.
              </p>
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded break-all">
                {address}
              </p>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect Wallet
              </Button>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground text-sm font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Session: 30 min timeout</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs value={defaultTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="arena" className="gap-2">
                <Trophy className="w-4 h-4" />
                Arena
              </TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {loadingDashboard ? (
                <LoadingSpinner />
              ) : (
                <>
                  <AdminStats
                    totalAlerts={systemStats?.totalAlerts || 0}
                    totalActivity={systemStats?.totalActivity || 0}
                    totalMarkets={systemStats?.totalMarkets || 0}
                  />
                  <ApiHealthMonitor />
                  <RateLimitMonitor />
                  {analytics && <AnalyticsCharts data={analytics} />}
                  <div className="grid gap-6 md:grid-cols-2">
                    <AlertsMonitor alerts={allAlerts} />
                    <ActivityMonitor activities={userActivity} />
                  </div>
                  <MarketsManager markets={customMarkets} />
                </>
              )}
            </TabsContent>

            {/* Arena Tab */}
            <TabsContent value="arena">
              <ArenaAdminTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
