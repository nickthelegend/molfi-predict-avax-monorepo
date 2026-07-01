import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Brain, Target, TrendingUp, Database, RefreshCw, Crown, Medal, Info, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/db';
import { motion } from 'framer-motion';

interface CalibrationBin {
  range: string;
  predicted_avg: number;
  actual_avg: number;
  count: number;
}

interface ModelAccuracy {
  id: string;
  model_name: string;
  model_provider: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_rate: number;
  avg_trust_score: number;
  brier_score: number | null;
  calibration_data: CalibrationBin[] | null;
  last_updated: string;
}

interface ModelStats {
  model_name: string;
  model_provider: string;
  total_predictions: number;
  avg_trust_score: number;
}

const ProviderBadge = ({ provider }: { provider: string }) => {
  const getProviderColors = () => {
    switch (provider.toLowerCase()) {
      case 'google':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'openai':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge variant="outline" className={`text-[10px] ${getProviderColors()}`}>
      {provider}
    </Badge>
  );
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-warning to-warning/70 shadow-lg">
        <Crown className="w-4 h-4 text-warning-foreground" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-muted-foreground to-muted shadow">
        <Medal className="w-4 h-4 text-background" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-warning/80 to-warning/50 shadow">
        <Medal className="w-4 h-4 text-warning-foreground" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
      <span className="text-sm font-bold text-muted-foreground">{rank}</span>
    </div>
  );
};

