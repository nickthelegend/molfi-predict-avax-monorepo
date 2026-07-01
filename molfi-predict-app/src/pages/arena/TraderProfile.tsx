import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { Copy, TrendingUp, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

// Mock trader data
const mockTrader = {
  id: "t1",
  address: "0x1234567890abcdef1234567890abcdef12345678",
  totalCompetitions: 3,
  wins: 1,
  topFiveFinishes: 2,
  averageRoi: 32.45,
  bestRoi: 47.23,
  worstRoi: -8.32,
  totalPnL: 156.78,
  riskScore: "MODERATE",
};

// Mock ROI history
const mockRoiHistory = [
  { competition: "C1", roi: 47.23 },
  { competition: "C2", roi: 28.90 },
  { competition: "C3", roi: -8.32 },
];

// Mock trade history
const mockTradeHistory = [
  { date: "Feb 9", asset: "BTC", action: "CLOSE_LONG", pnl: 12.50, roi: 12.5 },
  { date: "Feb 8", asset: "ETH", action: "CLOSE_SHORT", pnl: 8.20, roi: 8.2 },
  { date: "Feb 7", asset: "SOL", action: "CLOSE_LONG", pnl: -3.40, roi: -3.4 },
  { date: "Feb 6", asset: "BTC", action: "CLOSE_SHORT", pnl: 15.30, roi: 15.3 },
  { date: "Feb 5", asset: "ETH", action: "CLOSE_LONG", pnl: 4.80, roi: 4.8 },
];

export default function TraderProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <ArenaLayout
      title={`Trader Profile | Arena | Molfi`}
      description="Trader performance history and analytics."
    >
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-3 h-3 mr-1" />
        Back
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold text-foreground">
              {mockTrader.address.slice(0, 6)}...{mockTrader.address.slice(-4)}
            </h1>
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-border uppercase tracking-wide">
              {mockTrader.riskScore} RISK
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {mockTrader.totalCompetitions} competitions • {mockTrader.topFiveFinishes} top-5 finishes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Copy className="w-3 h-3 mr-1" />
            Copy Trade
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Trade on Performance
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Avg ROI</span>
          <p className={`text-xl font-semibold mt-1 ${mockTrader.averageRoi >= 0 ? 'text-success' : 'text-destructive'}`}>
            {mockTrader.averageRoi >= 0 ? '+' : ''}{mockTrader.averageRoi.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Best ROI</span>
          <p className="text-xl font-semibold mt-1 text-success">
            +{mockTrader.bestRoi.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Worst ROI</span>
          <p className="text-xl font-semibold mt-1 text-destructive">
            {mockTrader.worstRoi.toFixed(2)}%
          </p>
        </Card>
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Total PnL</span>
          <p className={`text-xl font-semibold mt-1 ${mockTrader.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            ${mockTrader.totalPnL.toFixed(2)}
          </p>
        </Card>
        <Card className="p-4 border border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Wins</span>
          <p className="text-xl font-semibold mt-1 text-warning">
            {mockTrader.wins}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ROI Chart */}
        <Card className="p-5 border border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            ROI History
          </h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRoiHistory}>
                <XAxis 
                  dataKey="competition" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 11,
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'ROI']}
                />
                <Line 
                  type="monotone" 
                  dataKey="roi" 
                  stroke="hsl(var(--warning))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--warning))', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Trade History Table */}
        <Card className="border border-border">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Recent Trades
            </h2>
          </div>
          <div className="text-xs text-muted-foreground px-4 py-2 border-b border-border grid grid-cols-5 gap-2">
            <span>Date</span>
            <span>Asset</span>
            <span>Action</span>
            <span className="text-right">PnL</span>
            <span className="text-right">ROI</span>
          </div>
          <div className="divide-y divide-border">
            {mockTradeHistory.map((trade, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 text-xs">
                <span className="text-muted-foreground">{trade.date}</span>
                <span className="font-medium text-foreground">{trade.asset}</span>
                <span className={trade.action.includes("LONG") ? "text-success" : "text-destructive"}>
                  {trade.action.replace("_", " ")}
                </span>
                <span className={`text-right ${trade.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                </span>
                <span className={`text-right ${trade.roi >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {trade.roi >= 0 ? '+' : ''}{trade.roi.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ArenaLayout>
  );
}
