import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MarketOutcome {
  label: string;
  yesPrice: number;
  noPrice: number;
  marketId: string;
}

interface CryptoPriceData {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

interface OHLCCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CryptoTechnicalData extends CryptoPriceData {
  candles: OHLCCandle[];
  technicalSummary: string;
}

// Structured output from AI models (JSON schema)
interface StructuredAnalysis {
  outcomes: {
    label: string;
    probability: number;
    reasoning: string;
    dataPoints: string[];
  }[];
  topPick: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: 'high' | 'medium' | 'low';
  assumptions: string[];
  keyRisks: string[];
}

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
  evidenceDensity: number; // Renamed from trustScore
  dataPointsCited: number;
  assumptions: string[];
  keyRisks: string[];
}

interface ConsolidatedResponse {
  consensus: {
    topPick: string;
    topPickProbability: number;
    outcomeRankings: OutcomeAnalysis[];
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: 'high' | 'medium' | 'low';
    summary: string;
    reasoning: string;
    evidenceDensity: number;
    // NEW: Disagreement metrics
    disagreement: {
      probabilityRange: { min: number; max: number };
      standardDeviation: number;
      modelAgreement: 'high' | 'medium' | 'low';
      divergenceWarning: string | null;
    };
  };
  modelAnalyses: ModelAnalysis[];
  cryptoData?: CryptoTechnicalData;
  modelAccuracy: { [key: string]: { accuracy: number; totalPredictions: number } };
  metadata: {
    modelsUsed: number;
    timestamp: string;
    category: string;
    isMultiOutcome: boolean;
  };
}

// Detect market category for specialized analysis
function detectMarketCategory(title: string): string {
  const lowerTitle = title.toLowerCase();
  
  if (/bitcoin|btc|ethereum|eth|crypto|token|blockchain|defi|nft/i.test(lowerTitle)) {
    return 'crypto';
  }
  if (/election|president|vote|congress|senate|governor|political|trump|biden/i.test(lowerTitle)) {
    return 'politics';
  }
  if (/win|championship|match|game|team|player|score|league|cup|tournament|sport|nba|nfl|fifa|olympic|world cup/i.test(lowerTitle)) {
    return 'sports';
  }
  if (/stock|market cap|company|revenue|profit|earnings|ipo|nasdaq|s&p/i.test(lowerTitle)) {
    return 'finance';
  }
  if (/ai|artificial intelligence|gpt|openai|model|technology|launch|release/i.test(lowerTitle)) {
    return 'technology';
  }
  
  return 'general';
}

// Generate category-specific data requirements
function generateCategoryDataRequirements(category: string): string {
  switch (category) {
    case 'crypto':
      return `REQUIRED DATA (only use if provided or widely known):
- Technical levels from the provided price data
- On-chain metrics only if explicitly provided
- Known historical patterns (halvings, major events)
- Publicly announced regulatory developments`;

    case 'sports':
      return `REQUIRED DATA (only use if widely verifiable):
- Official FIFA/league rankings and recent form
- Publicly known injury reports
- Head-to-head historical records
- Tournament seeding and bracket position`;

    case 'politics':
      return `REQUIRED DATA (only use if verifiable):
- Published poll aggregates with sources
- Historical voting patterns by state/region
- Publicly announced endorsements
- Official campaign developments`;

    case 'finance':
      return `REQUIRED DATA (only use if publicly available):
- Published financial metrics (P/E, revenue)
- Official analyst ratings
- Historical price performance
- Announced company developments`;

    case 'technology':
      return `REQUIRED DATA (only use if verifiable):
- Official product announcements
- Published development timelines
- Known competitive landscape
- Regulatory status`;

    default:
      return `REQUIRED DATA (only use if verifiable):
- Statistics from the provided market data
- Widely known historical precedents
- Verifiable public information`;
  }
}

