import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import MarketCard from "@/components/MarketCard";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { useInfiniteMarkets } from "@/hooks/useInfiniteMarkets";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Dashboard = () => {
  const [animationsEnabled] = useState(true);
  
  const initialMarkets = [
    {
      title: "Bitcoin above $100K by March 2026?",
      yesPercentage: 67,
      noPercentage: 33,
      volume: "5.2M",
      comments: 412,
      venue: "Polymarket",
      isNew: true,
    },
    {
      title: "Ethereum ETF approval in Q1 2026?",
      yesPercentage: 52,
      noPercentage: 48,
      volume: "3.8M",
      comments: 298,
      venue: "Polymarket",
    },
    {
      title: "Solana to flip BNB by market cap?",
      yesPercentage: 44,
      noPercentage: 56,
      volume: "2.9M",
      comments: 176,
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
        <h1 className="text-3xl font-bold mb-6">Crypto Markets Dashboard</h1>
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">BTC Prediction</p>
                <p className="text-2xl font-bold">67% Yes</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ETH Prediction</p>
                <p className="text-2xl font-bold">52% Yes</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">SOL Prediction</p>
                <p className="text-2xl font-bold">44% Yes</p>
              </div>
              <TrendingDown className="w-8 h-8 text-destructive" />
            </div>
          </Card>
        </div>

        {/* Market Cards */}
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

export default Dashboard;
