import { motion } from 'framer-motion';
import mascotImage from '@/assets/mascot-main.png';

interface AILoadingMascotProps {
  message?: string;
}

export function AILoadingMascot({ message = "Analyzing market data..." }: AILoadingMascotProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      {/* Mascot with floating animation */}
      <motion.div
        className="relative"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Glow effect behind mascot */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/40 to-secondary/40 blur-2xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Mascot image */}
        <motion.img
          src={mascotImage}
          alt="AI Assistant"
          className="w-24 h-24 object-contain relative z-10 drop-shadow-lg"
          animate={{
            rotate: [-3, 3, -3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Sparkle effects */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              top: `${20 + i * 25}%`,
              left: i % 2 === 0 ? '-10%' : '90%',
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [-10, -30],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Thinking dots animation */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              y: [0, -6, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Message with typing effect */}
      <motion.p
        className="text-sm text-muted-foreground text-center max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {message}
      </motion.p>

      {/* Progress bar */}
      <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
          animate={{
            x: ["-100%", "100%"],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "50%" }}
        />
      </div>
    </div>
  );
}
