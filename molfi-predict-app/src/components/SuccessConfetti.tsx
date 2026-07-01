import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles } from "lucide-react";

interface SuccessConfettiProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  type?: "trade" | "milestone" | "achievement";
}

export function SuccessConfetti({ 
  show, 
  onComplete, 
  message = "Success! 🎉",
  type = "trade" 
}: SuccessConfettiProps) {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  const getIcon = () => {
    switch (type) {
      case "milestone":
        return <Trophy className="w-16 h-16 text-yellow-500" />;
      case "achievement":
        return <Star className="w-16 h-16 text-purple-500" />;
      default:
        return <Sparkles className="w-16 h-16 text-pink-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "milestone":
        return ["#FFD700", "#FFA500", "#FF6B6B"];
      case "achievement":
        return ["#9333EA", "#EC4899", "#06B6D4"];
      default:
        return ["#EC4899", "#9333EA", "#06B6D4", "#10B981"];
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
            colors={getColors()}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ 
                rotate: [0, -5, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 0.5,
                repeat: 2
              }}
              className="bg-card rounded-3xl shadow-2xl p-8 border-4 border-primary/20"
            >
              <div className="text-center space-y-4">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 1,
                    repeat: Infinity
                  }}
                >
                  {getIcon()}
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text"
                >
                  {message}
                </motion.h3>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