// Fetch crypto price from Binance
async function fetchCryptoPrice(symbol: string): Promise<CryptoPriceData | null> {
  try {
    const normalizedSymbol = symbol.toUpperCase().replace(/\s+/g, '');
    const tradingPair = `${normalizedSymbol}USDT`;
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${tradingPair}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      symbol: tradingPair,
      currentPrice: parseFloat(data.lastPrice) || 0,
      priceChange24h: parseFloat(data.priceChange) || 0,
      priceChangePercent24h: parseFloat(data.priceChangePercent) || 0,
      high24h: parseFloat(data.highPrice) || 0,
      low24h: parseFloat(data.lowPrice) || 0,
      volume24h: parseFloat(data.volume) || 0,
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

// Fetch OHLC candle data
async function fetchOHLCData(symbol: string): Promise<OHLCCandle[]> {
  try {
    const normalizedSymbol = symbol.toUpperCase().replace(/\s+/g, '');
    const tradingPair = `${normalizedSymbol}USDT`;
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${tradingPair}&interval=15m&limit=24`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    return data.map((candle: any[]) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]) || 0,
      high: parseFloat(candle[2]) || 0,
      low: parseFloat(candle[3]) || 0,
      close: parseFloat(candle[4]) || 0,
      volume: parseFloat(candle[5]) || 0,
    }));
  } catch (error) {
    console.error(`Error fetching OHLC for ${symbol}:`, error);
    return [];
  }
}

// Generate technical summary from OHLC data
function generateTechnicalSummary(candles: OHLCCandle[]): string {
  if (candles.length === 0) return '';
  
  const latest = candles[candles.length - 1];
  const earliest = candles[0];
  
  const priceChange = ((latest.close - earliest.open) / earliest.open) * 100;
  const trend = priceChange > 0 ? 'uptrend' : 'downtrend';
  
  const avgVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  const recentVolume = candles.slice(-3).reduce((sum, c) => sum + c.volume, 0) / 3;
  const volumeTrend = recentVolume > avgVolume * 1.2 ? 'increasing' : recentVolume < avgVolume * 0.8 ? 'decreasing' : 'stable';
  
  const periodHigh = Math.max(...candles.map(c => c.high));
  const periodLow = Math.min(...candles.map(c => c.low));
  const pricePosition = ((latest.close - periodLow) / (periodHigh - periodLow)) * 100;
  
  return `6h ${trend} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%). Price at ${pricePosition.toFixed(0)}% of range. Volume ${volumeTrend}.`;
}

// Extract crypto symbol from market title
function extractCryptoSymbol(marketTitle: string): string | null {
  const title = marketTitle.toUpperCase();
  
  const cryptoSymbols = [
    'BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'BNB', 'SOL', 'SOLANA',
    'XRP', 'ADA', 'CARDANO', 'DOGE', 'DOGECOIN', 'MATIC', 'DOT',
    'AVAX', 'LINK', 'UNI', 'ATOM', 'HYPE', 'TRUMP', 'PEPE', 'SHIB'
  ];
  
  for (const symbol of cryptoSymbols) {
    if (title.includes(symbol)) {
      const symbolMap: Record<string, string> = {
        'BITCOIN': 'BTC', 'ETHEREUM': 'ETH', 'SOLANA': 'SOL',
        'CARDANO': 'ADA', 'DOGECOIN': 'DOGE'
      };
      return symbolMap[symbol] || symbol;
    }
  }
  
  return null;
}

// Fetch model accuracy from database
async function fetchModelAccuracy(): Promise<{ [key: string]: { accuracy: number; totalPredictions: number } }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('ai_model_accuracy')
      .select('model_name, accuracy_rate, total_predictions');
    
    if (error || !data) {
      console.error('Error fetching model accuracy:', error);
      return {};
    }
    
    const accuracy: { [key: string]: { accuracy: number; totalPredictions: number } } = {};
    for (const row of data) {
      accuracy[row.model_name] = {
        accuracy: row.accuracy_rate || 0,
        totalPredictions: row.total_predictions || 0,
      };
    }
    return accuracy;
  } catch (error) {
    console.error('Error in fetchModelAccuracy:', error);
    return {};
  }
}

// Save prediction to database for historical tracking
async function savePrediction(
  marketId: string,
  marketTitle: string,
  outcomeLabel: string | null,
  modelName: string,
  modelProvider: string,
  sentiment: string,
  aiProbability: number,
  marketProbability: number,
  confidence: string,
  evidenceDensity: number,
  dataPointsCited: number
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.from('ai_model_predictions').insert({
      market_id: marketId,
      market_title: marketTitle,
      outcome_label: outcomeLabel,
      model_name: modelName,
      model_provider: modelProvider,
      predicted_sentiment: sentiment,
      predicted_probability: aiProbability,
      market_probability: marketProbability,
      confidence: confidence,
      trust_score: evidenceDensity,
      data_points_cited: dataPointsCited,
    });
  } catch (error) {
    console.error('Error saving prediction:', error);
  }
}

// Tool schema for structured output
function buildAnalysisToolSchema(outcomeLabels: string[]) {
  return {
    type: "function",
    function: {
      name: "submit_market_analysis",
      description: "Submit your probability analysis for the prediction market outcomes",
      parameters: {
        type: "object",
        properties: {
          outcomes: {
            type: "array",
            description: "Your probability assessment for each outcome",
            items: {
              type: "object",
              properties: {
                label: { 
                  type: "string",
                  enum: outcomeLabels,
                  description: "The outcome label (must match exactly)"
                },
                probability: { 
                  type: "number",
                  minimum: 0,
                  maximum: 100,
                  description: "Your probability estimate (0-100)"
                },
                reasoning: { 
                  type: "string",
                  description: "Brief reasoning for this probability (1-2 sentences)"
                },
                dataPoints: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific verifiable data points supporting this estimate"
                }
              },
              required: ["label", "probability", "reasoning", "dataPoints"],
              additionalProperties: false
            }
          },
          topPick: {
            type: "string",
            enum: outcomeLabels,
            description: "Your highest probability outcome"
          },
          sentiment: {
            type: "string",
            enum: ["bullish", "bearish", "neutral"],
            description: "Your overall market sentiment"
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Your confidence in this analysis"
          },
          assumptions: {
            type: "array",
            items: { type: "string" },
            description: "Key assumptions underlying your analysis (label any unverifiable claims)"
          },
          keyRisks: {
            type: "array",
            items: { type: "string" },
            description: "Factors that could invalidate this analysis"
          }
        },
        required: ["outcomes", "topPick", "sentiment", "confidence", "assumptions", "keyRisks"],
        additionalProperties: false
      }
    }
  };
}

// Validate structured output
function validateStructuredAnalysis(
  parsed: any, 
  validLabels: string[]
): { valid: boolean; analysis: StructuredAnalysis | null; error: string | null } {
  try {
    // Check required fields
    if (!parsed.outcomes || !Array.isArray(parsed.outcomes)) {
      return { valid: false, analysis: null, error: "Missing outcomes array" };
    }
    if (!parsed.topPick) {
      return { valid: false, analysis: null, error: "Missing topPick" };
    }
    
    // Validate topPick is in valid labels
    const normalizedLabels = validLabels.map(l => l.toLowerCase().trim());
    const normalizedTopPick = parsed.topPick.toLowerCase().trim();
    
    if (!normalizedLabels.includes(normalizedTopPick)) {
      return { valid: false, analysis: null, error: `Invalid topPick "${parsed.topPick}". Must be one of: ${validLabels.join(', ')}` };
    }
    
    // Validate each outcome
    for (const outcome of parsed.outcomes) {
      const normalizedLabel = outcome.label?.toLowerCase().trim();
      if (!normalizedLabels.includes(normalizedLabel)) {
        console.warn(`Skipping unknown outcome: ${outcome.label}`);
        continue;
      }
      if (typeof outcome.probability !== 'number' || outcome.probability < 0 || outcome.probability > 100) {
        return { valid: false, analysis: null, error: `Invalid probability for ${outcome.label}` };
      }
    }
    
    // Filter to only valid outcomes
    const validOutcomes = parsed.outcomes.filter((o: any) => 
      normalizedLabels.includes(o.label?.toLowerCase().trim())
    );
    
    // Check probability sum (should be close to 100 for multi-outcome)
    const probSum = validOutcomes.reduce((sum: number, o: any) => sum + o.probability, 0);
    if (validOutcomes.length > 2 && Math.abs(probSum - 100) > 15) {
      console.warn(`Probability sum is ${probSum}%, expected ~100%`);
    }
    
    return {
      valid: true,
      analysis: {
        outcomes: validOutcomes,
        topPick: parsed.topPick,
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 'medium',
        assumptions: parsed.assumptions || [],
        keyRisks: parsed.keyRisks || []
      },
      error: null
    };
  } catch (e) {
    return { valid: false, analysis: null, error: `Parse error: ${e}` };
  }
}

// Calculate evidence density (replaces trust score)
// PENALIZES: overconfidence, unsupported claims, probability extremes
function calculateEvidenceDensity(
  structured: StructuredAnalysis,
  dataPointCount: number,
  isOverconfident: boolean
): number {
  let score = 50; // Start at neutral
  
  // Reward: data points cited (capped)
  const dataBonus = Math.min(dataPointCount * 3, 25);
  score += dataBonus;
  
  // Reward: assumptions disclosed
  const assumptionBonus = Math.min(structured.assumptions.length * 3, 12);
  score += assumptionBonus;
  
  // Reward: risks identified
  const riskBonus = Math.min(structured.keyRisks.length * 2, 8);
  score += riskBonus;
  
  // PENALIZE: overconfidence (any single outcome >85% without justification)
  if (isOverconfident) {
    score -= 15;
  }
  
  // PENALIZE: extreme probability concentration
  const maxProb = Math.max(...structured.outcomes.map(o => o.probability));
  if (maxProb > 90) {
    score -= 10;
  }
  
  // PENALIZE: low confidence + high probability (inconsistent)
  if (structured.confidence === 'low' && maxProb > 70) {
    score -= 8;
  }
  
  return Math.min(100, Math.max(0, score));
}

// Fallback model configurations (ordered)
const FALLBACK_MODELS: Record<string, string[]> = {
  'google/gemini-3-flash-preview': ['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite'],
  'google/gemini-2.5-pro': ['google/gemini-3-pro-preview', 'google/gemini-2.5-flash'],
  'google/gemini-3-pro-preview': ['google/gemini-2.5-pro', 'google/gemini-2.5-flash'],
};

// Get structured analysis from model using tool calling
async function getStructuredModelAnalysis(
  modelId: string,
  displayName: string,
  provider: string,
  prompt: string,
  outcomes: MarketOutcome[],
  category: string
): Promise<ModelAnalysis | null> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.error('LOVABLE_API_KEY not configured');
    return null;
  }

  const outcomeLabels = outcomes.map(o => o.label);
  const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  const systemPrompt = `You are a prediction market analyst. Today is ${todayDate}.

CRITICAL RULES:
1. You may ONLY assign probabilities to these outcomes: ${outcomeLabels.join(', ')}
2. Do NOT invent product names, companies, initiatives, or statistics not provided
3. If a fact cannot be verified from the provided data, label it as an ASSUMPTION
4. Be calibrated: avoid extreme probabilities (>90% or <10%) unless strongly justified

${generateCategoryDataRequirements(category)}

Use the submit_market_analysis tool to provide your structured response.`;

  const toolSchema = buildAnalysisToolSchema(outcomeLabels);

  const makeRequest = async (model: string): Promise<StructuredAnalysis | null> => {
    try {
      console.log(`Attempting structured analysis with model: ${model}`);
      
      const isOpenAI = model.startsWith('openai/');
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "submit_market_analysis" } },
      };
      
      if (isOpenAI) {
        requestBody.max_completion_tokens = 2000;
      } else {
        requestBody.max_tokens = 2000;
        requestBody.temperature = 0.5; // Lower temp for more consistent structured output
      }
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${model} error:`, response.status, errorText);
        return null;
      }

      const data = await response.json();
      
      // Extract tool call arguments
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall || toolCall.function.name !== 'submit_market_analysis') {
        console.error(`${model}: No valid tool call in response`);
        
        // Fallback: try to parse from content if tool calling failed
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          console.log(`${model}: Attempting fallback parse from content`);
          return parseFallbackContent(content, outcomeLabels);
        }
        return null;
      }
      
      const parsed = JSON.parse(toolCall.function.arguments);
      const validation = validateStructuredAnalysis(parsed, outcomeLabels);
      
      if (!validation.valid) {
        console.error(`${model}: Validation failed - ${validation.error}`);
        return null;
      }
      
      return validation.analysis;
    } catch (error) {
      console.error(`${model} request failed:`, error);
      return null;
    }
  };

  // Try primary model
  let structured = await makeRequest(modelId);
  let usedModel = modelId;
  let usedFallback = false;

  // If primary fails, try ordered fallbacks
  if (!structured) {
    const fallbacks = FALLBACK_MODELS[modelId] || [];
    for (const fallbackModel of fallbacks) {
      console.log(`Primary model ${modelId} failed, trying fallback: ${fallbackModel}`);
      structured = await makeRequest(fallbackModel);
      if (structured) {
        usedModel = fallbackModel;
        usedFallback = true;
        break;
      }
    }
  }

  if (!structured) {
    console.error(`All attempts failed for ${displayName}`);
    return null;
  }

  // Build outcome rankings from structured output
  const outcomeRankings: OutcomeAnalysis[] = [];
  const isMultiOutcome = outcomes.length > 2;
  
  for (const outcome of outcomes) {
    const structuredOutcome = structured.outcomes.find(
      o => o.label.toLowerCase().trim() === outcome.label.toLowerCase().trim()
    );
    
    // CRITICAL: Ensure marketProbability is in 0-100 range
    const rawMarketProb = outcome.yesPrice * 100;
    const marketProbability = Math.max(0, Math.min(100, rawMarketProb));
    
    // Get AI probability from structured output
    let aiProbability = structuredOutcome?.probability;
    
    // If AI didn't provide probability, use market probability (not a fabricated value)
    if (aiProbability === undefined || aiProbability === null) {
      aiProbability = marketProbability;
      console.warn(`No AI probability for ${outcome.label}, using market: ${marketProbability}%`);
    }
    
    // SAFETY: Clamp AI probability to valid range
    aiProbability = Math.max(0, Math.min(100, aiProbability));
    
    outcomeRankings.push({
      outcomeLabel: outcome.label,
      aiProbability,
      marketProbability,
      edge: aiProbability - marketProbability,
      reasoning: structuredOutcome?.reasoning ?? `Analysis for ${outcome.label}`,
      dataPoints: structuredOutcome?.dataPoints ?? [],
    });
  }
  
  // For multi-outcome markets: normalize AI probabilities to sum to 100%
  if (isMultiOutcome) {
    const aiSum = outcomeRankings.reduce((sum, r) => sum + r.aiProbability, 0);
    
    if (aiSum > 0 && Math.abs(aiSum - 100) > 2) {
      console.log(`Normalizing AI probabilities from ${aiSum.toFixed(1)}% to 100%`);
      for (const ranking of outcomeRankings) {
        ranking.aiProbability = (ranking.aiProbability / aiSum) * 100;
        ranking.edge = ranking.aiProbability - ranking.marketProbability;
      }
    }
  }
  
  // Sort by AI probability descending
  outcomeRankings.sort((a, b) => b.aiProbability - a.aiProbability);
  
  const topOutcome = outcomeRankings[0];
  const dataPointCount = structured.outcomes.reduce((sum, o) => sum + (o.dataPoints?.length || 0), 0);
  
  // Check for overconfidence
  const isOverconfident = topOutcome.aiProbability > 85 && 
    dataPointCount < 3 && 
    structured.confidence !== 'low';
  
  const evidenceDensity = calculateEvidenceDensity(structured, dataPointCount, isOverconfident);
  
  // Build readable analysis from structured data
  const analysisText = buildAnalysisText(structured, outcomeRankings);
  
  const finalDisplayName = usedFallback ? `${displayName} (Fallback)` : displayName;

  return {
    model: finalDisplayName,
    modelProvider: provider,
    analysis: analysisText,
    outcomeRankings,
    topPick: structured.topPick,
    topPickProbability: topOutcome?.aiProbability ?? 50,
    sentiment: structured.sentiment,
    confidence: structured.confidence,
    evidenceDensity: usedFallback ? Math.max(0, evidenceDensity - 5) : evidenceDensity,
    dataPointsCited: dataPointCount,
    assumptions: structured.assumptions,
    keyRisks: structured.keyRisks,
  };
}

