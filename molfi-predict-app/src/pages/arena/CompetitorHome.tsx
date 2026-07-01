import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMolfiWallet } from "@/contexts/MolfiWalletContext";
import { GMX_CONFIG } from "@/config/gmx";
import type { ArenaWallet } from "@/types/molfi-wallet";

// Terminal components
import Header from "@/components/Header";
import { MarketInfoBar } from "@/components/arena/trading/MarketInfoBar";
import { TradingChart } from "@/components/arena/trading/TradingChart";
import { GmxOrderPanel } from "@/components/arena/trading/GmxOrderPanel";
import { OrderBook } from "@/components/arena/trading/OrderBook";
import { PositionsTable } from "@/components/arena/trading/PositionsTable";
import { OrderHistory } from "@/components/arena/trading/OrderHistory";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import { 
  Trophy, 
  AlertTriangle,
  FlaskConical,
} from "lucide-react";

// Real-time GMX events
import { GmxEventNotifications } from "@/components/gmx/GmxEventNotifications";

// Dev fallback arena wallet
const DEV_FALLBACK_ARENA_WALLET: ArenaWallet = {
  address: "0xDEV_FALLBACK_ADDRESS",
  competitionId: "dev-competition-1",
  competitionNumber: 0,
  balance: 100,
  equity: 100,
  roi: 0,
  rank: 1,
  initialDeposit: 100,
  depositsLocked: false,
  isForfeited: false,
  status: 'ACTIVE',
};

// Always allow sandbox mode when no real competition is active
const ENABLE_SANDBOX_MODE = true;

export default function CompetitorHome() {
  const { currentArenaWallet: realArenaWallet, connectedWallet } = useMolfiWallet();
  
  // Use sandbox fallback when no real arena wallet is available
  const isUsingSandbox = !realArenaWallet && ENABLE_SANDBOX_MODE;
  const currentArenaWallet = realArenaWallet ?? (ENABLE_SANDBOX_MODE ? DEV_FALLBACK_ARENA_WALLET : null);

  const [selectedMarket, setSelectedMarket] = useState<string | null>(
    GMX_CONFIG.markets.BTC_USD.address
  );
  const [activeTab, setActiveTab] = useState("positions");
  const [showChartPositions, setShowChartPositions] = useState(true);
  const [positionsKey, setPositionsKey] = useState(0); // Force refresh positions

  // Forfeited wallet
  if (currentArenaWallet.isForfeited) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <SEO title="Competition Forfeited | Arena" />
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Competition Forfeited</h2>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          You have withdrawn from Competition #{currentArenaWallet.competitionNumber}. 
          Your funds have been returned to your wallet.
        </p>
        <Button variant="outline" asChild>
          <a href="/arena">View Other Competitions</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0e1118] overflow-hidden">
      <SEO title="Trading Terminal | Arena" />
      
      {/* Real-time GMX Event Notifications */}
      <GmxEventNotifications
        userAddress={currentArenaWallet.address}
        onOrderExecuted={() => {
          console.log('[Arena] Order executed, refreshing positions...');
          setPositionsKey(prev => prev + 1);
        }}
        onPositionChange={() => {
          console.log('[Arena] Position changed, refreshing...');
          setPositionsKey(prev => prev + 1);
        }}
        enabled={!isUsingSandbox} // Only enable for real competition
      />
      
      {/* Unified Header */}
      <Header />

      {/* Arena Banner */}
      <div className="h-9 bg-[#16182a] border-b border-[#2a2e37] flex items-center px-4">
        <div className="flex items-center gap-2 text-[#787b86]">
          <span className="text-xs">🏆 Molfi Arena — Season 0 Coming Soon</span>
        </div>
        <div className="flex-1" />
      </div>

      {/* Market Info Bar */}
      <MarketInfoBar 
        selectedMarket={selectedMarket}
        onSelectMarket={setSelectedMarket}
      />

      {/* Sandbox Mode Banner */}
      {isUsingSandbox && (
        <div className="flex-shrink-0 bg-warning/10 border-b border-warning/30 px-4 py-1 flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-warning" />
          <span className="text-[10px] uppercase tracking-wide text-warning font-medium">
            SANDBOX MODE — Practice Terminal — No real trades
          </span>
        </div>
      )}

      {/* Main Terminal Grid - GMX Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chart + Orderbook Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chart Toolbar Tabs */}
          <div className="flex-shrink-0 h-9 bg-[#131722] border-b border-[#2a2e37] flex items-center px-2">
            <button className={cn(
              "h-full px-4 text-xs font-medium border-b-2 transition-colors",
              "text-white border-[#2962ff]"
            )}>
              Price
            </button>
            <button className="h-full px-4 text-xs font-medium text-[#787b86] hover:text-white border-b-2 border-transparent">
              Depth
            </button>
          </div>

          {/* Chart Area */}
          <div className="flex-1 flex min-h-0">
            {/* Main Chart */}
            <div className="flex-1 min-w-0">
              <TradingChart marketAddress={selectedMarket} />
            </div>
            
            {/* Order Book - Right side */}
            <div className="w-[220px] border-l border-[#2a2e37] hidden xl:block">
              <OrderBook marketAddress={selectedMarket} />
            </div>
          </div>

          {/* Bottom: Positions/Orders/Trades */}
          <div className="flex-shrink-0 h-[200px] border-t border-[#2a2e37] bg-[#131722]">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex-shrink-0 h-9 px-2 border-b border-[#2a2e37] flex items-center justify-between">
                <TabsList className="h-full bg-transparent p-0 gap-0">
                  <TabsTrigger 
                    value="positions" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2962ff] rounded-none px-4 h-full text-xs text-[#787b86]"
                  >
                    Positions <span className="ml-1 text-[#787b86]">0</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2962ff] rounded-none px-4 h-full text-xs text-[#787b86]"
                  >
                    Orders
                  </TabsTrigger>
                  <TabsTrigger 
                    value="trades" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2962ff] rounded-none px-4 h-full text-xs text-[#787b86]"
                  >
                    Trades
                  </TabsTrigger>
                  <TabsTrigger 
                    value="claims" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#2962ff] rounded-none px-4 h-full text-xs text-[#787b86]"
                  >
                    Claims
                  </TabsTrigger>
                </TabsList>
               
                {/* Chart positions checkbox */}
                <label className="flex items-center gap-2 text-xs text-[#787b86] cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={showChartPositions}
                    onChange={(e) => setShowChartPositions(e.target.checked)}
                    className="w-4 h-4 accent-[#2962ff]"
                  />
                  Chart positions
                </label>
              </div>

              <TabsContent value="positions" className="flex-1 m-0 overflow-auto">
                <PositionsTable arenaWalletAddress={currentArenaWallet.address} compact />
              </TabsContent>

              <TabsContent value="orders" className="flex-1 m-0 overflow-auto">
                <OrderHistory arenaWalletAddress={currentArenaWallet.address} />
              </TabsContent>

              <TabsContent value="trades" className="flex-1 m-0 overflow-auto p-4">
                <div className="text-xs text-[#787b86] text-center py-8">
                  No trades yet
                </div>
              </TabsContent>

              <TabsContent value="claims" className="flex-1 m-0 overflow-auto p-4">
                <div className="text-xs text-[#787b86] text-center py-8">
                  No claims available
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right: Order Panel - GMX Style */}
        <div className="w-[320px] border-l border-[#2a2e37] flex-shrink-0 overflow-hidden">
          <GmxOrderPanel selectedMarket={selectedMarket} />
        </div>
      </div>
    </div>
  );
}
