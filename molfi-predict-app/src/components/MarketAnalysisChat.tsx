import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertTriangle, Database, Brain, Target, BarChart3, ChevronDown, ChevronUp, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/db";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import gsap from "gsap";

interface OutcomeAnalysis {
  outcomeLabel: string;
  aiProbability: number;
  marketProbability: number;
  edge: number;
  reasoning: string;
  dataPoints: string[];
}

interface ModelAnalysis {
  model: string;
  modelProvider: string;
  analysis: string;
  outcomeRankings: OutcomeAnalysis[];
  topPick: string;
  topPickProbability: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  evidenceDensity: number;
  dataPointsCited: number;
  assumptions?: string[];
  keyRisks?: string[];
}

interface DisagreementMetrics {
  probabilityRange: { min: number; max: number };
  standardDeviation: number;
  modelAgreement: 'high' | 'medium' | 'low';
  divergenceWarning: string | null;
}

interface AnalysisData {
  consensus: {
    topPick: string;
    topPickProbability: number;
    outcomeRankings: OutcomeAnalysis[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
    summary: string;
    reasoning: string;
    evidenceDensity: number;
    disagreement: DisagreementMetrics;
  };
  modelAnalyses: ModelAnalysis[];
  cryptoData?: {
    symbol: string;
    currentPrice: number;
    priceChangePercent24h: number;
    high24h: number;
    low24h: number;
    technicalSummary: string;
  };
  modelAccuracy: { [key: string]: { accuracy: number; totalPredictions: number } };
  metadata: {
    modelsUsed: number;
    timestamp: string;
    category: string;
    isMultiOutcome: boolean;
  };
}

interface MarketOutcome {
  label: string;
  yesPrice: number;
  noPrice: number;
  marketId?: string;
}

interface MarketAnalysisChatProps {
  open: boolean;
  onClose: () => void;
  marketTitle: string;
  marketId: string;
  yesPercentage: number;
  noPercentage: number;
  volume: string;
  outcomes?: MarketOutcome[];
}

// ============================================
// GSAP ANIMATED LOADING SKELETON
// ============================================

const AnalysisLoadingSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // Staggered fade-in for skeleton sections
      gsap.fromTo(
        ".skeleton-section",
        { opacity: 0, y: 20 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.5, 
          stagger: 0.15,
          ease: "power2.out"
        }
      );
      
      // Shimmer effect on skeleton bars
      gsap.to(".skeleton-shimmer", {
        backgroundPosition: "200% 0",
        duration: 1.5,
        repeat: -1,
        ease: "none"
      });
      
      // Progress bar animation
      if (progressRef.current) {
        gsap.to(progressRef.current, {
          width: "100%",
          duration: 12,
          ease: "power1.inOut"
        });
      }
      
