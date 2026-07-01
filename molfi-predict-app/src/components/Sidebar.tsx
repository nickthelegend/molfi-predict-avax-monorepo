import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Star, ArrowRight } from "lucide-react";

const Sidebar = () => {
  return (
    <div className="space-y-4">
      {/* Portfolio Card */}
      <Card className="p-4 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-card-foreground">Portfolio</h3>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            Deposit <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Deposit some cash to start betting
        </p>
      </Card>

      {/* Watchlist Card */}
      <Card className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-card-foreground">Watchlist</h3>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            Trending <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Click the star on any market to add it to your watchlist
        </p>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-card-foreground">Recent Activity</h3>
          <Button variant="ghost" size="sm" className="text-xs">
            See all
          </Button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-cyan rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-card-foreground truncate">Will the Chiefs win AFC championship?</p>
              <p className="text-muted-foreground text-xs">
                <span className="text-success">Yes</span> at 58¢ $24.43
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-purple rounded-full flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <p className="text-card-foreground truncate">Will Elon tweet 600 to 624 times Jan 3-Jan 10?</p>
              <p className="text-muted-foreground text-xs">
                <span className="text-success">Yes</span> at 1¢ $24.43
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Sidebar;
