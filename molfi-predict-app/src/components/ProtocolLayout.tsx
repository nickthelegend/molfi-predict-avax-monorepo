import { ReactNode, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { getThemedLogo } from "@/config/brand";
import { useTheme } from "@/providers/ThemeProvider";

interface ProtocolLayoutProps {
  children: ReactNode;
  showGrid?: boolean;
  showBanner?: boolean;
  showTelemetry?: boolean;
  telemetryLine1?: string;
  telemetryLine2?: string;
}

/**
 * Protocol-grade layout wrapper that provides consistent styling
 * across all Molfi pages matching the landing page aesthetic.
 */
export function ProtocolLayout({
  children,
  showGrid = true,
  showBanner = true,
  showTelemetry = true,
  telemetryLine1 = "AGGREGATION: ACTIVE",
  telemetryLine2 = "STATE: OPERATIONAL",
}: ProtocolLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, resolvedTheme } = useTheme();
  const logo = getThemedLogo(theme, resolvedTheme);
  const [bannerVisible, setBannerVisible] = useState(showBanner);

  // Get current page name for telemetry
  const getPageLabel = () => {
    const path = location.pathname;
    if (path === "/markets") return "MARKETS";
    if (path === "/earn" || path === "/vaults") return "SOFT_STAKE";
    if (path === "/portfolio") return "PORTFOLIO";
    if (path === "/leaderboard") return "LEADERBOARD";
    if (path === "/profile") return "PROFILE";
    if (path === "/settings") return "SETTINGS";
    if (path === "/admin") return "ADMIN";
    return "MOLFI";
  };

  return (
    <div 
      className="relative min-h-screen bg-[#050505] text-white"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Broadcast FX Layer - Scanlines */}
      <div 
        className="fixed inset-0 pointer-events-none z-[100]"
        style={{
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.02) 2px,
              rgba(0,0,0,0.02) 4px
            )
          `,
          mixBlendMode: "overlay",
        }}
      />

      {/* Grid Background */}
      {showGrid && (
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      )}

      {/* Alpha Banner */}
      {bannerVisible && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-amber-400">
              ALPHA_PHASE
            </span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-white/40 hidden sm:inline">
              // FEATURES MAY BE LIMITED
            </span>
          </div>
          <button 
            onClick={() => setBannerVisible(false)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Header */}
      <div 
        className="fixed z-40 flex items-center justify-between w-full px-4 md:px-8"
        style={{ top: bannerVisible ? "40px" : "8px" }}
      >
        {/* Telemetry */}
        {showTelemetry && (
          <div className="hidden md:block">
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/15">
              {telemetryLine1}
            </div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/15">
              {telemetryLine2}
            </div>
          </div>
        )}

        {/* Page Label (Mobile) */}
        <div className="md:hidden">
          <span className="text-[11px] uppercase tracking-[0.15em] text-white/60">
            {getPageLabel()}
          </span>
        </div>

        {/* Logo */}
        <div 
          className="cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img 
            src={logo} 
            alt="Molfi" 
            className="h-5 md:h-6 opacity-80 hover:opacity-100 transition-opacity" 
          />
        </div>
      </div>

      {/* Main Content */}
      <main 
        className="relative z-10"
        style={{ paddingTop: bannerVisible ? "80px" : "48px" }}
      >
        {children}
      </main>

      {/* Footer Status */}
      <div className="fixed bottom-4 left-0 right-0 z-30 pointer-events-none">
        <div className="text-center">
          <span className="text-[9px] uppercase tracking-[0.1em] text-white/15">
            NETWORK_STATUS: DEVELOPMENT • BUILD: 0.1.0-ALPHA
          </span>
        </div>
      </div>
    </div>
  );
}
