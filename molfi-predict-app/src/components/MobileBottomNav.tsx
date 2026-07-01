import { Link, useLocation } from "react-router-dom";
import { TrendingUp, Vault, Trophy, User } from "lucide-react";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { path: "/markets", label: "Markets", icon: TrendingUp },
  { path: "/earn", label: "Earn", icon: Vault },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const location = useLocation();
  const isMobile = useIsMobile();

  // Only show on mobile
  if (!isMobile) return null;

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-lg"
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-2 relative"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
