import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircle, TrendingUp, Bell, Bot, Heart, Share2, AlertCircle, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { TradingModal } from "./TradingModal";
import { CreatePriceAlertModal } from "./CreatePriceAlertModal";
import { MarketAnalysisChat } from "./MarketAnalysisChat";
import { ShareButton } from "./ShareButton";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { AnimatedButton } from "./AnimatedButton";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCountdown } from "@/hooks/useCountdown";
import { Sparkline } from "./Sparkline";
import { useMarketSparkline } from "@/hooks/useMarketSparkline";
import { getVenueDisplayName, getVenueImage } from "@/lib/venue-utils";

interface SwipeableMarketCardProps {
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

function formatVolume(volume: number): string {
  if (volume === 0) {
    return "$0.00 USD";
  }
  if (volume >= 1000000) {
    return `$${(volume / 1000000).toFixed(1)}M USD`;
  } else if (volume >= 1000) {
    return `$${(volume / 1000).toFixed(1)}k USD`;
  } else {
    return `$${volume.toFixed(2)} USD`;
  }
}

export function SwipeableMarketCard({ 
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
  animationsEnabled = true,
  endDate
}: SwipeableMarketCardProps) {
  const [tradingModalOpen, setTradingModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [analysisChatOpen, setAnalysisChatOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const displayImage = imageUrl || image;
  const displayVolume = totalVolume !== undefined && totalVolume !== null
    ? formatVolume(totalVolume)
    : volume || "$0.00 USD";
  const venueDisplayName = getVenueDisplayName(venue);
  const venueLogo = getVenueImage(venue);

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

  // Get real sparkline data from API
  const { data: sparklineData } = useMarketSparkline(id || '', venue);

  // Swipe gesture state
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-150, 0],
    ["rgba(239, 68, 68, 0.2)", "rgba(0, 0, 0, 0)"]
  );

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (!isMobile) return;
    
    // If swiped left more than 100px, show actions briefly then reset
    if (info.offset.x < -100) {
      // Actions are visible, user can tap them
      // Card will snap back after a delay
      setTimeout(() => {
        x.set(0);
      }, 3000);
    } else {
      x.set(0);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    x.set(0);
  };

  const handleAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertModalOpen(true);
    x.set(0);
  };

  const handleYesBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingModalOpen(true);
  };

  const handleNoBet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTradingModalOpen(true);
  };

  const market = { id, title, yesPercentage, noPercentage, volume: displayVolume };

  return (
    <>
      <TooltipProvider>
        <div className="relative market-card-container overflow-hidden rounded-3xl">
          {/* Action buttons behind the card (revealed on swipe) */}
          {isMobile && (
            <motion.div 
              className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4 z-0"
              style={{ background }}
            >
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleFavorite}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                  isFavorited ? "bg-red-500 text-white" : "bg-card text-foreground"
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Simple share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: title,
                      text: `Check out this market on Molfi!`,
                      url: window.location.href,
                    });
                  } else {
                    toast.success("Link copied to clipboard!");
                    navigator.clipboard.writeText(window.location.href);
                  }
                  x.set(0);
                }}
                className="w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-lg"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAlert}
                className="w-12 h-12 rounded-full bg-card flex items-center justify-center shadow-lg"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Main card (swipeable on mobile) */}
          <motion.div
            style={isMobile ? { x } : {}}
            drag={isMobile ? "x" : false}
            dragConstraints={{ left: -150, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={animationsEnabled ? { opacity: 0, y: 20 } : {}}
            animate={animationsEnabled ? { opacity: 1, y: 0 } : {}}
            whileHover={!isMobile && animationsEnabled ? { y: -4 } : {}}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow p-6 flex flex-col h-full rounded-3xl border-2 border-border">
              {/* Image and Title */}
              <div className="flex gap-3 mb-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-primary/10 shadow-md">
                  {displayImage ? (
                    <img src={displayImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary">
                      <MessageCircle className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/markets/${id}`)}>
                  <h3 className="font-bold text-foreground line-clamp-2 text-lg hover:underline">{title}</h3>
                </div>
              </div>

              {/* Badges & Meta */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs font-semibold rounded-full px-3 py-1 shadow-sm">
                  {venueDisplayName}
                </Badge>
                {isNew && (
                  <Badge className="text-xs font-semibold rounded-full px-3 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md animate-pulse">
                    NEW
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">•</span>
                {timeLeft && (
                  <span className={`text-xs font-medium ${timeLeft.isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {timeLeft.isExpired ? 'Expired' : formatCountdown()}
                  </span>
                )}
              </div>

              {/* Price Display - 2 Outcomes Style */}
              <div className="space-y-2 mb-4">
                {/* YES Outcome */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">YES</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                        style={{ width: `${yesPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem] text-right">
                      ${(yesPercentage / 100).toFixed(3)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleYesBet}
                    className="min-w-[70px] flex flex-col items-center py-1 h-auto"
                  >
                    <span className="text-[10px] font-bold">YES</span>
                    <span className="text-xs font-semibold">${(yesPercentage / 100).toFixed(3)}</span>
                  </Button>
                </div>

                {/* NO Outcome */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">NO</p>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60"
                        style={{ width: `${noPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[3rem] text-right">
                      ${(noPercentage / 100).toFixed(3)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleNoBet}
                    className="min-w-[70px] flex flex-col items-center py-1 h-auto"
                  >
                    <span className="text-[10px] font-bold">NO</span>
                    <span className="text-xs font-semibold">${(noPercentage / 100).toFixed(3)}</span>
                  </Button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t">
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium">{comments || 0}</span>
                </div>
                <div className="font-semibold text-primary">{displayVolume}</div>
              </div>

              {/* AI Chat Bot Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalysisChatOpen(true);
                }}
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              >
                <Bot className="w-5 h-5 text-white" />
              </motion.button>

              {/* Swipe indicator for mobile */}
              {isMobile && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground/50 flex items-center gap-1">
                  <span>←</span> Swipe for actions
                </div>
              )}
            </Card>
          </motion.div>
        </div>
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
}
