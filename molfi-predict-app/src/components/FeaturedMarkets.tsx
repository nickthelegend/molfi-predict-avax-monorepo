import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Star } from "lucide-react";
import { Link } from "react-router-dom";

const FeaturedMarkets = () => {
  return (
    <div className="px-3 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* NFL Playoffs Card */}
        <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">NFL Playoffs</h3>
            <p className="opacity-90 mb-4">Super Wildcard Weekend is here!</p>
            <Link to="/games">
              <Button variant="secondary" size="sm" className="gap-2">
                Games <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-48 h-48 opacity-20">
            <div className="w-full h-full bg-primary-foreground rounded-full"></div>
          </div>
        </div>

        {/* New Year's Predictions Card */}
        <div className="bg-gradient-to-br from-accent to-accent/70 rounded-2xl p-6 text-accent-foreground relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">New Year's predictions</h3>
            <p className="opacity-90 mb-4">What's in store for '25?</p>
            <Link to="/markets">
              <Button variant="secondary" size="sm" className="gap-2">
                Markets <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-30">
            2026
          </div>
        </div>

        {/* Trending Card */}
        <div className="bg-gradient-to-br from-success to-success/70 rounded-2xl p-6 text-success-foreground relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-2">Crypto Markets</h3>
            <p className="opacity-90 mb-4">Track price predictions & more!</p>
            <Link to="/dashboard">
              <Button variant="secondary" size="sm" className="gap-2">
                Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <TrendingUp className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 opacity-20" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedMarkets;
