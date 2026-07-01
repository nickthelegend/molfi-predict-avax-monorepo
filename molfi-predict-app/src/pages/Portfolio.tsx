import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  ExternalLink,
  X,
  Wallet,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { toast } from "sonner";
import { CopyTradeDashboard } from "@/components/CopyTradeDashboard";
import { useWallet } from "@/hooks/useWallet";
import { useBalance } from "@/hooks/useBalance";
import { molfiApi, type Position, type TransactionRecord } from "@/services/molfi-api";

const Portfolio = () => {
  const { address, isConnected } = useWallet();
  const { balance, refresh: refreshBalance } = useBalance();

  const [positions, setPositions] = useState<Position[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const [posRes, txRes] = await Promise.all([
        molfiApi.getPositions(address),
        molfiApi.getTransactions(address),
      ]);
      setPositions(posRes.positions ?? []);
      setTransactions(txRes.transactions ?? []);
    } catch (err) {
      console.error("Portfolio fetch error:", err);
      toast.error("Failed to load portfolio data");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchData();
    } else {
      setPositions([]);
      setTransactions([]);
    }
  }, [isConnected, address, fetchData]);

  const handleClosePosition = async (positionId: string) => {
    if (!address) return;
    setClosingId(positionId);
    try {
      await molfiApi.closePosition(positionId, address);
      toast.success("Position closed");
      await Promise.all([fetchData(), refreshBalance()]);
    } catch (err) {
      toast.error("Failed to close position", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setClosingId(null);
    }
  };

  // Derived summary from real balance + positions
  const availableBalance = balance?.available_balance ?? 0;
  const lockedBalance = balance?.locked_balance ?? 0;
  const totalBalance = balance?.total_balance ?? 0;
  const totalUnrealizedPnL = positions
    .filter((p) => p.status === "OPEN")
    .reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0);

  // Analytics derived from positions
  const closedPositions = positions.filter((p) => p.status === "CLOSED");
  const winners = closedPositions.filter((p) => (p.realized_pnl ?? 0) > 0);
  const winRate =
    closedPositions.length > 0
      ? (winners.length / closedPositions.length) * 100
      : 0;
  const pnls = closedPositions.map((p) => p.realized_pnl ?? 0);
  const bestTrade = pnls.length > 0 ? Math.max(...pnls) : 0;
  const worstTrade = pnls.length > 0 ? Math.min(...pnls) : 0;
  const openPositions = positions.filter((p) => p.status === "OPEN");

  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <Wallet className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect a wallet to view your portfolio
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground font-mono text-sm">
            {address.slice(0, 6)}…{address.slice(-4)}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Balance</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">${totalBalance.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              ${availableBalance.toFixed(2)} available
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Unrealized P&L</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div
              className={`text-3xl font-bold ${
                totalUnrealizedPnL >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {totalUnrealizedPnL >= 0 ? "+" : ""}${totalUnrealizedPnL.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Open positions</div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Win Rate</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{winRate.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground mt-1">
              {closedPositions.length} settled
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Positions</span>
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-3xl font-bold">{openPositions.length}</div>
            <div className="text-sm text-muted-foreground mt-1">
              ${lockedBalance.toFixed(2)} locked
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="positions">Active Positions</TabsTrigger>
            <TabsTrigger value="history">Transaction History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="copy-trading">Copy Trading</TabsTrigger>
          </TabsList>

          {/* Active Positions */}
          <TabsContent value="positions" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : openPositions.length === 0 ? (
              <Card className="p-12 text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Active Positions</h3>
                <p className="text-muted-foreground mb-4">
                  Start trading to see your positions here
                </p>
                <Button onClick={() => (window.location.href = "/markets")}>
                  Browse Markets
                </Button>
              </Card>
            ) : (
              openPositions.map((position) => (
                <Card
                  key={position.position_id}
                  className="p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-2 text-muted-foreground font-mono truncate max-w-md">
                        {position.market_id}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            position.side === "YES" ? "bg-success" : "bg-destructive"
                          }
                        >
                          {position.side}
                        </Badge>
                        {position.venue && (
                          <Badge variant="outline">{position.venue}</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={closingId === position.position_id}
                      onClick={() => handleClosePosition(position.position_id)}
                    >
                      {closingId === position.position_id ? (
                        <LoadingSpinner />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Shares</div>
                      <div className="font-semibold">{position.size.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Entry</div>
                      <div className="font-semibold">
                        {(position.entry_price * 100).toFixed(1)}¢
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Current</div>
                      <div className="font-semibold">
                        {(position.current_price * 100).toFixed(1)}¢
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Unrealized P&L
                      </div>
                      <div
                        className={`font-bold ${
                          (position.unrealized_pnl ?? 0) >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        {(position.unrealized_pnl ?? 0) >= 0 ? "+" : ""}$
                        {(position.unrealized_pnl ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      (window.location.href = `/market/${position.market_id}`)
                    }
                  >
                    View Market <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Transaction History */}
          <TabsContent value="history" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Transaction History</h3>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => {
                    const amount = parseFloat(tx.amount);
                    const isCredit = amount > 0;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-2 rounded-lg ${
                              isCredit ? "bg-success/10" : "bg-destructive/10"
                            }`}
                          >
                            {isCredit ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{tx.type}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {tx.reference_id
                                ? tx.reference_id.slice(0, 12) + "…"
                                : "—"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              isCredit ? "text-success" : "text-destructive"
                            }`}
                          >
                            {isCredit ? "+" : ""}${Math.abs(amount).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Trading Performance</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Settled Positions</span>
                    <span className="font-semibold">{closedPositions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Win Rate</span>
                    <span className="font-semibold text-success">
                      {winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Best Trade</span>
                    <span className="font-semibold text-success">
                      +${bestTrade.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Worst Trade</span>
                    <span
                      className={`font-semibold ${
                        worstTrade < 0 ? "text-destructive" : ""
                      }`}
                    >
                      ${worstTrade.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available Balance</span>
                    <span className="font-semibold">
                      ${availableBalance.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Locked in Positions</span>
                    <span className="font-semibold">${lockedBalance.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 6).map((tx) => {
                    const amount = parseFloat(tx.amount);
                    return (
                      <div key={tx.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tx.type}</span>
                        <span
                          className={
                            amount >= 0 ? "text-success" : "text-destructive"
                          }
                        >
                          {amount >= 0 ? "+" : ""}${Math.abs(amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-muted-foreground text-sm">No activity yet</p>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Copy Trading */}
          <TabsContent value="copy-trading">
            <CopyTradeDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Portfolio;
