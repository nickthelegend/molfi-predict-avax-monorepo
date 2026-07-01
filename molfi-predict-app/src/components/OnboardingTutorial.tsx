import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import mascotMain from "@/assets/mascot-main.png";
import mascotFriend1 from "@/assets/mascot-friend-1.png";
import mascotFriend2 from "@/assets/mascot-friend-2.png";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface OnboardingStep {
  title: string;
  description: string;
  mascot: string;
  emoji: string;
  highlightColor: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Welcome to Molfi! 🎉",
    description: "Hi there! I'm your friendly Molfi guide. Let me show you how to make your first prediction trade. It's super easy and fun!",
    mascot: mascotMain,
    emoji: "👋",
    highlightColor: "from-pink-400 to-pink-600"
  },
  {
    title: "Browse Markets 🔍",
    description: "First, browse through our exciting prediction markets! From sports to politics to crypto - there's something for everyone. Click on any market card to see more details.",
    mascot: mascotFriend1,
    emoji: "🎯",
    highlightColor: "from-purple-400 to-purple-600"
  },
  {
    title: "Pick Your Side 💭",
    description: "Think an event will happen? Click YES! Think it won't? Click NO! Your prediction is like placing a friendly bet on what you believe will come true.",
    mascot: mascotFriend2,
    emoji: "✨",
    highlightColor: "from-cyan-400 to-cyan-600"
  },
  {
    title: "Enter Your Amount 💰",
    description: "Decide how much you want to stake on your prediction. Start small if you're new - even a few dollars can be exciting! The more confident you are, the more you can stake.",
    mascot: mascotMain,
    emoji: "💵",
    highlightColor: "from-pink-400 to-pink-600"
  },
  {
    title: "Confirm & Win! 🏆",
    description: "Review your trade and hit confirm! If your prediction is correct when the market resolves, you'll earn rewards. Track all your trades in your portfolio!",
    mascot: mascotFriend1,
    emoji: "🎊",
    highlightColor: "from-purple-400 to-purple-600"
  },
  {
    title: "You're All Set! 🚀",
    description: "That's it! You're ready to start trading. Remember: have fun, start small, and may the predictions be ever in your favor! Happy trading! 🎉",
    mascot: mascotFriend2,
    emoji: "🌟",
    highlightColor: "from-cyan-400 to-cyan-600"
  }
];

export function OnboardingTutorial() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useLocalStorage("hasSeenOnboarding", false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(!hasSeenOnboarding);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenOnboarding(true);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card rounded-3xl shadow-2xl max-w-2xl w-full pointer-events-auto border-4 border-primary/20 relative overflow-hidden"
            >
              {/* Decorative elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-cyan-200 to-purple-200 rounded-full blur-3xl opacity-50"
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all hover:scale-110"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="relative p-8 md:p-12">
                {/* Mascot */}
                <div className="flex justify-center mb-6">
                  <motion.img
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    src={currentStepData.mascot}
                    alt="Friendly guide"
                    className="w-32 h-32"
                  />
                </div>

                {/* Emoji decoration */}
                <motion.div
                  key={`emoji-${currentStep}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-4"
                >
                  <span className="text-6xl">{currentStepData.emoji}</span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  key={`title-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl md:text-4xl font-black text-center mb-4"
                >
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${currentStepData.highlightColor}`}>
                    {currentStepData.title}
                  </span>
                </motion.h2>

                {/* Description */}
                <motion.p
                  key={`desc-${currentStep}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-muted-foreground text-center mb-8 leading-relaxed"
                >
                  {currentStepData.description}
                </motion.p>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                  {steps.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep 
                          ? "w-8 bg-gradient-to-r from-pink-500 to-purple-500" 
                          : "w-2 bg-muted"
                      }`}
                      animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="rounded-full border-2 border-purple-300 hover:bg-purple-50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <Button
                    onClick={handleNext}
                    className={`rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-gradient-to-r ${currentStepData.highlightColor}`}
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        Start Trading <Sparkles className="w-4 h-4 ml-2" />
                      </>
                    ) : (
                      <>
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {/* Skip option */}
                <div className="text-center mt-4">
                  <button
                    onClick={handleClose}
                    className="text-sm text-muted-foreground hover:text-foreground underline"
                  >
                    Skip tutorial
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
