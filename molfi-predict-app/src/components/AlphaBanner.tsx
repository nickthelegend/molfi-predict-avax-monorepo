import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

export const AlphaBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  // Hide on Index page since it has its own banner
  const isIndexPage = location.pathname === "/";

  useEffect(() => {
    const dismissed = localStorage.getItem("alpha-banner-dismissed");
    if (dismissed === "true") {
      setIsVisible(false);
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("alpha-banner-dismissed", "true");
    setIsDismissed(true);
  };

  if (isDismissed || isIndexPage) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-b border-border/50 backdrop-blur-sm"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-2 gap-4">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-lg">🚧</span>
                <p className="text-sm text-foreground/80">
                  <span className="font-semibold text-primary">Alpha Phase:</span> We're currently under development. Some features may be limited or in testing.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-background/50 rounded-md transition-colors shrink-0"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
