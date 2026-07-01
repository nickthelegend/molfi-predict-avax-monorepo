import { useState, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingSpinner } from "./LoadingSpinner";
import MarketCard from "./MarketCard";
import { useMolfiSearch } from "@/hooks/useMolfiSearch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MarketSearchProps {
  open: boolean;
  onClose: () => void;
}

export const MarketSearch = ({ open, onClose }: MarketSearchProps) => {
  const [query, setQuery] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const { results, isLoading, search, clear } = useMolfiSearch({
    status: showClosed ? undefined : 'active',
    limit: 20,
  });

  useEffect(() => {
    const debounce = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      search(debouncedQuery);
    } else {
      clear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, showClosed]);

  const displayResults = useMemo(() => 
    results.slice(0, 9).map((market, idx) => {
      const yesPercentage = Math.round(market.yes_price ?? 50);
      const noPercentage = Math.round(market.no_price ?? 50);
      const volumeUSD = (market.volume_total || 0) / 1000000;

      return {
        id: market.id,
        stableKey: `${market.id}-${market.status}-${idx}`,
        title: market.title,
        yesPercentage,
        noPercentage,
        totalVolume: volumeUSD,
        venue: market.venue?.toUpperCase() ?? 'MOLFI',
        imageUrl: market.image_url ?? undefined,
        category: market.category,
      };
    }), [results]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden bg-background/95 backdrop-blur-xl border-2 border-primary/20">
        <div className="space-y-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search markets by title, description, or tags..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-lg border-2"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 px-1">
            <Switch
              id="show-closed"
              checked={showClosed}
              onCheckedChange={setShowClosed}
            />
            <Label htmlFor="show-closed" className="text-sm cursor-pointer">
              Include closed & settled markets
            </Label>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(85vh-140px)] pr-2">
          {isLoading && (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {!isLoading && !debouncedQuery && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start typing to search markets</p>
            </div>
          )}

          {!isLoading && debouncedQuery && displayResults.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Found {results.length} markets (showing top 9)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {displayResults.map((market) => (
                  <div key={market.stableKey} className="scale-90 origin-top">
                    <MarketCard 
                      {...market}
                      id={market.id}
                      animationsEnabled={false}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {!isLoading && debouncedQuery && displayResults.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No markets found for "{debouncedQuery}"</p>
              <p className="text-sm mt-2">Try different keywords or check if the market is closed</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
