import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Network, Users, DollarSign, BarChart3, Layers } from "lucide-react";

interface LandingViewProps {
  onStartCLOB: () => void;
  onStartAggregator: () => void;
  onViewComparison: () => void;
}

export function LandingView({ onStartCLOB, onStartAggregator, onViewComparison }: LandingViewProps) {
  const stats = [
    { label: "Total Markets", value: "127", icon: BarChart3 },
    { label: "Total Volume", value: "$45.2M", icon: DollarSign },
    { label: "Active Traders", value: "12,450", icon: Users },
    { label: "TVL Locked", value: "$12.5M", icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Molfi: Cross-Chain Prediction Markets
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the future of decentralized prediction markets with native CLOB trading and cross-chain aggregation
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center space-y-2">
                <stat.icon className="w-8 h-8 mx-auto text-primary" />
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Demo Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="h-full hover:shadow-xl transition-all border-primary/20 hover:border-primary/40">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Native CLOB Demo</CardTitle>
              <CardDescription className="text-base">
                Experience off-chain matching with on-chain batch settlement. Zero gas to place orders, maximum efficiency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  EIP-712 off-chain order signing
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Batch settlement for gas efficiency
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Stork.network oracle integration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Real-time order book matching
                </li>
              </ul>
              <Button onClick={onStartCLOB} className="w-full" size="lg">
                Start CLOB Demo →
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="h-full hover:shadow-xl transition-all border-secondary/20 hover:border-secondary/40">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4">
                <Network className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Aggregator Demo</CardTitle>
              <CardDescription className="text-base">
                Route bets across Polymarket, Limitless and more via seamless cross-chain messaging. Access unified liquidity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Cross-chain intent execution
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Unified liquidity aggregation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  ERC-4626 LP vault integration
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  Multi-venue price discovery
                </li>
              </ul>
              <Button onClick={onStartAggregator} variant="secondary" className="w-full" size="lg">
                Start Aggregator Demo →
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Comparison CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-center"
      >
        <Button onClick={onViewComparison} variant="outline" size="lg">
          Compare Models Side-by-Side
        </Button>
      </motion.div>
    </div>
  );
}
