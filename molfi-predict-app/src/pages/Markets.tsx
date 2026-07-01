import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { CoinbaseMarketCard } from "@/components/markets/CoinbaseMarketCard";
import { ConsensusWidget } from "@/components/ConsensusWidget";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
const TIMEFRAMES = ["hourly", "daily"] as const;

function buildOrderedList() {
  const list: { asset: string; timeframe: "hourly" | "daily" }[] = [];
  for (const tf of TIMEFRAMES) {
    for (const asset of ASSETS) {
      list.push({ asset, timeframe: tf });
    }
  }
  return list;
}

const ORDERED_MARKETS = buildOrderedList();

const Markets = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SEO title="Markets | Molfi" description="Trade prediction markets on crypto majors with real-time data." />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
                <p className="text-sm text-muted-foreground mt-1">Curated crypto prediction markets</p>
              </div>
              <Link to="/markets-plus">
                <Button variant="outline" size="sm" className="gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Markets+
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ORDERED_MARKETS.map(({ asset, timeframe }) => (
                <CoinbaseMarketCard
                  key={`${asset}-${timeframe}`}
                  asset={asset}
                  timeframe={timeframe}
                  onClick={() => navigate(`/markets/${asset}-${timeframe}`)}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Consensus Probability
              </h2>
              <ConsensusWidget />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Markets;
