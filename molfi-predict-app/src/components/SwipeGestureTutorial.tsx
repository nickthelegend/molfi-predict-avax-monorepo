import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useIsMobile } from "@/hooks/use-mobile";

export function SwipeGestureTutorial() {
  const [hasSeenSwipeTutorial, setHasSeenSwipeTutorial] = useLocalStorage(
    "hasSeenSwipeTutorial",
    false
  );
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile && !hasSeenSwipeTutorial) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, hasSeenSwipeTutorial]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasSeenSwipeTutorial(true);
  };

  if (!isMobile || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[90]"
            onClick={handleDismiss}
          />

          {/* Tutorial Overlay - positioned over first card area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-32 left-4 right-4 z-[91] pointer-events-none"
          >
            {/* Tutorial Card */}
            <div className="bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border-2 border-primary/40 pointer-events-auto">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground">Swipe for Quick Actions</h3>
                    <p className="text-sm text-muted-foreground">Try swiping left on any market card</p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Animated Hand Demo */}
              <div className="relative h-32 bg-card/50 rounded-2xl overflow-hidden mb-4">
                {/* Mock Card */}
                <motion.div
                  className="absolute inset-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl border border-border flex items-center justify-center"
                >
                  <span className="text-sm text-muted-foreground">Market Card</span>
                </motion.div>

                {/* Action Icons Behind */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 3, repeat: Infinity, times: [0, 0.5, 1] }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs">
                    ❤️
                  </div>
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs">
                    🔔
                  </div>
                </motion.div>

                {/* Animated Hand */}
                <motion.div
                  animate={{
                    x: [0, -80, -80, 0],
                    opacity: [1, 1, 0.5, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-4xl"
                  style={{ zIndex: 10 }}
                >
                  👆
                </motion.div>

                {/* Swipe Arrow */}
                <motion.div
                  animate={{
                    x: [0, -60, -60, 0],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute right-20 top-1/2 -translate-y-1/2"
                >
                  <ChevronLeft className="w-8 h-8 text-primary" />
                </motion.div>
              </div>

              {/* Instructions */}
              <div className="space-y-2 text-sm text-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-xs">
                    ❤️
                  </div>
                  <span>Favorite markets for quick access</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                    🔔
                  </div>
                  <span>Set price alerts to stay updated</span>
                </div>
              </div>

              {/* Got It Button */}
              <button
                onClick={handleDismiss}
                className="mt-4 w-full bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Got it! Let me try
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
