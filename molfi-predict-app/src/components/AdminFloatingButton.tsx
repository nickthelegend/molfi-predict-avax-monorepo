import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "@/hooks/useWallet";

/**
 * Floating button that appears for admin users when they navigate
 * away from the /admin dashboard. Provides quick access back.
 */
export function AdminFloatingButton() {
  const { address, isConnected } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status when wallet connects
  useEffect(() => {
    async function checkAdminStatus() {
      if (!isConnected || !address) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("is_admin_wallet", {
          _wallet_address: address.toLowerCase(),
        });

        if (error) {
          console.error("Admin check error:", error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      }
    }

    checkAdminStatus();
  }, [isConnected, address]);

  // Don't render if not admin or already on admin page
  if (!isAdmin || location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <Button
      onClick={() => navigate("/admin")}
      size="icon"
      className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 md:bottom-6"
      aria-label="Go to Admin Dashboard"
    >
      <ShieldAlert className="h-5 w-5" />
    </Button>
  );
}
