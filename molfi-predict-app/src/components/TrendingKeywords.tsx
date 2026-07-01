import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { useTrendingKeywords } from "@/hooks/useTrendingKeywords";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";

export function TrendingKeywords() {
  const { keywords, isLoading, error } = useTrendingKeywords(10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error || !keywords.length) {
    return null;
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "bearish":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Trending Topics
          <Badge variant="outline" className="ml-auto text-xs">
            AI-Generated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {canScrollLeft && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {keywords.map((keyword, index) => (
              <Link
                key={keyword.keyword}
                to={`/search?q=${encodeURIComponent(keyword.keyword)}`}
                className="block"
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group min-w-[280px] p-3 rounded-lg bg-card border hover:border-primary/50 transition-all cursor-pointer flex-shrink-0"
                >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getSentimentIcon(keyword.sentiment)}
                    <span className="font-medium text-sm line-clamp-1">
                      {keyword.keyword}
                    </span>
                  </div>
                  <Badge className={getSentimentColor(keyword.sentiment)}>
                    {keyword.category}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{keyword.marketCount} markets</span>
                  {keyword.totalVolume > 0 && (
                    <span>${(keyword.totalVolume / 1000).toFixed(1)}K volume</span>
                  )}
                </div>

                {keyword.relatedKeywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {keyword.relatedKeywords.slice(0, 3).map((related) => (
                      <Badge
                        key={related}
                        variant="outline"
                        className="text-xs py-0 px-2"
                      >
                        {related}
                      </Badge>
                    ))}
                  </div>
                 )}
               </motion.div>
              </Link>
            ))}
          </div>

          {canScrollRight && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
