import { useArenaLeaderboard, type LeaderboardEntry } from "@/hooks/useArenaLeaderboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArenaLeaderboardProps {
  competitionId: string | null;
  highlightAddress?: string;
  selectedWallet?: string;
  compact?: boolean;
  onSelectTrader?: (entry: LeaderboardEntry) => void;
}

export { type LeaderboardEntry };

export function ArenaLeaderboard({ 
  competitionId, 
  highlightAddress,
  selectedWallet,
  compact = false,
  onSelectTrader
}: ArenaLeaderboardProps) {
  const { entries, loading, error } = useArenaLeaderboard(
    competitionId ? { competitionId, limit: compact ? 10 : 50 } : null
  );
  const formatPnL = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}$${value.toFixed(2)}`;
  };

  const formatROI = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(2)}%`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'QUALIFIED':
        return <Badge variant="outline" className="text-[9px] text-green-400 border-green-400/30">QUALIFIED</Badge>;
      case 'ELIMINATED':
        return <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">ELIMINATED</Badge>;
      case 'WITHDRAWN':
        return <Badge variant="outline" className="text-[9px] text-muted-foreground border-border">WITHDRAWN</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] text-warning border-warning/30">ACTIVE</Badge>;
    }
  };

  const getPnLIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-3 h-3 text-green-400" />;
    if (value < 0) return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <Card className="p-8 border border-border">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading leaderboard...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 border border-border">
        <p className="text-sm text-destructive text-center">{error}</p>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-8 border border-border">
        <p className="text-sm text-muted-foreground text-center">
          No competitors yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="w-12 text-[10px] uppercase tracking-wide text-muted-foreground">Rank</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Trader</TableHead>
            {!compact && (
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Balance</TableHead>
            )}
            <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">PnL</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">ROI</TableHead>
            {!compact && (
              <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-center">Positions</TableHead>
            )}
            <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow 
              key={entry.id}
              onClick={() => onSelectTrader?.(entry)}
              className={cn(
                "border-b border-border/50 transition-colors duration-150",
                onSelectTrader && "cursor-pointer hover:bg-muted/30",
                (highlightAddress?.toLowerCase() === entry.wallet_address.toLowerCase() ||
                 selectedWallet?.toLowerCase() === entry.wallet_address.toLowerCase()) && "bg-warning/10",
                entry.rank <= 5 && !selectedWallet && !highlightAddress && "bg-muted/20"
              )}
            >
              <TableCell className="font-mono text-sm">
                <span className={cn(
                  entry.rank <= 5 && "text-warning font-semibold"
                )}>
                  #{entry.rank}
                </span>
              </TableCell>
              <TableCell>
                <code className="text-xs text-foreground">
                  {entry.masked_address}
                </code>
              </TableCell>
              {!compact && (
                <TableCell className="text-right font-mono text-sm text-foreground">
                  ${entry.current_balance.toFixed(2)}
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {getPnLIcon(entry.total_pnl)}
                  <span className={cn(
                    "font-mono text-sm",
                    entry.total_pnl >= 0 ? "text-green-400" : "text-destructive"
                  )}>
                    {formatPnL(entry.total_pnl)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className={cn(
                  "font-mono text-sm",
                  entry.roi_percent >= 0 ? "text-green-400" : "text-destructive"
                )}>
                  {formatROI(entry.roi_percent)}
                </span>
              </TableCell>
              {!compact && (
                <TableCell className="text-center">
                  <span className="font-mono text-sm text-muted-foreground">
                    {entry.open_positions_count}
                  </span>
                </TableCell>
              )}
              <TableCell className="text-center">
                {getStatusBadge(entry.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
