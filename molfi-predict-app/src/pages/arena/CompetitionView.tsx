import { useState, useEffect } from "react";
import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { ArenaLeaderboard } from "@/components/arena/ArenaLeaderboard";
import { PositionRow } from "@/components/arena/PositionRow";
import { TradeLogRow } from "@/components/arena/TradeLogRow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { Clock, AlertTriangle, Copy, TrendingUp, Loader2 } from "lucide-react";
import { useArenaLeaderboard, type LeaderboardEntry } from "@/hooks/useArenaLeaderboard";
import { supabase } from "@/integrations/supabase/db";
import { useCountdown } from "@/hooks/useCountdown";

// Mock positions for selected trader
const mockPositions = [
  { asset: "BTC", side: "LONG" as const, size: 45.50, entryPrice: 42150, currentPrice: 43200, pnl: 1.13, pnlPercent: 2.49 },
  { asset: "ETH", side: "SHORT" as const, size: 25.00, entryPrice: 2680, currentPrice: 2650, pnl: 0.28, pnlPercent: 1.12 },
];

// Mock trade log
const mockTrades = [
  { timestamp: "14:32", asset: "BTC", action: "OPEN_LONG" as const, size: 45.50, price: 42150 },
  { timestamp: "12:15", asset: "ETH", action: "OPEN_SHORT" as const, size: 25.00, price: 2680 },
  { timestamp: "09:45", asset: "SOL", action: "CLOSE_LONG" as const, size: 30.00, price: 98.50, pnl: 4.25 },
];

interface Competition {
  id: string;
  competition_number: number;
  is_finale: boolean;
  status: string;
  competition_start: string;
  competition_end: string;
}

export default function CompetitionView() {
  const { id } = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loadingComp, setLoadingComp] = useState(true);
  const [selectedTrader, setSelectedTrader] = useState<LeaderboardEntry | null>(null);
  
  const { entries, loading: loadingLeaderboard } = useArenaLeaderboard(
    id ? { competitionId: id } : null
  );
  const countdown = useCountdown(competition?.competition_end || '');

  // Fetch competition details
  useEffect(() => {
    if (!id) return;
    
    const fetchCompetition = async () => {
      const { data, error } = await supabase
        .from('arena_competitions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setCompetition(data);
      }
      setLoadingComp(false);
    };

    fetchCompetition();
  }, [id]);

  // Auto-select first trader when leaderboard loads
  useEffect(() => {
    if (entries.length > 0 && !selectedTrader) {
      setSelectedTrader(entries[0]);
    }
  }, [entries, selectedTrader]);

  const handleTraderSelect = (entry: LeaderboardEntry) => {
    setSelectedTrader(entry);
  };

  if (loadingComp) {
    return (
      <ArenaLayout title="Loading... | Arena | Molfi" description="Loading competition">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </ArenaLayout>
    );
  }

  return (
    <ArenaLayout
      title={`Competition ${competition?.competition_number || id} | Arena | Molfi`}
      description="Live competition view. Watch traders compete in real-time."
    >
      {/* Competition Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold text-foreground">
              {competition?.is_finale ? 'Grand Finale' : `Competition ${competition?.competition_number || id}`}
            </h1>
            <Badge variant="outline" className={`text-[10px] uppercase tracking-wide ${
              competition?.status === 'LIVE' ? 'text-warning border-warning/30' : 'text-muted-foreground border-border'
            }`}>
              {competition?.status || 'UNKNOWN'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {competition?.competition_start && new Date(competition.competition_start).toLocaleDateString()} — {competition?.competition_end && new Date(competition.competition_end).toLocaleDateString()}
          </p>
        </div>
        {competition?.status === 'LIVE' && !countdown.isExpired && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-foreground font-medium">
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
            <span className="text-muted-foreground">remaining</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Real-time Leaderboard */}
        <div className="lg:col-span-4">
          <ArenaLeaderboard 
            competitionId={id || null} 
            onSelectTrader={handleTraderSelect}
            selectedWallet={selectedTrader?.wallet_address}
          />
        </div>

        {/* Center: Selected Trader Performance */}
        <div className="lg:col-span-5 space-y-4">
          {selectedTrader ? (
            <>
              <Card className="p-5 border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {selectedTrader.wallet_address.slice(0, 6)}...{selectedTrader.wallet_address.slice(-4)}
                    </h3>
                    <p className="text-xs text-muted-foreground">Rank #{selectedTrader.rank}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${
                    selectedTrader.status === "QUALIFIED" ? "text-success border-success/30" :
                    selectedTrader.status === "ELIMINATED" ? "text-destructive border-destructive/30" :
                    "text-muted-foreground border-border"
                  }`}>
                    {selectedTrader.status}
                  </Badge>
                </div>

                {/* Capital Indicator */}
                <div className="p-3 bg-muted rounded-md mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <AlertTriangle className="w-3 h-3" />
                    <span>LOCKED CAPITAL</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Starting</span>
                    <span className="text-sm font-semibold text-foreground">${selectedTrader.starting_capital.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-foreground">Current</span>
                    <span className={`text-sm font-semibold ${selectedTrader.current_balance >= selectedTrader.starting_capital ? 'text-success' : 'text-destructive'}`}>
                      ${selectedTrader.current_balance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ROI Display */}
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className={`text-4xl font-bold ${(selectedTrader.roi_percent || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {(selectedTrader.roi_percent || 0) >= 0 ? '+' : ''}{(selectedTrader.roi_percent || 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                      Return on Investment
                    </div>
                  </div>
                </div>
              </Card>

              {/* Positions */}
              <Card className="border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Open Positions ({selectedTrader.open_positions_count})
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border grid grid-cols-6 gap-2">
                  <span>Asset</span>
                  <span>Side</span>
                  <span>Size</span>
                  <span>Entry</span>
                  <span>Current</span>
                  <span className="text-right">PnL</span>
                </div>
                {mockPositions.map((pos, i) => (
                  <PositionRow key={i} {...pos} />
                ))}
              </Card>

              {/* Trade Log */}
              <Card className="border border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Trade Log ({selectedTrader.trade_count} trades)
                  </h3>
                </div>
                <div className="text-xs text-muted-foreground px-3 py-2 border-b border-border grid grid-cols-5 gap-2">
                  <span>Time</span>
                  <span>Asset</span>
                  <span>Action</span>
                  <span>Details</span>
                  <span className="text-right">PnL</span>
                </div>
                {mockTrades.map((trade, i) => (
                  <TradeLogRow key={i} {...trade} />
                ))}
              </Card>
            </>
          ) : (
            <Card className="p-8 border border-border text-center">
              <p className="text-sm text-muted-foreground">
                {loadingLeaderboard ? 'Loading...' : 'Select a trader to view performance'}
              </p>
            </Card>
          )}
        </div>

        {/* Right: Viewer Actions */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="p-4 border border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Viewer Actions
            </h3>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                size="sm"
                disabled={!selectedTrader}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copy Trade
              </Button>

              <Button 
                variant="outline" 
                className="w-full justify-start text-xs"
                size="sm"
                disabled={!selectedTrader}
              >
                <TrendingUp className="w-3 h-3 mr-2" />
                Trade on Performance
              </Button>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-md">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  Copy trading involves significant risk. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-border">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Trader Markets
            </h3>
            <p className="text-[10px] text-muted-foreground">
              Open prediction markets on this trader's performance coming soon.
            </p>
          </Card>
        </div>
      </div>
    </ArenaLayout>
  );
}