// Fallback parser for when tool calling fails
function parseFallbackContent(content: string, validLabels: string[]): StructuredAnalysis | null {
  try {
    const outcomes: StructuredAnalysis['outcomes'] = [];
    
    for (const label of validLabels) {
      // Try to find probability for this label
      const regex = new RegExp(`${label}[:\\s]*(\\d{1,3})%`, 'gi');
      const match = content.match(regex);
      
      let probability = 50 / validLabels.length; // Default equal split
      if (match && match.length > 0) {
        const probMatch = match[0].match(/(\d{1,3})%/);
        if (probMatch) {
          probability = parseInt(probMatch[1], 10);
        }
      }
      
      outcomes.push({
        label,
        probability: Math.min(100, Math.max(0, probability)),
        reasoning: `Extracted from analysis`,
        dataPoints: []
      });
    }
    
    // Find top pick
    outcomes.sort((a, b) => b.probability - a.probability);
    const topPick = outcomes[0]?.label || validLabels[0];
    
    // Detect sentiment from keywords
    const lower = content.toLowerCase();
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (/bullish|optimistic|likely|strong|favor/i.test(lower)) sentiment = 'bullish';
    if (/bearish|unlikely|weak|doubt|risk/i.test(lower)) sentiment = 'bearish';
    
    return {
      outcomes,
      topPick,
      sentiment,
      confidence: 'low', // Lower confidence for fallback parsing
      assumptions: ['Analysis parsed from unstructured response'],
      keyRisks: []
    };
  } catch (e) {
    console.error('Fallback parsing failed:', e);
    return null;
  }
}

