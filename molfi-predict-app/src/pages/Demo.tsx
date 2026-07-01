import { useState } from "react";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";
import Header from "@/components/Header";
import { LandingView } from "@/components/demo/LandingView";
import { CLOBDemo } from "@/components/demo/CLOBDemo";
import { AggregatorDemo } from "@/components/demo/AggregatorDemo";
import { ComparisonView } from "@/components/demo/ComparisonView";
import { Leaderboard } from "@/components/demo/Leaderboard";
import { DemoView } from "@/types/demo";

export default function Demo() {
  const [currentView, setCurrentView] = useState<DemoView>('landing');

  return (
    <>
      <SEO
        title="Molfi Protocol - Interactive Demo"
        description="Experience Molfi's native CLOB trading and cross-chain aggregation with our interactive demo"
      />
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'landing' && (
              <div className="space-y-8">
                <LandingView
                  onStartCLOB={() => setCurrentView('clob-demo')}
                  onStartAggregator={() => setCurrentView('aggregator-demo')}
                  onViewComparison={() => setCurrentView('comparison')}
                />
                <Leaderboard />
              </div>
            )}
            
            {currentView === 'clob-demo' && (
              <CLOBDemo onBack={() => setCurrentView('landing')} />
            )}
            
            {currentView === 'aggregator-demo' && (
              <AggregatorDemo onBack={() => setCurrentView('landing')} />
            )}
            
            {currentView === 'comparison' && (
              <ComparisonView onBack={() => setCurrentView('landing')} />
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
