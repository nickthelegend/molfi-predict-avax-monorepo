import { Bot, Clock, Layers } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { motion } from "framer-motion";
import { BinaryProbabilityBar } from "./BinaryProbabilityBar";
import { useState, useMemo } from "react";
import { MarketExpandedModal } from "./MarketExpandedModal";
import { MarketAnalysisChat } from "./MarketAnalysisChat";
import { Sparkline } from "./Sparkline";
import { useMarketSparkline } from "@/hooks/useMarketSparkline";
import { getVenueDisplayName } from "@/lib/venue-utils";

export interface MarketOutcome {
  label: string;
  probability: number;
}

interface MinimalMarketCardProps {
  id: string;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  totalVolume?: number;
  liquidity?: number;
  volume?: string;
  venue?: string;
  imageUrl?: string;
  endDate?: string;
  description?: string;
  animationsEnabled?: boolean;
  marketType?: "binary" | "multi_outcome";
  outcomes?: MarketOutcome[];
  isResolved?: boolean;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}mn`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(1)}k`;
  if (volume > 0) return `$${volume.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return "$0";
}

function formatTimeLeft(endDate: string): { text: string; urgent: boolean } | null {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  if (isNaN(end)) return null;
  const diff = end - now;
  if (diff <= 0) return { text: "Ended", urgent: false };

  const hours = diff / (1000 * 60 * 60);
  if (hours < 1) {
    const mins = Math.floor(diff / (1000 * 60));
    return { text: `${mins}m left`, urgent: true };
  }
  if (hours < 24) return { text: `${Math.floor(hours)}h left`, urgent: true };
  const days = Math.floor(hours / 24);
  if (days < 30) return { text: `${days}d left`, urgent: false };
  const months = Math.floor(days / 30);
  return { text: `${months}mo left`, urgent: false };
}

export function MinimalMarketCard({
  id,
  title,
  yesPercentage,
  noPercentage,
  totalVolume,
  liquidity,
  volume,
  venue = "molfi",
  imageUrl,
  endDate,
  description,
  animationsEnabled = true,
  marketType = "binary",
  outcomes,
  isResolved = false,
}: MinimalMarketCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Show volume if > 0, otherwise show liquidity
  const effectiveVolume = (totalVolume && totalVolume > 0) ? totalVolume : (liquidity || 0);
  const displayVolume = effectiveVolume > 0 ? formatVolume(effectiveVolume) : (volume || "$0");

  const venueLabel = getVenueDisplayName(venue);
  const isMultiOutcome = marketType === "multi_outcome" && outcomes && outcomes.length > 2;

  const { data: sparklineData } = useMarketSparkline(id, venue);

  const timeLeft = useMemo(() => (endDate ? formatTimeLeft(endDate) : null), [endDate]);

  // Multi-outcome: top 2 sorted by probability
  const topOutcomes = useMemo(() => {
    if (!isMultiOutcome || !outcomes) return [];
    return [...outcomes].sort((a, b) => b.probability - a.probability).slice(0, 2);
  }, [isMultiOutcome, outcomes]);

  const outcomeCount = outcomes?.length ?? 0;

  return (
    <>
      <motion.div
        initial={animationsEnabled ? { opacity: 0, y: 12 } : {}}
        animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
        whileHover={animationsEnabled ? { y: -2 } : {}}
        transition={{ duration: 0.18 }}
        onClick={() => setModalOpen(true)}
        className={`relative group cursor-pointer rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col h-full ${isResolved ? 'opacity-60' : ''}`}
      >
        {/* Ended badge overlay */}
        {isResolved && (
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              Ended
            </span>
          </div>
        )}

        {/* AI Analysis icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setAiChatOpen(true);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity hover:bg-primary/20 z-10"
          aria-label="AI Analysis"
        >
          <Bot className="w-4 h-4" />
        </button>

        {/* Image + Question */}
        <div className="flex gap-3 mb-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (() => {
              const FallbackIcon = getCategoryIcon(undefined, title);
              return (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <FallbackIcon className="w-5 h-5" />
                </div>
              );
            })()}
          </div>
          <h3 className="font-semibold text-foreground text-[15px] leading-snug pr-8 line-clamp-3 flex-1 min-w-0">
            {title}
          </h3>
        </div>

        {/* Expiry countdown */}
        {timeLeft && (
          <div className="mb-3 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                timeLeft.urgent
                  ? "bg-red-500/15 text-red-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Clock className="w-3 h-3" />
              {timeLeft.text}
            </span>
          </div>
        )}

        {/* Market type content — fills available space */}
        <div className="mb-3 flex-1 flex flex-col justify-end">
          {isMultiOutcome ? (
            /* ── Multi-outcome: top outcomes list (NO bar) ── */
            <div className="space-y-2">
              {topOutcomes.map((o, i) => (
                <div key={o.label} className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium truncate flex-1 ${
                      i === 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {o.label}
                  </span>
                  <span
                    className={`text-sm font-bold tabular-nums ${
                      i === 0 ? "text-emerald-500" : "text-muted-foreground"
                    }`}
                  >
                    {Number(o.probability.toFixed(1))}%
                  </span>
                </div>
              ))}
              {/* Outcome count badge */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Layers className="w-3 h-3" />
                <span>{outcomeCount} outcomes</span>
              </div>
            </div>
          ) : (
            /* ── Binary: YES/NO bar ── */
            <BinaryProbabilityBar yesProb={yesPercentage} />
          )}
        </div>

        {/* Sparkline */}
        {sparklineData && sparklineData.length >= 2 && (
          <div className="mb-3 flex-shrink-0">
            <Sparkline data={sparklineData} width={200} height={20} strokeWidth={1.5} />
          </div>
        )}

        {/* Fixed footer: venue + volume */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border mt-auto flex-shrink-0">
          <span className="font-medium">{venueLabel}</span>
          <span className="font-semibold text-foreground/70">{displayVolume}</span>
        </div>
      </motion.div>

      <MarketExpandedModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        market={{
          id,
          title,
          description,
          yesPercentage,
          noPercentage,
          volume: displayVolume,
          venue: venueLabel,
          endDate,
          imageUrl,
          marketType: isMultiOutcome ? "multi_outcome" : "binary",
          outcomes,
        }}
      />

      <MarketAnalysisChat
        open={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        marketId={id}
        marketTitle={title}
        yesPercentage={yesPercentage}
        noPercentage={noPercentage}
        volume={displayVolume}
      />
    </>
  );
}
