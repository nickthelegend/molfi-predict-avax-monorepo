import { motion, useScroll, useTransform } from "framer-motion";
import { Wallet, Lock, TrendingUp } from "lucide-react";
import { useRef } from "react";

export function SoftStakingHero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const workflowSteps = [
    {
      icon: Wallet,
      title: "1. Commit Amount",
      description: "Sign an off-chain message to commit your desired staking amount. No funds transfer required.",
      color: "from-primary/20 to-primary/10",
      borderColor: "border-primary/30"
    },
    {
      icon: Lock,
      title: "2. Maintain Balance",
      description: "Keep your committed amount in your wallet. Our system monitors your balance every 4 hours.",
      color: "from-accent/20 to-accent/10",
      borderColor: "border-accent/30"
    },
    {
      icon: TrendingUp,
      title: "3. Earn Rewards",
      description: "Accumulate MOLFI tokens in real-time. Claim rewards after TGE when vaults go live.",
      color: "from-secondary/20 to-secondary/10",
      borderColor: "border-secondary/30"
    }
  ];

  return (
    <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden -mx-4 md:-mx-8 lg:-mx-12">
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10"
        style={{ opacity }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
            }}
            animate={{
              y: [Math.random() * 100 + "%", Math.random() * -20 + "%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 container mx-auto px-4 pt-20 pb-32"
        style={{ y: y1, scale }}
      >
        {/* Hero title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Soft Staking
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Commit funds without transferring. Earn rewards while maintaining full control.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <div className="bg-card/70 backdrop-blur-sm px-6 py-3 rounded-full border border-primary/30">
              <span className="text-sm text-muted-foreground">Starting APY:</span>
              <span className="ml-2 text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">300%</span>
            </div>
            <div className="bg-card/70 backdrop-blur-sm px-6 py-3 rounded-full border border-border/50">
              <span className="text-sm text-muted-foreground">APY reduces by 25% every 2 weeks</span>
            </div>
          </div>
        </motion.div>

        {/* Workflow cards with scroll animation */}
        <motion.div 
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          style={{ y: y2 }}
        >
          {workflowSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 * index, duration: 0.6 }}
              whileHover={{ y: -10, scale: 1.05 }}
              className={`relative bg-gradient-to-br ${step.color} backdrop-blur-sm p-8 rounded-2xl border ${step.borderColor} shadow-lg group`}
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-center">{step.title}</h3>
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Animated corner accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-border/50">
            <h4 className="font-bold text-lg mb-4 text-center">How It Works</h4>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Balance monitored every 4 hours automatically</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Rewards pause if balance drops below commitment</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Pro-rata distribution based on actual staked amount</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <span>Rewards distribution on or after TGE</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </div>
  );
}
