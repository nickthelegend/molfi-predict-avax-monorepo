import { motion, Transition } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const customEase = [0.25, 0.46, 0.45, 0.94] as const;

const pageTransition: Transition = {
  duration: 0.4,
  ease: customEase,
};

const exitTransition: Transition = {
  duration: 0.25,
  ease: customEase,
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.99 }}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Slide from right variant for sub-pages
export const SlideTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: customEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Fade only variant for modals/overlays
export const FadeTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