// Build readable analysis text from structured data
function buildAnalysisText(structured: StructuredAnalysis, rankings: OutcomeAnalysis[]): string {
  const lines: string[] = [];
  
  lines.push(`**Highest Model-Implied Outcome:** ${structured.topPick}`);
  lines.push('');
  lines.push('**Probability Rankings:**');
  
  for (const ranking of rankings.slice(0, 6)) {
    // Use qualitative comparison instead of "edge" percentage
    let comparison = 'aligns with market';
    const delta = ranking.aiProbability - ranking.marketProbability;
    if (delta > 3) comparison = 'model higher than market';
    else if (delta < -3) comparison = 'model lower than market';
    
    lines.push(`• ${ranking.outcomeLabel}: ${ranking.aiProbability.toFixed(1)}% (Market: ${ranking.marketProbability.toFixed(1)}%) — ${comparison}`);
    if (ranking.reasoning) {
      lines.push(`  → ${ranking.reasoning}`);
    }
  }
  
  if (structured.assumptions.length > 0) {
    lines.push('');
    lines.push('**Key Assumptions:**');
    for (const assumption of structured.assumptions.slice(0, 3)) {
      lines.push(`• ${assumption}`);
    }
  }
  
  if (structured.keyRisks.length > 0) {
    lines.push('');
    lines.push('**Risk Factors:**');
    for (const risk of structured.keyRisks.slice(0, 3)) {
      lines.push(`• ${risk}`);
    }
  }
  
  return lines.join('\n');
}