      // Pulsing dots animation
      gsap.to(".loading-dot", {
        scale: 1.3,
        opacity: 0.5,
        duration: 0.6,
        stagger: 0.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
      
      // Rotate brain icon
      gsap.to(".brain-icon", {
        rotateY: 360,
        duration: 3,
        repeat: -1,
        ease: "power1.inOut"
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header with animated loading indicator */}
      <div className="skeleton-section flex flex-col items-center justify-center py-6 space-y-4">
        <div className="relative">
          <div className="brain-icon w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-sm">Analyzing with AI Models</h3>
          <div ref={dotsRef} className="flex items-center justify-center gap-1">
            <span className="loading-dot w-2 h-2 rounded-full bg-primary" />
            <span className="loading-dot w-2 h-2 rounded-full bg-primary" />
            <span className="loading-dot w-2 h-2 rounded-full bg-primary" />
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs h-1 bg-muted rounded-full overflow-hidden">
          <div 
            ref={progressRef}
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full"
            style={{ width: "0%" }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground">
          Querying Gemini Flash, Gemini Pro, Gemini 3 Pro...
        </p>
      </div>

      {/* Skeleton for Outcome Rankings */}
      <div className="skeleton-section border rounded-xl p-4 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-4 w-48 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50" style={{ opacity: 1 - (i * 0.15) }}>
              <div className="skeleton-shimmer w-6 h-6 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="skeleton-shimmer h-4 w-24 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                  <div className="flex items-center gap-2">
                    <div className="skeleton-shimmer h-5 w-12 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                    <div className="skeleton-shimmer h-5 w-20 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                  </div>
                </div>
                <div className="skeleton-shimmer h-3 w-32 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton for Model Agreement */}
      <div className="skeleton-section border rounded-lg p-3 bg-muted/30 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
            <div className="skeleton-shimmer h-4 w-28 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          </div>
          <div className="skeleton-shimmer h-5 w-16 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
        <div className="skeleton-shimmer h-3 w-40 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
      </div>

      {/* Skeleton for Consensus Summary */}
      <div className="skeleton-section border rounded-xl p-4 bg-card/50 space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-4 w-32 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-4 w-16 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
        <div className="space-y-2">
          <div className="skeleton-shimmer h-4 w-full rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
        <div className="space-y-1">
          <div className="skeleton-shimmer h-3 w-24 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-2 w-full rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
      </div>

      {/* Skeleton for Model Cards */}
      <div className="skeleton-section space-y-3">
        <div className="flex items-center gap-2">
          <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
          <div className="skeleton-shimmer h-4 w-40 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-xl p-4 bg-card/50 space-y-3" style={{ opacity: 1 - (i * 0.2) }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                <div className="skeleton-shimmer h-4 w-24 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                <div className="skeleton-shimmer h-4 w-12 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="skeleton-shimmer w-4 h-4 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
                <div className="skeleton-shimmer h-4 w-20 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
              </div>
              <div className="skeleton-shimmer h-5 w-24 rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
            </div>
            <div className="space-y-1">
              <div className="skeleton-shimmer h-3 w-24 rounded bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
              <div className="skeleton-shimmer h-2 w-full rounded-full bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// VALIDATION UTILITIES
// ============================================

interface ValidationResult {
  isValid: boolean;
  normalizedRankings: OutcomeAnalysis[];
  errors: string[];
  warnings: string[];
}

// Validate and normalize probability data
function validateProbabilities(rankings: OutcomeAnalysis[], isMultiOutcome: boolean): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for impossible values
  for (const ranking of rankings) {
    if (ranking.aiProbability < 0 || ranking.aiProbability > 100) {
      errors.push(`Invalid AI probability for ${ranking.outcomeLabel}: ${ranking.aiProbability}%`);
    }
    if (ranking.marketProbability < 0 || ranking.marketProbability > 100) {
      errors.push(`Invalid market probability for ${ranking.outcomeLabel}: ${ranking.marketProbability}%`);
    }
  }
  
  if (errors.length > 0) {
    return { isValid: false, normalizedRankings: rankings, errors, warnings };
  }
  
  // For multi-outcome: validate probability sum
  if (isMultiOutcome && rankings.length > 2) {
    const aiSum = rankings.reduce((sum, r) => sum + r.aiProbability, 0);
    const marketSum = rankings.reduce((sum, r) => sum + r.marketProbability, 0);
    
    // Check if AI probabilities sum to ~100%
    if (Math.abs(aiSum - 100) > 15) {
      warnings.push(`AI probabilities sum to ${aiSum.toFixed(0)}%, expected ~100%`);
    }
    
    // Check if market probabilities sum to ~100%
    if (Math.abs(marketSum - 100) > 15) {
      warnings.push(`Market probabilities sum to ${marketSum.toFixed(0)}%, expected ~100%`);
    }
    
    // Normalize if close but not exact
    if (aiSum > 0 && Math.abs(aiSum - 100) > 2 && Math.abs(aiSum - 100) <= 15) {
      const normalizedRankings = rankings.map(r => ({
        ...r,
        aiProbability: (r.aiProbability / aiSum) * 100,
        edge: ((r.aiProbability / aiSum) * 100) - r.marketProbability,
      }));
      return { isValid: true, normalizedRankings, errors, warnings };
    }
  }
  
  return { isValid: true, normalizedRankings: rankings, errors, warnings };
}

// Check if a probability value is safe to display
function isProbabilitySafe(value: number): boolean {
  return typeof value === 'number' && !isNaN(value) && value >= 0 && value <= 100;
}

// Safe probability formatter
function formatProbability(value: number): string {
  if (!isProbabilitySafe(value)) return '—';
  return `${value.toFixed(1)}%`;
}

// ============================================
// UI COMPONENTS
// ============================================

// Evidence Density bar (renamed from Trust Score)
const EvidenceDensityBar = ({ score }: { score: number }) => {
  const safeScore = isProbabilitySafe(score) ? score : 0;
  
  const getScoreColor = (s: number) => {
    if (s >= 70) return 'bg-green-500';
    if (s >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <span>Evidence Density</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Measures reasoning depth, not prediction accuracy. Higher scores indicate more data points and disclosed assumptions.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <span className="font-semibold">{safeScore.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getScoreColor(safeScore)} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${safeScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Disagreement indicator
const DisagreementIndicator = ({ disagreement }: { disagreement: DisagreementMetrics }) => {
  const getAgreementColor = () => {
    if (disagreement.modelAgreement === 'high') return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (disagreement.modelAgreement === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const minSafe = isProbabilitySafe(disagreement.probabilityRange.min);
  const maxSafe = isProbabilitySafe(disagreement.probabilityRange.max);

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Model Agreement</span>
        </div>
        <Badge className={`${getAgreementColor()} text-xs border`}>
          {disagreement.modelAgreement.toUpperCase()}
        </Badge>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Range: {minSafe && maxSafe 
            ? `${disagreement.probabilityRange.min.toFixed(0)}%–${disagreement.probabilityRange.max.toFixed(0)}%`
            : '—'
          }
        </span>
        <span>σ: {disagreement.standardDeviation.toFixed(1)}</span>
      </div>
      
      {disagreement.divergenceWarning && (
        <div className="flex items-start gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/20 text-xs text-orange-400">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{disagreement.divergenceWarning}</span>
        </div>
      )}
    </div>
  );
};

// Model vs Market comparison - QUALITATIVE for multi-outcome, QUANTITATIVE only if valid
const ModelVsMarketBadge = ({ 
  modelProb, 
  marketProb, 
  isMultiOutcome 
}: { 
  modelProb: number; 
  marketProb: number; 
  isMultiOutcome: boolean;
}) => {
  // Safety check
  if (!isProbabilitySafe(modelProb) || !isProbabilitySafe(marketProb)) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="text-xs opacity-50">—</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Invalid probability scale</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const delta = modelProb - marketProb;
  
  // For small differences, show "aligns with market"
  if (Math.abs(delta) < 3) {
    return (
      <Badge className="bg-muted text-muted-foreground border-muted text-xs">
        ≈ Market
      </Badge>
    );
  }
  
  const isHigher = delta > 0;
  const badgeClass = isHigher 
    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
    : 'bg-red-500/20 text-red-400 border-red-500/30';
  
  // For multi-outcome: prefer qualitative labels
  if (isMultiOutcome) {
    return (
      <Badge className={`text-xs ${badgeClass}`}>
        {isHigher ? 'Model higher' : 'Model lower'}
      </Badge>
    );
  }
  
  // For binary: can show numeric difference (points, not percentage)
  return (
    <Badge className={`text-xs ${badgeClass}`}>
      {isHigher ? '+' : ''}{delta.toFixed(0)} pts vs Market
    </Badge>
  );
};

// High uncertainty badge for close outcomes
const UncertaintyBadge = ({ rankings }: { rankings: OutcomeAnalysis[] }) => {
  if (rankings.length < 2) return null;
  
  const sorted = [...rankings].sort((a, b) => b.aiProbability - a.aiProbability);
  const spread = sorted[0].aiProbability - sorted[1].aiProbability;
  
  if (spread < 5) {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
        <AlertTriangle className="w-3 h-3 mr-1" />
        High Uncertainty
      </Badge>
    );
  }
  
  return null;
};

// Invalid data warning component
const InvalidDataWarning = ({ errors, warnings }: { errors: string[]; warnings: string[] }) => {
  if (errors.length === 0 && warnings.length === 0) return null;
  
  return (
    <div className="border border-destructive/30 rounded-xl p-4 bg-destructive/5 space-y-2">
      <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
        <AlertTriangle className="w-4 h-4" />
        AI Output Inconsistent
      </div>
      {errors.length > 0 && (
        <div className="text-xs text-destructive/80">
          <p className="font-medium mb-1">Errors:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="text-xs text-amber-500/80">
          <p className="font-medium mb-1">Warnings:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {warnings.map((warn, i) => <li key={i}>{warn}</li>)}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Probabilities may not form a valid distribution. Treat with caution.
      </p>
    </div>
  );
};

// Outcome Rankings - HERO component with validation
const OutcomeRankingCard = ({ 
  rankings, 
  title, 
  isHero = false,
  isMultiOutcome = false,
  validation 
}: { 
  rankings: OutcomeAnalysis[]; 
  title: string; 
  isHero?: boolean;
  isMultiOutcome?: boolean;
  validation: ValidationResult;
}) => {
  const displayRankings = validation.normalizedRankings;
  
  return (
    <div className={`border rounded-xl p-4 space-y-3 ${isHero ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5' : 'bg-card/50'}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <BarChart3 className="w-4 h-4 text-primary" />
          {title}
        </div>
        <UncertaintyBadge rankings={displayRankings} />
      </div>
      
      {/* Show warnings if any */}
      {validation.warnings.length > 0 && (
        <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded border border-amber-500/20 text-xs text-amber-400">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{validation.warnings[0]}</span>
        </div>
      )}
      
      <div className="space-y-2">
        {displayRankings.slice(0, 6).map((ranking, index) => (
          <motion.div
            key={ranking.outcomeLabel}
            className={`flex items-center gap-3 p-2 rounded-lg ${index === 0 ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20'
            }`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm truncate">{ranking.outcomeLabel}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-primary">{formatProbability(ranking.aiProbability)}</span>
                  <ModelVsMarketBadge 
                    modelProb={ranking.aiProbability} 
                    marketProb={ranking.marketProbability}
                    isMultiOutcome={isMultiOutcome}
                  />
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Market: {formatProbability(ranking.marketProbability)}
                {ranking.dataPoints.length > 0 && ` • ${ranking.dataPoints.length} data points`}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {rankings.length > 6 && (
        <p className="text-xs text-muted-foreground text-center">
          +{rankings.length - 6} more outcomes analyzed
        </p>
      )}
    </div>
  );
};

// Top Pick display - Safe version
const TopPickDisplay = ({ 
  topPick, 
  probability, 
  rankings,
  isMultiOutcome 
}: { 
  topPick: string; 
  probability: number;
  rankings: OutcomeAnalysis[];
  isMultiOutcome: boolean;
}) => {
  const isSafe = isProbabilitySafe(probability);
  
  // Check if top 2 are very close
  const sorted = [...rankings].sort((a, b) => b.aiProbability - a.aiProbability);
  const hasLowSeparation = sorted.length >= 2 && (sorted[0].aiProbability - sorted[1].aiProbability) < 5;
  
  return (
    <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Highest Model-Implied Outcome</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold">{topPick}</span>
        <span className="text-muted-foreground">
          ({isSafe ? formatProbability(probability) : '—'})
        </span>
        {hasLowSeparation && (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            Close race
          </Badge>
        )}
      </div>
    </div>
  );
};

// Model Card with safe rendering
const ModelCard = ({ 
  model, 
  accuracy,
  isMultiOutcome 
}: { 
  model: ModelAnalysis; 
  accuracy?: { accuracy: number; totalPredictions: number };
  isMultiOutcome: boolean;
}) => {
  const [showReasoning, setShowReasoning] = useState(false);

  const topOutcome = model.outcomeRankings[0];
  const validation = validateProbabilities(model.outcomeRankings, isMultiOutcome);

  return (
    <motion.div
      className="border rounded-xl p-4 bg-card/50 space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Model Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{model.model}</span>
          <Badge variant="outline" className="text-[10px]">
            {model.modelProvider}
          </Badge>
        </div>
        {accuracy && accuracy.totalPredictions > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            Historical: {accuracy.accuracy.toFixed(0)}% ({accuracy.totalPredictions})
          </Badge>
        )}
      </div>

      {/* Show errors if validation failed */}
      {!validation.isValid && (
        <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded border border-destructive/20 text-xs text-destructive">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Invalid probability data</span>
        </div>
      )}

      {/* Top Pick with safe display */}
      <TopPickDisplay 
        topPick={model.topPick}
        probability={model.topPickProbability}
        rankings={model.outcomeRankings}
        isMultiOutcome={isMultiOutcome}
      />

      {/* Evidence Density */}
      <EvidenceDensityBar score={model.evidenceDensity} />

      {/* Key assumptions & risks */}
      {model.assumptions && model.assumptions.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="font-medium text-muted-foreground">Assumptions:</div>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {model.assumptions.slice(0, 2).map((a, i) => (
              <li key={i} className="truncate">{a}</li>
            ))}
          </ul>
        </div>
      )}

      {model.keyRisks && model.keyRisks.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="font-medium text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Risks:
          </div>
          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
            {model.keyRisks.slice(0, 2).map((r, i) => (
              <li key={i} className="truncate">{r}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Points */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="w-3 h-3" />
        <span>{model.dataPointsCited} data points cited</span>
      </div>

      {/* Collapsible reasoning */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReasoning(!showReasoning)}
        className="w-full text-xs flex items-center gap-1"
      >
        {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {showReasoning ? 'Hide Reasoning' : 'Show Full Reasoning'}
      </Button>
      
      {showReasoning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-3"
        >
          {model.analysis}
        </motion.div>
      )}
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MarketAnalysisChat = ({
  open,
  onClose,
  marketTitle,
  marketId,
  yesPercentage,
  noPercentage,
  volume,
  outcomes,
}: MarketAnalysisChatProps) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAnalysis = async () => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const { data, error } = await supabase.functions.invoke("market-analysis", {
        body: {
          marketTitle,
          marketId,
          yesPercentage,
          noPercentage,
          volume,
          outcomes: outcomes || undefined,
        },
      });

      if (error) throw error;

      if (data.consensus && data.modelAnalyses) {
        setAnalysisData(data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error getting market analysis:", error);
      toast({
        title: "Analysis Error",
        description: "Failed to get market analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && !analysisData && !isLoading) {
      getAnalysis();
    }
    if (!isOpen) {
      onClose();
    }
  };

  const isMultiOutcome = analysisData?.metadata?.isMultiOutcome || (outcomes && outcomes.length > 2);
  
  // Validate consensus data
  const consensusValidation = useMemo(() => {
    if (!analysisData) return { isValid: true, normalizedRankings: [], errors: [], warnings: [] };
    return validateProbabilities(analysisData.consensus.outcomeRankings, !!isMultiOutcome);
  }, [analysisData, isMultiOutcome]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Market Analysis
            {analysisData && (
              <>
                <Badge variant="outline" className="ml-2 text-xs">
                  {analysisData.metadata.category.toUpperCase()}
                </Badge>
                {isMultiOutcome && (
                  <Badge className="ml-1 text-xs bg-primary/20 text-primary border-primary/30">
                    Multi-Outcome
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Contextual disclaimer at TOP */}
        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg flex-shrink-0">
          ⚡ AI models explain belief differences. Markets determine truth.
        </p>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-1">
          {/* Market Info Card */}
          <div className="p-4 bg-muted rounded-2xl">
            <h3 className="font-semibold text-sm mb-2 line-clamp-2">{marketTitle}</h3>
            {!isMultiOutcome ? (
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span className="text-primary">Yes: {yesPercentage}%</span>
                <span className="text-destructive">No: {noPercentage}%</span>
                <span>Volume: ${volume}</span>
              </div>
            ) : outcomes && (
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{outcomes.length} outcomes</span>
                <span>•</span>
                <span>Volume: ${volume}</span>
              </div>
            )}
          </div>

          {/* Initial State - Show CTA to run analysis */}
          {!analysisData && !isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold">AI-Powered Market Analysis</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Get insights from multiple AI models analyzing this market's probability and key factors.
                </p>
              </div>
              <Button onClick={getAnalysis} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Run AI Analysis
              </Button>
            </div>
          )}

          {/* Loading State with GSAP-animated Skeleton */}
          {isLoading && (
            <AnalysisLoadingSkeleton />
          )}

          {/* Analysis Results */}
          {analysisData && (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Show validation errors/warnings */}
              {!consensusValidation.isValid && (
                <InvalidDataWarning 
                  errors={consensusValidation.errors} 
                  warnings={consensusValidation.warnings} 
                />
              )}

              {/* HERO: Outcome Rankings with validation */}
              <OutcomeRankingCard 
                rankings={analysisData.consensus.outcomeRankings} 
                title="Model-Implied Probability Rankings"
                isHero={true}
                isMultiOutcome={!!isMultiOutcome}
                validation={consensusValidation}
              />

              {/* Disagreement Indicator */}
              {analysisData.consensus.disagreement && (
                <DisagreementIndicator disagreement={analysisData.consensus.disagreement} />
              )}

              {/* Consensus Summary */}
              <div className="border rounded-xl p-4 bg-card/50 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Brain className="w-4 h-4 text-primary" />
                  Consensus Summary
                  <Badge variant="outline" className="text-[10px]">
                    {analysisData.metadata.modelsUsed} models
                  </Badge>
                </div>
                
                <p className="text-sm break-words">{analysisData.consensus.summary}</p>

                <EvidenceDensityBar score={analysisData.consensus.evidenceDensity} />
              </div>

              {/* Real-Time Crypto Data */}
              {analysisData.cryptoData && (
                <div className="border rounded-xl p-4 bg-card/50 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Live {analysisData.cryptoData.symbol} Data
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price:</span>{' '}
                      <span className="font-semibold">${analysisData.cryptoData.currentPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">24h:</span>{' '}
                      <span className={analysisData.cryptoData.priceChangePercent24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {analysisData.cryptoData.priceChangePercent24h >= 0 ? '+' : ''}
                        {analysisData.cryptoData.priceChangePercent24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {analysisData.cryptoData.technicalSummary && (
                    <p className="text-xs text-muted-foreground break-words">{analysisData.cryptoData.technicalSummary}</p>
                  )}
                </div>
              )}

              {/* Individual Model Analyses */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Individual Model Analyses
                </h3>
                {analysisData.modelAnalyses.map((model, index) => (
                  <ModelCard 
                    key={index} 
                    model={model} 
                    accuracy={analysisData.modelAccuracy[model.model]}
                    isMultiOutcome={!!isMultiOutcome}
                  />
                ))}
              </div>

              {/* Re-run analysis button at bottom */}
              <div className="pt-2 border-t">
                <Button 
                  variant="outline" 
                  onClick={getAnalysis} 
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Re-run Analysis
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
