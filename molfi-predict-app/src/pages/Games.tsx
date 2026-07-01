import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketCard from "@/components/MarketCard";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteMarkets } from "@/hooks/useInfiniteMarkets";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Games = () => {
  const [animationsEnabled] = useState(true);
  
  const initialMarkets = [
    {
      title: "Kansas City Chiefs to win AFC Championship?",
      yesPercentage: 72,
      noPercentage: 28,
      volume: "3.2M",
      comments: 189,
      venue: "Polymarket",
    },
    {
      title: "San Francisco 49ers to reach Super Bowl?",
      yesPercentage: 65,
      noPercentage: 35,
      volume: "2.8M",
      comments: 156,
      venue: "Polymarket",
    },
    {
      title: "Baltimore Ravens over/under 11.5 wins?",
      yesPercentage: 58,
      noPercentage: 42,
      volume: "1.9M",
      comments: 98,
      venue: "Polymarket",
    },
  ];

  const { markets, hasMore, loadMore } = useInfiniteMarkets({
    initialMarkets,
    batchSize: 20,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav />
      
      <div className="px-3 py-6">
        <h1 className="text-3xl font-bold mb-6">NFL Playoffs Markets</h1>
        <InfiniteScroll
          dataLength={markets.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          }
          endMessage={
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No more markets to load</p>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {markets.map((market, index) => (
              <MarketCard key={index} {...market} animationsEnabled={animationsEnabled} />
            ))}
          </div>
        </InfiniteScroll>
      </div>

      <Footer />
    </div>
  );
};

export default Games;