// Brier Score indicator (lower is better, 0-1 range)
const BrierScoreIndicator = ({ score, hasData }: { score: number | null; hasData: boolean }) => {
  if (!hasData || score === null) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>Brier:</span>
        <span className="text-muted-foreground/50">—</span>
      </div>
    );
  }

  const getColor = () => {
    if (score <= 0.15) return 'text-green-400';
    if (score <= 0.25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLabel = () => {
    if (score <= 0.15) return 'Excellent';
    if (score <= 0.25) return 'Good';
    return 'Needs work';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-xs cursor-help">
          <span className="text-muted-foreground">Brier:</span>
          <span className={`font-semibold ${getColor()}`}>{score.toFixed(3)}</span>
          <Info className="w-3 h-3 text-muted-foreground" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="font-semibold">{getLabel()} calibration</p>
        <p className="text-xs mt-1">
          Brier score measures probability calibration. Lower is better (0 = perfect, 1 = worst).
          A score below 0.25 indicates well-calibrated predictions.
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

// Mini calibration chart
const CalibrationChart = ({ bins }: { bins: CalibrationBin[] | null }) => {
  if (!bins || bins.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/50 text-center py-2">
        No calibration data yet
      </div>
    );
  }

  // Sort bins by range
  const sortedBins = [...bins].sort((a, b) => {
    const aStart = parseInt(a.range.split('-')[0]);
    const bStart = parseInt(b.range.split('-')[0]);
    return aStart - bStart;
  });

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
        Calibration
        <Tooltip>
          <TooltipTrigger>
            <Info className="w-3 h-3" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>Compares predicted probabilities to actual outcomes.</p>
            <p className="mt-1 text-xs">Perfect calibration: when model predicts 70%, outcome happens 70% of the time.</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex gap-0.5">
        {sortedBins.map((bin, i) => {
          const calibrationError = Math.abs(bin.predicted_avg - bin.actual_avg);
          const isWellCalibrated = calibrationError < 10;
          
          return (
            <Tooltip key={i}>
              <TooltipTrigger asChild>
                <div 
                  className={`h-4 flex-1 rounded-sm cursor-help ${
                    isWellCalibrated 
                      ? 'bg-green-500/50' 
                      : calibrationError < 20 
                        ? 'bg-yellow-500/50' 
                        : 'bg-red-500/50'
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{bin.range}</p>
                <p className="text-xs">Predicted: {bin.predicted_avg}%</p>
                <p className="text-xs">Actual: {bin.actual_avg}%</p>
                <p className="text-xs text-muted-foreground">({bin.count} samples)</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

const AccuracyBar = ({ accuracy, predictions }: { accuracy: number; predictions: number }) => {
  const getColor = () => {
    if (accuracy >= 70) return 'bg-green-500';
    if (accuracy >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (predictions === 0) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Accuracy</span>
          <span className="text-muted-foreground">No resolved predictions</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-muted-foreground/20 rounded-full w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Accuracy</span>
        <span className="font-semibold">{accuracy.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${getColor()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${accuracy}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export function AIModelLeaderboard() {
  const [models, setModels] = useState<ModelAccuracy[]>([]);
  const [predictionStats, setPredictionStats] = useState<ModelStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch accuracy data including new calibration fields
      const { data: accuracyData, error: accuracyError } = await supabase
        .from('ai_model_accuracy')
        .select('*')
        .order('accuracy_rate', { ascending: false });

      if (accuracyError) {
        console.error('Error fetching accuracy:', accuracyError);
      }

      // Fetch prediction counts grouped by model
      const { data: predictionData, error: predictionError } = await supabase
        .from('ai_model_predictions')
        .select('model_name, model_provider, trust_score');

      if (predictionError) {
        console.error('Error fetching predictions:', predictionError);
      }

      // Aggregate prediction stats
      const statsMap: { [key: string]: ModelStats } = {};
      if (predictionData) {
        for (const pred of predictionData) {
          const key = pred.model_name;
          if (!statsMap[key]) {
            statsMap[key] = {
              model_name: pred.model_name,
              model_provider: pred.model_provider,
              total_predictions: 0,
              avg_trust_score: 0,
            };
          }
          statsMap[key].total_predictions += 1;
          statsMap[key].avg_trust_score += pred.trust_score;
        }

        for (const key of Object.keys(statsMap)) {
          if (statsMap[key].total_predictions > 0) {
            statsMap[key].avg_trust_score = statsMap[key].avg_trust_score / statsMap[key].total_predictions;
          }
        }
      }

      setPredictionStats(Object.values(statsMap).sort((a, b) => b.total_predictions - a.total_predictions));

      // Merge accuracy data with prediction stats
      if (accuracyData && accuracyData.length > 0) {
        // Parse calibration_data if it's a string
        const parsedModels = accuracyData.map(m => ({
          ...m,
          calibration_data: typeof m.calibration_data === 'string' 
            ? JSON.parse(m.calibration_data) 
            : m.calibration_data
        }));
        setModels(parsedModels);
      } else {
        // Generate placeholder models from prediction stats
        const placeholderModels: ModelAccuracy[] = [
          { id: '1', model_name: 'Google Gemini Flash', model_provider: 'Google', total_predictions: 0, correct_predictions: 0, accuracy_rate: 0, avg_trust_score: 70, brier_score: null, calibration_data: null, last_updated: new Date().toISOString() },
          { id: '2', model_name: 'Google Gemini Pro', model_provider: 'Google', total_predictions: 0, correct_predictions: 0, accuracy_rate: 0, avg_trust_score: 78, brier_score: null, calibration_data: null, last_updated: new Date().toISOString() },
          { id: '3', model_name: 'Google Gemini 3 Pro', model_provider: 'Google', total_predictions: 0, correct_predictions: 0, accuracy_rate: 0, avg_trust_score: 80, brier_score: null, calibration_data: null, last_updated: new Date().toISOString() },
        ];

        // Update with real prediction counts
        for (const model of placeholderModels) {
          const stats = statsMap[model.model_name];
          if (stats) {
            model.total_predictions = stats.total_predictions;
            model.avg_trust_score = stats.avg_trust_score;
          }
        }

        setModels(placeholderModels);
      }
    } catch (error) {
      console.error('Error fetching AI model data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const totalPredictions = models.reduce((sum, m) => sum + m.total_predictions, 0);
  const hasResolvedPredictions = models.some(m => m.correct_predictions > 0);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            AI Model Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-xl">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            AI Model Leaderboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCalibration(!showCalibration)}
              className="text-xs"
            >
              {showCalibration ? 'Hide' : 'Show'} Calibration
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Track AI model accuracy and calibration as predictions resolve
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-muted rounded-lg text-center">
            <Database className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{totalPredictions}</div>
            <div className="text-xs text-muted-foreground">Total Predictions</div>
          </div>
          <div className="p-3 bg-muted rounded-lg text-center">
            <Brain className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-xl font-bold">{models.length}</div>
            <div className="text-xs text-muted-foreground">AI Models</div>
          </div>
        </div>

        {/* Notice for unresolved predictions */}
        {!hasResolvedPredictions && totalPredictions > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Awaiting market resolutions</p>
              <p className="text-muted-foreground mt-0.5">
                {totalPredictions} predictions recorded. Accuracy and calibration will update when markets resolve.
              </p>
            </div>
          </div>
        )}

        {/* Model Rankings */}
        <div className="space-y-3">
          {models.map((model, index) => (
            <motion.div
              key={model.id}
              className={`p-4 border rounded-xl ${
                index === 0 && model.correct_predictions > 0 ? 'border-primary/30 bg-primary/5' : 'bg-card/50'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <RankBadge rank={index + 1} />
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-sm">{model.model_name}</span>
                    <ProviderBadge provider={model.model_provider} />
                  </div>
                  
                  <AccuracyBar 
                    accuracy={model.accuracy_rate} 
                    predictions={model.correct_predictions} 
                  />
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {model.total_predictions} predictions
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {model.avg_trust_score.toFixed(0)} avg evidence
                    </span>
                    <BrierScoreIndicator 
                      score={model.brier_score} 
                      hasData={model.correct_predictions > 0} 
                    />
                  </div>

                  {/* Calibration chart (collapsible) */}
                  {showCalibration && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2 border-t mt-2"
                    >
                      <CalibrationChart bins={model.calibration_data} />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {models.every(m => m.total_predictions === 0) && (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No predictions recorded yet.</p>
            <p className="text-xs mt-1">Use AI analysis on markets to start tracking.</p>
          </div>
        )}

        {/* How it works */}
        <div className="p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium mb-1">How calibration works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>AI predictions are stored when you get market analysis</li>
            <li>When markets resolve, we calculate <strong>Brier score</strong> (probability accuracy)</li>
            <li><strong>Calibration</strong> measures if 70% predictions actually happen 70% of the time</li>
            <li>Lower Brier score = better calibrated model</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
