import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Loader2, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/db";
import { toast } from "sonner";

const AUTO_REFRESH_MS = 2 * 60 * 1000;
const CACHE_TTL_MS = 2 * 60 * 1000;

const analysisCache = new Map<string, { analysis: string; timestamp: number }>();

function getCacheKey(asset: string, timeframe: string) {
  return `${asset}-${timeframe}`;
}

function formatTimeAgo(ts: number) {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ago`;
}

interface AIMarketAnalyzerProps {
  asset: string;
  timeframe: "hourly" | "daily";
  currentPrice: number;
  baseline: number;
  yesProb: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AIMarketAnalyzer({ asset, timeframe, currentPrice, baseline, yesProb, isOpen, onToggle }: AIMarketAnalyzerProps) {
  const isControlled = isOpen !== undefined;
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const collapsed = isControlled ? !isOpen : internalCollapsed;

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [wasCached, setWasCached] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [, forceUpdate] = useState(0); // for re-rendering timeAgo

  const fetchAnalysis = useCallback(async (skipCache = false) => {
    if (isLoading) return;

    const key = getCacheKey(asset, timeframe);
    if (!skipCache) {
      const cached = analysisCache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        setAnalysis(cached.analysis);
        setFetchedAt(cached.timestamp);
        setWasCached(true);
        setHasLoaded(true);
        return;
      }
    }

    setIsLoading(true);
    setWasCached(false);
    try {
      const { data, error } = await supabase.functions.invoke("market-ai-analysis", {
        body: { asset, timeframe, currentPrice, baseline, yesProb },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data?.analysis || "No analysis available.";
      const now = Date.now();
      setAnalysis(result);
      setFetchedAt(now);
      setHasLoaded(true);
      setCountdown(120);
      analysisCache.set(key, { analysis: result, timestamp: now });
    } catch (err: any) {
      console.error("AI analysis error:", err);
      toast.error("Failed to fetch AI analysis");
    } finally {
      setIsLoading(false);
    }
  }, [asset, timeframe, currentPrice, baseline, yesProb, isLoading]);

  // Auto-refresh every 2 minutes while expanded
  useEffect(() => {
    if (!collapsed && hasLoaded) {
      intervalRef.current = setInterval(() => {
        fetchAnalysis(true);
      }, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [collapsed, hasLoaded, fetchAnalysis]);

  // Countdown timer
  useEffect(() => {
    if (!collapsed && hasLoaded) {
      setCountdown(120);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 120 : prev - 1));
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [collapsed, hasLoaded, fetchedAt]);

  // Update timeAgo display every 10s
  useEffect(() => {
    if (!collapsed && fetchedAt) {
      const t = setInterval(() => forceUpdate((n) => n + 1), 10000);
      return () => clearInterval(t);
    }
  }, [collapsed, fetchedAt]);

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      if (!next && !hasLoaded) fetchAnalysis();
    }
    if (collapsed && !hasLoaded) {
      fetchAnalysis();
    }
  };

  const countdownMin = Math.floor(countdown / 60);
  const countdownSec = countdown % 60;

  return (
    <div className="border-t border-border">
      <div className="px-3 py-1.5 flex items-center justify-between">
        <button onClick={handleToggle} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            AI Analysis
          </span>
          {collapsed ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
        </button>

        {!collapsed && hasLoaded && (
          <div className="flex items-center gap-2">
            {/* Cached badge + timestamp */}
            {fetchedAt && (
              <div className="flex items-center gap-1">
                {wasCached && (
                  <span className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    cached
                  </span>
                )}
                <span className="text-[9px] text-muted-foreground tabular-nums">
                  {formatTimeAgo(fetchedAt)}
                </span>
              </div>
            )}
            {/* Countdown */}
            <div className="flex items-center gap-0.5 text-[9px] text-muted-foreground tabular-nums">
              <Clock className="w-2.5 h-2.5" />
              {countdownMin}:{countdownSec.toString().padStart(2, "0")}
            </div>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => fetchAnalysis(true)} disabled={isLoading}>
              <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pb-2">
          {isLoading && !analysis ? (
            <div className="flex items-center gap-2 py-3 justify-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span className="text-[10px] text-muted-foreground">Analyzing {asset} {timeframe} market…</span>
            </div>
          ) : analysis ? (
            <div className="space-y-2">
              <div className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-line bg-muted/30 rounded-md p-2.5">
                {analysis}
              </div>
              <p className="text-[9px] text-muted-foreground/60 italic text-center px-2">
                ⚠️ AI analysis is for informational purposes only and may be inaccurate. Not financial advice — always do your own research.
              </p>
            </div>
          ) : (
            <div className="text-[10px] text-muted-foreground text-center py-2">
              Click to generate AI analysis
            </div>
          )}
        </div>
      )}
    </div>
  );
}
