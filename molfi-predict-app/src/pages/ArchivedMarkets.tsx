import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useMolfiMarkets } from "@/hooks/useMolfiMarkets";
import { MarketCardWrapper } from "@/components/MarketCardWrapper";
import { useMarketGroups } from "@/hooks/useMarketGroups";
import { Archive, Clock } from "lucide-react";

const ArchivedMarkets = () => {
  const { markets, isLoading } = useMolfiMarkets({
    status: 'resolved',
    limit: 50,
    autoLoad: true,
  });

  // Filter to show only markets that resolved in the last 24 hours
  const last24Hours = Date.now() - 24 * 60 * 60 * 1000;
  const recentlyExpiredMarkets = markets.filter((market) => {
    const resolvedAt = market.resolved_at || market.updated_at;
    if (!resolvedAt) return false;
    const time = new Date(resolvedAt).getTime();
    return time >= last24Hours && time <= Date.now();
  });

  const marketItems = useMarketGroups(recentlyExpiredMarkets);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO 
        title="Archived Markets | Recently Expired | Molfi"
        description="View prediction markets that expired in the last 24 hours. Check results and outcomes of recently closed markets."
      />
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Archive className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Archived Markets</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Markets that expired in the last 24 hours
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : marketItems.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold mb-2">No Recently Expired Markets</h3>
            <p className="text-muted-foreground">
              No markets have expired in the last 24 hours
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {marketItems.map((item) => (
              <MarketCardWrapper
                key={item.type === 'group' ? item.group.groupId : item.market.id}
                item={item}
                animationsEnabled={true}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ArchivedMarkets;