// Calculate disagreement metrics across models
function calculateDisagreement(analyses: ModelAnalysis[], topPick: string): {
  probabilityRange: { min: number; max: number };
  standardDeviation: number;
  modelAgreement: 'high' | 'medium' | 'low';
  divergenceWarning: string | null;
} {
  // Get all probabilities for the top pick across models
  const topPickProbs: number[] = [];
  
  for (const analysis of analyses) {
    const ranking = analysis.outcomeRankings.find(r => 
      r.outcomeLabel.toLowerCase() === topPick.toLowerCase()
    );
    if (ranking) {
      topPickProbs.push(ranking.aiProbability);
    }
  }
  
  if (topPickProbs.length === 0) {
    return {
      probabilityRange: { min: 0, max: 0 },
      standardDeviation: 0,
      modelAgreement: 'low',
      divergenceWarning: 'No model data available'
    };
  }
  
  const min = Math.min(...topPickProbs);
  const max = Math.max(...topPickProbs);
  const range = max - min;
  
  // Calculate standard deviation
  const mean = topPickProbs.reduce((a, b) => a + b, 0) / topPickProbs.length;
  const squaredDiffs = topPickProbs.map(p => Math.pow(p - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const standardDeviation = Math.sqrt(avgSquaredDiff);
  
  // Determine agreement level
  let modelAgreement: 'high' | 'medium' | 'low' = 'medium';
  if (range <= 10 && standardDeviation <= 5) {
    modelAgreement = 'high';
  } else if (range >= 25 || standardDeviation >= 12) {
    modelAgreement = 'low';
  }
  
  // Generate warning if significant divergence
  let divergenceWarning: string | null = null;
  if (range >= 20) {
    divergenceWarning = `Models diverge significantly (${min.toFixed(0)}%–${max.toFixed(0)}%). Treat consensus with caution.`;
  }
  
  return {
    probabilityRange: { min, max },
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    modelAgreement,
    divergenceWarning
  };
}

// Generate consensus using trimmed mean (not simple average)
function generateConsensusWithDisagreement(analyses: ModelAnalysis[], outcomes: MarketOutcome[]): ConsolidatedResponse['consensus'] {
  if (analyses.length === 0) {
    return {
      topPick: outcomes[0]?.label || 'YES',
      topPickProbability: (outcomes[0]?.yesPrice || 0.5) * 100,
      outcomeRankings: outcomes.map(o => ({
        outcomeLabel: o.label,
        aiProbability: o.yesPrice * 100,
        marketProbability: o.yesPrice * 100,
        edge: 0,
        reasoning: 'Unable to analyze',
        dataPoints: [],
      })),
      sentiment: 'neutral',
      confidence: 'low',
      summary: 'Unable to generate analysis at this time.',
      reasoning: 'No model analyses available.',
      evidenceDensity: 0,
      disagreement: {
        probabilityRange: { min: 0, max: 0 },
        standardDeviation: 0,
        modelAgreement: 'low',
        divergenceWarning: 'No models responded'
      }
    };
  }

  // Aggregate outcome probabilities using trimmed mean
  const aggregatedRankings: { 
    [label: string]: { 
      probs: number[]; 
      reasoning: string[]; 
      dataPoints: string[];
      marketProb: number;
    } 
  } = {};
  
  for (const outcome of outcomes) {
    aggregatedRankings[outcome.label] = {
      probs: [],
      reasoning: [],
      dataPoints: [],
      marketProb: outcome.yesPrice * 100
    };
  }
  
  for (const analysis of analyses) {
    for (const ranking of analysis.outcomeRankings) {
      const agg = aggregatedRankings[ranking.outcomeLabel];
      if (agg) {
        agg.probs.push(ranking.aiProbability);
        if (ranking.reasoning) agg.reasoning.push(ranking.reasoning);
        agg.dataPoints.push(...ranking.dataPoints);
      }
    }
  }
  
  // Calculate trimmed mean (drop highest and lowest if 3+ values)
  function trimmedMean(values: number[]): number {
    if (values.length === 0) return 50;
    if (values.length <= 2) {
      return values.reduce((a, b) => a + b, 0) / values.length;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const trimmed = sorted.slice(1, -1); // Drop min and max
    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }
  
  // Build consensus rankings with normalized probabilities
  const outcomeRankings: OutcomeAnalysis[] = [];
  for (const outcome of outcomes) {
    const agg = aggregatedRankings[outcome.label];
    const avgProbability = trimmedMean(agg.probs);
    
    // SAFETY: Clamp to valid range
    const safeAiProb = Math.max(0, Math.min(100, Math.round(avgProbability * 10) / 10));
    const safeMarketProb = Math.max(0, Math.min(100, agg.marketProb));
    
    outcomeRankings.push({
      outcomeLabel: outcome.label,
      aiProbability: safeAiProb,
      marketProbability: safeMarketProb,
      edge: Math.round((safeAiProb - safeMarketProb) * 10) / 10,
      reasoning: agg.reasoning[0] || `Consensus for ${outcome.label}`,
      dataPoints: [...new Set(agg.dataPoints)].slice(0, 5),
    });
  }
  
  // For multi-outcome: normalize consensus probabilities
  const isMultiOutcome = outcomes.length > 2;
  if (isMultiOutcome) {
    const aiSum = outcomeRankings.reduce((sum, r) => sum + r.aiProbability, 0);
    if (aiSum > 0 && Math.abs(aiSum - 100) > 2) {
      console.log(`Normalizing consensus AI probabilities from ${aiSum.toFixed(1)}% to 100%`);
      for (const ranking of outcomeRankings) {
        ranking.aiProbability = (ranking.aiProbability / aiSum) * 100;
        ranking.aiProbability = Math.round(ranking.aiProbability * 10) / 10;
        ranking.edge = ranking.aiProbability - ranking.marketProbability;
      }
    }
  }
  
  // Sort by AI probability
  outcomeRankings.sort((a, b) => b.aiProbability - a.aiProbability);
  
  const topPick = outcomeRankings[0];
  
  // Count top pick votes from models (weighted by evidence density)
  const topPickVotes: { [label: string]: number } = {};
  for (const analysis of analyses) {
    topPickVotes[analysis.topPick] = (topPickVotes[analysis.topPick] || 0) + analysis.evidenceDensity;
  }
  
  // Get consensus top pick
  let consensusTopPick = topPick.outcomeLabel;
  let maxVotes = 0;
  for (const [label, votes] of Object.entries(topPickVotes)) {
    if (votes > maxVotes) {
      maxVotes = votes;
      consensusTopPick = label;
    }
  }
  
  // Calculate disagreement for consensus top pick
  const disagreement = calculateDisagreement(analyses, consensusTopPick);
  
  // Calculate sentiment
  let bullishWeight = 0, bearishWeight = 0, neutralWeight = 0;
  let totalWeight = 0;
  
  for (const a of analyses) {
    const weight = a.evidenceDensity;
    totalWeight += weight;
    if (a.sentiment === 'bullish') bullishWeight += weight;
    else if (a.sentiment === 'bearish') bearishWeight += weight;
    else neutralWeight += weight;
  }

  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bullishWeight > bearishWeight && bullishWeight > neutralWeight) {
    sentiment = 'bullish';
  } else if (bearishWeight > bullishWeight && bearishWeight > neutralWeight) {
    sentiment = 'bearish';
  }

  // Confidence based on agreement
  let confidence: 'high' | 'medium' | 'low' = disagreement.modelAgreement;

  const evidenceDensity = Math.round(analyses.reduce((sum, a) => sum + a.evidenceDensity, 0) / analyses.length);
  const totalDataPoints = analyses.reduce((sum, a) => sum + a.dataPointsCited, 0);
  
  const consensusOutcome = outcomeRankings.find(r => r.outcomeLabel === consensusTopPick) || topPick;
  
  // Build summary with disagreement context
  let summary = `Based on ${analyses.length} AI models, **${consensusTopPick}** has model-implied probability of ${Math.round(consensusOutcome.aiProbability)}%.`;
  
  if (disagreement.divergenceWarning) {
    summary += ` ⚠️ ${disagreement.divergenceWarning}`;
  } else if (disagreement.modelAgreement === 'high') {
    summary += ` Models show strong consensus.`;
  }
  
  // Use qualitative language for model vs market comparison
  const edgeAbs = Math.abs(consensusOutcome.edge);
  if (edgeAbs > 5) {
    const direction = consensusOutcome.edge > 0 ? 'higher than' : 'lower than';
    summary += ` Model is ${direction} market.`;
  }

  return {
    topPick: consensusTopPick,
    topPickProbability: Math.round(consensusOutcome.aiProbability),
    outcomeRankings,
    sentiment,
    confidence,
    summary,
    reasoning: analyses[0]?.analysis.slice(0, 500) + '...',
    evidenceDensity,
    disagreement,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketTitle, marketId, yesPercentage, noPercentage, volume, outcomes } = await req.json();

    if (!marketTitle) {
      return new Response(
        JSON.stringify({ error: 'Market title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing market: ${marketTitle}`);
    
    const isMultiOutcome = outcomes && Array.isArray(outcomes) && outcomes.length > 1;
    console.log(`Multi-outcome market: ${isMultiOutcome}, Outcomes: ${outcomes?.length || 1}`);

    // CRITICAL: Normalize prices to 0-1 decimal format
    // Frontend sends yesPrice as 0-100 integers, we need 0-1 decimals
    const normalizePrice = (price: number | undefined, fallback: number): number => {
      if (price === undefined || price === null) return fallback;
      // If price > 1, it's in 0-100 format, convert to 0-1
      if (price > 1) return price / 100;
      return price;
    };

    // Build outcomes array for analysis - ALL prices normalized to 0-1
    let marketOutcomes: MarketOutcome[];
    
    if (isMultiOutcome) {
      // For multi-outcome markets, require valid per-outcome prices
      // DO NOT fall back to binary yesPercentage - that's meaningless for categorical markets
      marketOutcomes = outcomes.map((o: any) => {
        const rawYes = o.yesPrice ?? o.impliedProbability;
        const rawNo = o.noPrice;
        
        // Normalize to 0-1
        const yesPrice = normalizePrice(rawYes, 1 / outcomes.length);
        const noPrice = normalizePrice(rawNo, 1 - yesPrice);
        
        return {
          label: o.label || o.outcomeLabel,
          yesPrice,
          noPrice,
          marketId: o.marketId || marketId,
        };
      });
      
      // Validate: probabilities should sum to ~1 for multi-outcome
      const probSum = marketOutcomes.reduce((sum, o) => sum + o.yesPrice, 0);
      console.log(`Multi-outcome probability sum: ${(probSum * 100).toFixed(1)}%`);
      
      // Normalize if significantly off
      if (Math.abs(probSum - 1) > 0.15 && probSum > 0) {
        console.warn(`Normalizing probabilities from ${(probSum * 100).toFixed(1)}% to 100%`);
        marketOutcomes = marketOutcomes.map(o => ({
          ...o,
          yesPrice: o.yesPrice / probSum,
        }));
      }
    } else {
      // Binary market: yesPercentage is meaningful
      marketOutcomes = [
        { label: 'YES', yesPrice: yesPercentage / 100, noPrice: noPercentage / 100, marketId },
        { label: 'NO', yesPrice: noPercentage / 100, noPrice: yesPercentage / 100, marketId }
      ];
    }

    const category = detectMarketCategory(marketTitle);
    console.log(`Detected category: ${category}`);

    // Extract crypto symbol for price data
    const cryptoSymbol = extractCryptoSymbol(marketTitle);
    let cryptoData: CryptoTechnicalData | null = null;

    if (cryptoSymbol) {
      console.log(`Fetching crypto data for ${cryptoSymbol}...`);
      const [priceData, ohlcData] = await Promise.all([
        fetchCryptoPrice(cryptoSymbol),
        fetchOHLCData(cryptoSymbol),
      ]);
      
      if (priceData) {
        cryptoData = {
          ...priceData,
          candles: ohlcData,
          technicalSummary: generateTechnicalSummary(ohlcData),
        };
      }
    }

    // Build the analysis prompt
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const outcomeLabels = marketOutcomes.map(o => o.label);
    
    let prompt = `**Today's Date: ${formattedDate}**

**Market Question:** ${marketTitle}

**Available Outcomes:** ${outcomeLabels.join(', ')}

**Current Market Prices:**`;

    for (const outcome of marketOutcomes) {
      prompt += `\n- ${outcome.label}: ${(outcome.yesPrice * 100).toFixed(1)}%`;
    }
    
    prompt += `\n- Trading volume: $${volume}`;

    if (cryptoData) {
      prompt += `

**Live ${cryptoData.symbol} Data:**
- Current Price: $${cryptoData.currentPrice.toFixed(2)}
- 24h Change: ${cryptoData.priceChangePercent24h >= 0 ? '+' : ''}${cryptoData.priceChangePercent24h.toFixed(2)}%
- 24h Range: $${cryptoData.low24h.toFixed(2)} - $${cryptoData.high24h.toFixed(2)}
- Technical: ${cryptoData.technicalSummary}`;
    }

    prompt += `

Analyze this market and provide probability estimates for EACH of these outcomes: ${outcomeLabels.join(', ')}

IMPORTANT: Only use the outcomes listed above. Do not introduce new outcomes.`;

    // Fetch model accuracy data
    const modelAccuracy = await fetchModelAccuracy();

    // Get structured analyses from all models in parallel
    console.log('Fetching structured AI analyses...');
    const [flashAnalysis, proAnalysis, thirdAnalysis] = await Promise.all([
      getStructuredModelAnalysis('google/gemini-3-flash-preview', 'Gemini Flash', 'Google', prompt, marketOutcomes, category),
      getStructuredModelAnalysis('google/gemini-2.5-pro', 'Gemini Pro', 'Google', prompt, marketOutcomes, category),
      getStructuredModelAnalysis('google/gemini-3-pro-preview', 'Gemini 3 Pro', 'Google', prompt, marketOutcomes, category),
    ]);

    console.log(`Model results - Flash: ${flashAnalysis ? 'success' : 'failed'}, Pro: ${proAnalysis ? 'success' : 'failed'}, Gemini 3 Pro: ${thirdAnalysis ? 'success' : 'failed'}`);

    const analyses = [flashAnalysis, proAnalysis, thirdAnalysis].filter((a): a is ModelAnalysis => a !== null);

    if (analyses.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate analysis. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate consensus with disagreement metrics
    const consensus = generateConsensusWithDisagreement(analyses, marketOutcomes);

    // Save predictions to database
    for (const analysis of analyses) {
      const topOutcome = analysis.outcomeRankings[0];
      await savePrediction(
        marketId,
        marketTitle,
        isMultiOutcome ? topOutcome?.outcomeLabel : null,
        analysis.model,
        analysis.modelProvider,
        analysis.sentiment,
        topOutcome?.aiProbability || yesPercentage,
        topOutcome?.marketProbability || yesPercentage,
        analysis.confidence,
        analysis.evidenceDensity,
        analysis.dataPointsCited
      );
    }

    const response: ConsolidatedResponse = {
      consensus,
      modelAnalyses: analyses,
      cryptoData: cryptoData || undefined,
      modelAccuracy,
      metadata: {
        modelsUsed: analyses.length,
        timestamp: new Date().toISOString(),
        category,
        isMultiOutcome,
      },
    };

    console.log(`Analysis complete. Models: ${analyses.length}, Top Pick: ${consensus.topPick}, Agreement: ${consensus.disagreement.modelAgreement}`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Market analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
