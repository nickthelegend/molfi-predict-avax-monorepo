import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useState } from "react";
import mascotMain from "@/assets/mascot-main.png";
import mascotFriend1 from "@/assets/mascot-friend-1.png";
import mascotFriend2 from "@/assets/mascot-friend-2.png";

type MascotVariant = "main" | "friend1" | "friend2";

interface InteractiveMascotProps {
  variant?: MascotVariant;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  enableFloat?: boolean;
  enableHover?: boolean;
  enableClick?: boolean;
  onMascotClick?: () => void;
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const mascotImages = {
  main: mascotMain,
  friend1: mascotFriend1,
  friend2: mascotFriend2,
};

export function InteractiveMascot({
  variant = "main",
  size = "md",
  className = "",
  enableFloat = true,
  enableHover = true,
  enableClick = true,
  onMascotClick,
}: InteractiveMascotProps) {
  const controls = useAnimationControls();
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Floating animation
  useEffect(() => {
    if (enableFloat) {
      controls.start({
        y: [0, -10, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    }
  }, [enableFloat, controls]);

  // Click celebration animation
  const handleClick = () => {
    if (!enableClick) return;
    
    setClickCount((prev) => prev + 1);
    
    // Bounce animation on click
    controls.start({
      scale: [1, 1.2, 0.95, 1],
      rotate: [0, -10, 10, -5, 5, 0],
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    });

    onMascotClick?.();
  };

  // Hover animation
  const handleHoverStart = () => {
    if (!enableHover) return;
    setIsHovered(true);
  };

  const handleHoverEnd = () => {
    if (!enableHover) return;
    setIsHovered(false);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <motion.div
        className={`${sizeMap[size]} relative cursor-pointer select-none`}
        animate={controls}
        whileHover={
          enableHover
            ? {
                scale: 1.1,
                rotate: [0, -5, 5, -5, 5, 0],
                transition: { duration: 0.5 },
              }
            : undefined
        }
        onClick={handleClick}
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
      >
        <img
          src={mascotImages[variant]}
          alt={`Molfi mascot ${variant}`}
          className="w-full h-full object-contain drop-shadow-lg"
          style={{ mixBlendMode: 'multiply' }}
        />

        {/* Sparkle effect on hover */}
        {isHovered && (
          <>
            <motion.div
              className="absolute -top-2 -right-2 w-4 h-4"
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
              }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -bottom-2 -left-2 w-4 h-4"
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, -180, -360],
              }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                repeat: Infinity,
              }}
            >
              ✨
            </motion.div>
          </>
        )}

        {/* Ripple effect on click */}
        {clickCount > 0 && (
          <motion.div
            key={clickCount}
            className="absolute inset-0 rounded-full border-4 border-primary"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.div>

      {/* Thought bubble on hover */}
      {isHovered && enableHover && (
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 bg-card border-2 border-primary rounded-2xl px-4 py-2 shadow-lg whitespace-nowrap"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-sm font-medium text-foreground">
            {variant === "main" ? "Let's trade! 🚀" : "Hello friend! 👋"}
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-primary" />
        </motion.div>
      )}
    </div>
  );
}

// Mascot Group Component - Multiple mascots together
interface MascotGroupProps {
  className?: string;
}

export function MascotGroup({ className = "" }: MascotGroupProps) {
  return (
    <div className={`flex items-end justify-center gap-4 ${className}`}>
      <InteractiveMascot
        variant="friend1"
        size="lg"
        enableFloat={true}
      />
      <InteractiveMascot
        variant="main"
        size="xl"
        enableFloat={true}
      />
      <InteractiveMascot
        variant="friend2"
        size="lg"
        enableFloat={true}
      />
    </div>
  );
}

// Scroll-triggered Mascot Component
interface ScrollMascotProps {
  threshold?: number;
  className?: string;
}

export function ScrollMascot({ threshold = 0.5, className = "" }: ScrollMascotProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercentage = scrolled / (documentHeight - windowHeight);
      
      setIsVisible(scrollPercentage > threshold);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed bottom-8 right-8 z-50 ${className}`}
    >
      <InteractiveMascot
        variant="main"
        size="lg"
        enableFloat={true}
        enableHover={true}
        enableClick={true}
        onMascotClick={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <div className="absolute -top-12 right-0 bg-card border-2 border-primary rounded-lg px-3 py-1 text-xs font-medium whitespace-nowrap shadow-lg">
        Back to top! ↑
      </div>
    </motion.div>
  );
}
