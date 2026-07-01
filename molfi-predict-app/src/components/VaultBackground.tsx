import { motion } from "framer-motion";
import { Coins, TrendingUp, Shield, Zap, Sparkles, DollarSign } from "lucide-react";

export function VaultBackground() {
  const icons = [Coins, TrendingUp, Shield, Zap, Sparkles, DollarSign];
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
      {[...Array(15)].map((_, i) => {
        const Icon = icons[i % icons.length];
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              scale: 0.5 + Math.random() * 0.5,
              opacity: 0.1 + Math.random() * 0.2,
            }}
            animate={{
              y: [
                Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
                Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080) - 200,
                Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
              ],
              x: [
                Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920) + 100,
                Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920)
              ],
              rotate: [0, 360],
              scale: [
                0.5 + Math.random() * 0.5,
                1 + Math.random() * 0.5,
                0.5 + Math.random() * 0.5
              ],
            }}
            transition={{
              duration: 20 + Math.random() * 30,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <Icon className="w-12 h-12 text-primary" />
          </motion.div>
        );
      })}
      
      {/* Floating gradient orbs */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute rounded-full blur-3xl"
          style={{
            width: 200 + Math.random() * 300,
            height: 200 + Math.random() * 300,
            background: `radial-gradient(circle, ${
              i % 3 === 0 ? 'hsl(var(--primary) / 0.15)' :
              i % 3 === 1 ? 'hsl(var(--accent) / 0.15)' :
              'hsl(var(--secondary) / 0.15)'
            } 0%, transparent 70%)`,
          }}
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
          }}
          animate={{
            x: [
              Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920)
            ],
            y: [
              Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080) - 300,
              Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
            ],
          }}
          transition={{
            duration: 30 + Math.random() * 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
