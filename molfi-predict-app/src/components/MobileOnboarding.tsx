import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, Sparkles } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useIsMobile } from "@/hooks/use-mobile";
import mascotMain from "@/assets/mascot-main.png";

interface OnboardingTooltip {
  id: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  targetSelector?: string;
  highlightElement?: boolean;
}

const mobileOnboardingSteps: OnboardingTooltip[] = [
  {
    id: "welcome",
    title: "Welcome to Molfi! 👋",
    description: "Let's walk you through placing your first trade on mobile. It's quick and easy!",
    position: "bottom",
    highlightElement: false,
  },
  {
    id: "browse-markets",
    title: "Browse Markets 📱",
    description: "Scroll through prediction markets. Swipe left on any card to see quick actions!",
    position: "bottom",
    targetSelector: ".market-card-container",
    highlightElement: true,
  },
  {
    id: "quick-actions",
    title: "Quick Actions ⚡",
    description: "Swipe left on a card to Favorite, Share, or Set an Alert. Try it now!",
    position: "bottom",
    highlightElement: false,
  },
  {
    id: "tap-to-trade",
    title: "Tap to Trade 💰",
    description: "Tap any market card to see details and place your first trade!",
    position: "bottom",
    targetSelector: ".market-card-container",
    highlightElement: true,
  },
  {
    id: "bottom-nav",
    title: "Easy Navigation 🧭",
    description: "Use the bottom bar to quickly navigate between Markets, Earn, Leaderboard, and your Profile!",
    position: "top",
    highlightElement: false,
  },
];

export function MobileOnboarding() {
  const [hasSeenMobileOnboarding, setHasSeenMobileOnboarding] = useLocalStorage(
    "hasSeenMobileOnboarding",
    false
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show on mobile and if not seen before
    if (isMobile && !hasSeenMobileOnboarding) {
      // Delay to let the page load
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, hasSeenMobileOnboarding]);

  if (!isMobile || !isActive) return null;

  const currentTooltip = mobileOnboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < mobileOnboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    setIsActive(false);
    setHasSeenMobileOnboarding(true);
  };

  // Calculate position for tooltip
  const getTooltipPosition = () => {
    const baseClasses = "fixed z-[100] max-w-[90vw] mx-auto left-4 right-4";
    
    switch (currentTooltip.position) {
      case "top":
        return `${baseClasses} bottom-24`;
      case "bottom":
        return `${baseClasses} top-24`;
      default:
        return `${baseClasses} top-1/2 -translate-y-1/2`;
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[99]"
          />

          {/* Tooltip Card */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={getTooltipPosition()}
          >
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 backdrop-blur-xl rounded-3xl shadow-2xl border-2 border-primary/30 overflow-hidden">
              {/* Header with mascot */}
              <div className="bg-gradient-to-r from-primary to-secondary p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <img
                      src={mascotMain}
                      alt="Molfi Mascot"
                      className="w-10 h-10 object-contain"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </motion.div>
                  <div className="text-white">
                    <div className="text-xs font-medium opacity-90">
                      Step {currentStep + 1} of {mobileOnboardingSteps.length}
                    </div>
                    <div className="text-sm font-bold">{currentTooltip.title}</div>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-foreground leading-relaxed mb-4">
                  {currentTooltip.description}
                </p>

                {/* Progress Dots */}
                <div className="flex items-center justify-center gap-1.5 mb-4">
                  {mobileOnboardingSteps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === currentStep
                          ? "w-6 bg-primary"
                          : index < currentStep
                          ? "w-1.5 bg-primary/50"
                          : "w-1.5 bg-muted"
                      }`}
                      animate={index === currentStep ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                  )}
                  <Button onClick={handleNext} className="flex-1 gap-2">
                    {currentStep === mobileOnboardingSteps.length - 1 ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Get Started!
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Highlight element if specified */}
          {currentTooltip.highlightElement && currentTooltip.targetSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-[98]"
            >
              <div className="absolute inset-0">
                {/* Pulsing ring effect */}
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-40 border-4 border-primary rounded-3xl"
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
