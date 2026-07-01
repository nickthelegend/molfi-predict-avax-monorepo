import { motion } from "framer-motion";
import { Button, ButtonProps } from "@/components/ui/button";
import { forwardRef } from "react";

interface AnimatedButtonProps extends ButtonProps {
  effect?: "bounce" | "scale" | "wiggle" | "glow";
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ effect = "scale", children, className, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Create ripple effect
      const button = e.currentTarget;
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
      circle.style.top = `${e.clientY - button.offsetTop - radius}px`;
      circle.classList.add("ripple");

      const ripple = button.getElementsByClassName("ripple")[0];
      if (ripple) {
        ripple.remove();
      }

      button.appendChild(circle);

      onClick?.(e);
    };

    const variants = {
      bounce: {
        whileTap: { scale: 0.95, y: 2 },
        whileHover: { scale: 1.05, y: -2 },
      },
      scale: {
        whileTap: { scale: 0.95 },
        whileHover: { scale: 1.05 },
      },
      wiggle: {
        whileTap: { scale: 0.95, rotate: -5 },
        whileHover: { scale: 1.05, rotate: [0, -2, 2, -2, 0] },
      },
      glow: {
        whileTap: { scale: 0.95 },
        whileHover: { scale: 1.05, boxShadow: "0 0 20px rgba(219, 39, 119, 0.5)" },
      },
    };

    return (
      <motion.div
        whileTap={variants[effect].whileTap}
        whileHover={variants[effect].whileHover}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Button
          ref={ref}
          className={`relative overflow-hidden ${className}`}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Button>
        <style>{`
          .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.6);
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out;
            pointer-events: none;
          }

          @keyframes ripple-animation {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `}</style>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
