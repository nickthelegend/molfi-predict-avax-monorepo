import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingDown, Clock, Calendar } from "lucide-react";
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface APYDecayChartProps {
  startDate?: Date;
}

export function APYDecayChart({ startDate = new Date("2026-01-01") }: APYDecayChartProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // Soft staking hasn't started yet - always show epoch 0 and 300% APY
  const calculateCurrentEpoch = () => {
    return { currentEpoch: 0, currentAPY: 300 };
  };

  // Soft staking hasn't started - return start date
  const calculateNextEpochDate = () => {
    return startDate;
  };

  // Generate decay schedule data - 25% reduction per epoch
  const generateDecayData = () => {
    const data = [];
    for (let epoch = 1; epoch <= 6; epoch++) {
      const apy = 300 - ((epoch - 1) * 25);
      data.push({
        epoch: `E${epoch}`,
        apy: apy,
        date: new Date(startDate.getTime() + (epoch - 1) * 14 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      });
    }
    return data;
  };

  const decayData = generateDecayData();
  const { currentEpoch, currentAPY } = calculateCurrentEpoch();

  useEffect(() => {
    // Soft staking hasn't started - show 00:00:00:00
    setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-primary" />
              APY Decay Schedule
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              25% reduction every 2 weeks until TGE
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Current Epoch</div>
            <div className="text-3xl font-bold text-primary">00</div>
          </div>
        </div>

        {/* Current APY */}
        <motion.div
          className="p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">Current APY</div>
            <div className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {currentAPY.toFixed(2)}%
            </div>
          </div>
        </motion.div>

        {/* Countdown Timer */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Days", value: timeLeft.days },
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds }
          ].map((item) => (
            <div key={item.label} className="bg-card/50 rounded-lg p-3 text-center border border-border/50">
              <div className="text-2xl font-bold text-primary">{item.value.toString().padStart(2, '0')}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
          <Clock className="w-4 h-4" />
          <span>Until next APY reduction</span>
        </div>

        {/* Decay Chart */}
        <div className="bg-card/30 rounded-xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-semibold">APY Projection Timeline</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={decayData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis 
                dataKey="epoch" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                label={{ value: 'APY (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="apy" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Info */}
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-muted-foreground">Likely TGE Q1 2026</div>
          <div className="text-xs text-muted-foreground">
            Rewards will be distributed on or after TGE
          </div>
        </div>
      </div>
    </Card>
  );
}
