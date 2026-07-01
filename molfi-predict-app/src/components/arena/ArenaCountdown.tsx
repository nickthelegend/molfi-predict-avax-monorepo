import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface ArenaCountdownProps {
  targetDate: Date;
  label?: string;
}

// Animated digit component with flip effect
function AnimatedDigit({ value, label }: { value: string; label: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setIsFlipping(true);
      const timeout = setTimeout(() => {
        setDisplayValue(value);
        setIsFlipping(false);
        prevValue.current = value;
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <div className="text-center">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={displayValue}
            initial={{ y: -20, opacity: 0, rotateX: -90 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 20, opacity: 0, rotateX: 90 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="text-3xl md:text-5xl font-bold text-foreground tabular-nums tracking-tight"
            style={{ perspective: "1000px" }}
          >
            {displayValue}
          </motion.div>
        </AnimatePresence>
        <motion.div 
          className="absolute -inset-2 bg-primary/5 rounded-lg -z-10"
          animate={{ 
            scale: isFlipping ? [1, 1.05, 1] : 1,
            opacity: isFlipping ? [0.5, 1, 0.5] : 0.5
          }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <div className="text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground mt-2">
        {label}
      </div>
    </div>
  );
}

export function ArenaCountdown({ targetDate, label = "Season 0 Begins In" }: ArenaCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (isExpired) {
    return (
      <Card className="p-6 border border-warning/30 bg-gradient-to-br from-warning/10 to-transparent">
        <motion.div 
          className="flex items-center justify-center gap-3"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Clock className="w-5 h-5 text-warning animate-pulse" />
          <span className="text-lg font-semibold text-warning">Season 0 Has Begun!</span>
        </motion.div>
      </Card>
    );
  }

  const timeUnits = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Mins" },
    { value: timeLeft.seconds, label: "Secs" },
  ];

  return (
    <Card className="p-6 border border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-warning/5 overflow-hidden relative">
      {/* Subtle animated background */}
      <div className="absolute inset-0 opacity-30">
        <motion.div 
          className="absolute top-0 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-0 right-1/4 w-32 h-32 bg-warning/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Clock className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 md:gap-6">
          {timeUnits.map((unit, index) => (
            <div key={unit.label} className="flex items-center gap-3 md:gap-6">
              <AnimatedDigit 
                value={String(unit.value).padStart(2, "0")} 
                label={unit.label}
              />
              {index < timeUnits.length - 1 && (
                <motion.span 
                  className="text-2xl md:text-4xl text-muted-foreground/50 font-light"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  :
                </motion.span>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            April 6, 2026 • 17:00 UTC
          </p>
        </div>
      </div>
    </Card>
  );
}
