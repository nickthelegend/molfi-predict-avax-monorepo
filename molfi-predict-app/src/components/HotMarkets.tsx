import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMolfiMarkets } from "@/hooks/useMolfiMarkets";
import MarketCard from "@/components/MarketCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Flame } from "lucide-react";
import { useMemo } from "react";

export const HotMarkets = () => {
  const { markets, isLoading } = useMolfiMarkets({
    status: 'active',
    limit: 50,
    autoLoad: true,
  });

  const displayMarkets = useMemo(() => {
    const normalized = markets.map((market, idx) => {
      const yesPercentage = Math.round(market.yes_price ?? 50);
      const noPercentage = Math.round(market.no_price ?? 50);
      const volumeUSD = (market.volume_total || 0) / 1000000;

      return {
        id: market.id,
        uniqueKey: `hot-${market.id}-${idx}`,
        title: market.title,
        yesPercentage,
        noPercentage,
        totalVolume: volumeUSD,
        venue: market.venue?.toUpperCase() ?? 'MOLFI',
        imageUrl: market.image_url ?? undefined,
        category: market.category,
      };
    });

    return normalized
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 6);
  }, [markets]);

  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Hot Markets 🔥
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          Hot Markets 🔥
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Highest volume markets right now
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMarkets.map((market) => (
            <MarketCard key={market.uniqueKey} {...market} animationsEnabled={false} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
