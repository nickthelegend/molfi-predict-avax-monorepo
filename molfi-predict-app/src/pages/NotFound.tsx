import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Terminal, Home, Search } from "lucide-react";
import { getThemedLogo } from "@/config/brand";
import { useTheme } from "@/providers/ThemeProvider";

const NotFound = () => {
  const { theme, resolvedTheme } = useTheme();
  const logo = getThemedLogo(theme, resolvedTheme);

  return (
    <div 
      className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Grid Background */}
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

      {/* Scanlines */}
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

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between w-full px-4 md:px-8 py-4">
        <div className="hidden md:block">
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/15">
            ERROR_CODE: 404
          </div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/15">
            STATUS: NOT_FOUND
          </div>
        </div>
        
        <Link to="/" className="cursor-pointer">
          <img 
            src={logo} 
            alt="Molfi" 
            className="h-5 md:h-6 opacity-80 hover:opacity-100 transition-opacity" 
          />
        </Link>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full text-center"
        >
          {/* Terminal Window */}
          <div className="bg-black/60 border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-[10px] uppercase tracking-[0.1em] text-white/40">
                molfi_terminal
              </span>
            </div>
            
            {/* Terminal Content */}
            <div className="p-6 md:p-8 text-left font-mono space-y-4">
              <div className="flex items-center gap-2 text-white/40">
                <Terminal className="w-4 h-4" />
                <span className="text-[11px] uppercase tracking-[0.1em]">system_error</span>
              </div>
              
              <div className="space-y-2">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-white/60 text-sm"
                >
                  <span className="text-amber-400">$</span> navigate --path="{typeof window !== 'undefined' ? window.location.pathname : '/unknown'}"
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-red-400/80 text-sm"
                >
                  ERROR: Route not found in routing table
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-white/40 text-sm"
                >
                  Attempting recovery...
                </motion.div>
              </div>

              {/* 404 Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.3 }}
                className="py-8"
              >
                <div className="text-[80px] md:text-[120px] font-bold leading-none text-center">
                  <span className="bg-gradient-to-r from-white/80 via-white/40 to-white/80 bg-clip-text text-transparent">
                    404
                  </span>
                </div>
                <div className="text-center text-[11px] uppercase tracking-[0.2em] text-white/30 mt-2">
                  page_not_found
                </div>
              </motion.div>

              {/* Suggested Actions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="space-y-2 text-sm"
              >
                <div className="text-white/40">
                  <span className="text-green-400">$</span> suggest --actions
                </div>
                <div className="text-white/60 pl-4 space-y-1">
                  <div>→ Return to homepage</div>
                  <div>→ Explore markets</div>
                  <div>→ Go back to previous page</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded text-[11px] uppercase tracking-[0.1em] text-white/80 hover:text-white transition-all"
            >
              <Home className="w-4 h-4" />
              Homepage
            </Link>
            
            <Link
              to="/markets"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[11px] uppercase tracking-[0.1em] text-white/60 hover:text-white/80 transition-all"
            >
              <Search className="w-4 h-4" />
              Markets
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-white/5 border border-white/10 rounded text-[11px] uppercase tracking-[0.1em] text-white/40 hover:text-white/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer Status */}
      <div className="relative z-10 py-4 text-center">
        <span className="text-[9px] uppercase tracking-[0.1em] text-white/15">
          NETWORK_STATUS: OPERATIONAL • SYSTEM: HEALTHY
        </span>
      </div>
    </div>
  );
};

export default NotFound;
