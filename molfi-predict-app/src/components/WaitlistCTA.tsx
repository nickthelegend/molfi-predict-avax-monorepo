import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/db";

interface WaitlistStatus {
  id: string;
  referral_code: string | null;
  email: string;
}

export function WaitlistCTA() {
  const navigate = useNavigate();
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkWaitlistStatus();
  }, []);

  const checkWaitlistStatus = async () => {
    try {
      // Check if user email is stored in localStorage (from previous signup)
      const storedEmail = localStorage.getItem("waitlist_email");
      
      if (storedEmail) {
        const { data, error } = await supabase
          .from("waitlist_signups")
          .select("id, referral_code, email")
          .eq("email", storedEmail)
          .maybeSingle();

        if (data && !error) {
          setWaitlistStatus(data);
        }
      }
    } catch (error) {
      console.error("Error checking waitlist status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    if (waitlistStatus) {
      // Already on waitlist - could navigate to status page or show modal
      navigate("/waitlist");
    } else {
      navigate("/waitlist");
    }
  };

  if (isLoading) {
    return (
      <div
        className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] cursor-pointer pointer-events-auto transition-colors duration-200"
        style={{
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(200, 190, 150, 0.4)",
        }}
      >
        ...
      </div>
    );
  }

  return (
    <div
      className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] cursor-pointer pointer-events-auto transition-colors duration-200 hover:text-amber-300 text-center"
      style={{
        bottom: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        color: waitlistStatus ? "rgba(43, 213, 118, 0.8)" : "rgba(200, 190, 150, 0.7)",
        animation: "ctaPulse 3s ease-in-out infinite",
        animationDelay: "0.75s",
      }}
      onClick={handleClick}
    >
      {waitlistStatus ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-white/60">✓ WAITLISTED</span>
          <span className="text-[8px] text-white/40">
            ID: {waitlistStatus.id.slice(0, 8)}...
          </span>
          {waitlistStatus.referral_code && (
            <span className="text-[8px] text-amber-400/70">
              REF: {waitlistStatus.referral_code}
            </span>
          )}
        </div>
      ) : (
        "GET ACCESS →"
      )}
    </div>
  );
}
