import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Bot, Clock } from "lucide-react";
import { getCategoryIcon } from "@/lib/category-icons";
import { useState } from "react";
import { TradingModal } from "./TradingModal";
import { CreatePriceAlertModal } from "./CreatePriceAlertModal";
import { MarketAnalysisChat } from "./MarketAnalysisChat";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/useCountdown";
import { BinaryProbabilityBar } from "./BinaryProbabilityBar";

/** Safely render a probability integer; returns "—" for undefined/NaN/Infinity. */
function safeProb(value: number | undefined): string {
  if (value === undefined || value === null) return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!isFinite(n) || isNaN(n)) {
    console.warn("[MarketCard] Received invalid probability value:", value);
    return "—";
  }
  return String(Math.round(Math.min(100, Math.max(0, n))));
}

interface MarketCardProps {
  id?: string;
  title: string;
  image?: string;
  imageUrl?: string;
  yesPercentage: number;
  noPercentage: number;
  volume?: string;
  totalVolume?: number;
  comments?: number;
  venue?: string;
  isNew?: boolean;
  animationsEnabled?: boolean;
  endDate?: string;
}

const MarketCard = ({ 
  id = "1",
  title, 
  image,
  imageUrl,
  yesPercentage, 
  noPercentage,
  volume,
  totalVolume,
  comments,
  venue = "Polymarket",
  isNew = false,
  animationsEnabled = false,
  endDate
}: MarketCardProps) => {
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [analysisChatOpen, setAnalysisChatOpen] = useState(false);
  
  const displayImage = imageUrl || image;
  const displayVolume = totalVolume !== undefined && totalVolume !== null
    ? formatVolume(totalVolume)
    : volume || "0.00";

  const timeLeft = endDate ? useCountdown(endDate) : null;

  const formatCountdown = () => {
    if (!timeLeft) return null;
    if (timeLeft.isExpired) return "Expired";
    
    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h`;
    } else if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m`;
    } else {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    }
  };

  const handleYesBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingModalOpen(true);
  };

  const handleNoBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingModalOpen(true);
  };

  const handleCreateAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertModalOpen(true);
  };

  const market = { id, title, yesPercentage, noPercentage, volume: displayVolume };

  return (
    <>
      <TooltipProvider>
        <Card className="p-5 transition-colors duration-150 hover:border-warning/50 bg-card flex flex-col h-full border border-border">
          {/* Header: Image + Title */}
          <div className="flex gap-3 mb-4">
            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
              {displayImage ? (
                <img src={displayImage} alt="" className="w-full h-full object-cover" />
              ) : (() => {
                const Icon = getCategoryIcon(undefined, title);
                return (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                );
              })()}
            </div>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-foreground line-clamp-2 flex-1 text-sm leading-snug hover:text-warning transition-colors duration-150">
                  {title}
                </h3>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-sm z-50">
                <p className="text-sm">{title}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Probability Display */}
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleYesBet}
                className="text-center p-3 rounded-md bg-success/10 hover:bg-success/20 transition-colors duration-150 border border-success/20"
              >
                <div className="text-2xl font-bold text-success">{safeProb(yesPercentage)}%</div>
                <div className="text-xs font-medium text-success/80 uppercase tracking-wide">Yes</div>
              </button>

              <button 
                onClick={handleNoBet}
                className="text-center p-3 rounded-md bg-destructive/10 hover:bg-destructive/20 transition-colors duration-150 border border-destructive/20"
              >
                <div className="text-2xl font-bold text-destructive">{safeProb(noPercentage)}%</div>
                <div className="text-xs font-medium text-destructive/80 uppercase tracking-wide">No</div>
              </button>
            </div>
            <BinaryProbabilityBar yesProb={yesPercentage} size="sm" />
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4 flex-1 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-wide">Volume</span>
              <span className="font-medium text-foreground">${displayVolume}</span>
            </div>
            {timeLeft && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1 text-xs uppercase tracking-wide">
                  <Clock className="w-3 h-3" />
                  Closes
                </span>
                <span className={`font-medium ${timeLeft.isExpired ? 'text-destructive' : 'text-foreground'}`}>
                  {formatCountdown()}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnalysisChatOpen(true);
                    }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-warning transition-colors duration-150 px-2 py-1 rounded"
                  >
                    <Bot className="w-3 h-3" />
                    <span>AI</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Get AI market analysis</TooltipContent>
              </Tooltip>

              <Badge variant="secondary" className="text-xs font-medium">
                {venue}
              </Badge>
              {isNew && (
                <Badge variant="outline" className="text-xs text-warning border-warning/30">
                  New
                </Badge>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCreateAlert}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-warning transition-colors duration-150"
                >
                  <Bell className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Set price alert</TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </TooltipProvider>

      <TradingModal
        open={tradingModalOpen}
        onOpenChange={setTradingModalOpen}
        market={market}
      />

      <CreatePriceAlertModal
        open={alertModalOpen}
        onOpenChange={setAlertModalOpen}
        marketId={id}
        marketTitle={title}
        currentPrice={yesPercentage}
      />

      <MarketAnalysisChat
        open={analysisChatOpen}
        onClose={() => setAnalysisChatOpen(false)}
        marketId={id}
        marketTitle={title}
        yesPercentage={yesPercentage}
        noPercentage={noPercentage}
        volume={displayVolume}
      />
    </>
  );
};

function formatVolume(volume: number): string {
  if (volume === 0) {
    return "0";
  }
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toFixed(2);
}

export default MarketCard;
