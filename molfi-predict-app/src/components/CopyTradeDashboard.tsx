import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pause, Play, StopCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface CopyRelationship {
  id: string;
  leader_id: string;
  copy_mode: 'exact' | 'ratio';
  copy_ratio?: number;
  max_per_trade?: number;
  status: 'active' | 'paused' | 'stopped';
  total_copied_trades: number;
  total_pnl: number;
  created_at: string;
  updated_at: string;
}

interface CopyExecution {
  id: string;
  relationship_id: string;
  action: 'open' | 'close' | 'liquidate';
  leader_amount: number;
  follower_amount?: number;
  status: 'pending' | 'executed' | 'failed' | 'skipped';
  failure_reason?: string;
  executed_at: string;
}

export function CopyTradeDashboard() {
  const { address } = useAccount();
  const [relationships, setRelationships] = useState<CopyRelationship[]>([]);
  const [executions, setExecutions] = useState<CopyExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch relationships
      const relResponse = await fetch(`/api/leaderboard/copy-trade/list/${address}`);
      const relData = await relResponse.json();
      
      if (relData.success) {
        setRelationships(relData.relationships || []);
        
        // Fetch executions for each relationship
        const execPromises = relData.relationships?.map((rel: CopyRelationship) =>
          fetch(`/api/leaderboard/copy-trade/${rel.id}/executions`)
            .then(res => res.json())
            .then(data => data.executions || [])
        ) || [];
        
        const allExecutions = await Promise.all(execPromises);
        setExecutions(allExecutions.flat());
      }
    } catch (error) {
      console.error('Failed to fetch copy trade data:', error);
      toast.error('Failed to load copy trading data');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (relationshipId: string, currentStatus: string) => {
    try {
      setProcessingId(relationshipId);
      
      const response = await fetch(`/api/leaderboard/copy-trade/${relationshipId}/pause`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(currentStatus === 'active' ? 'Copy trading paused' : 'Copy trading resumed');
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to pause/resume:', error);
      toast.error('Failed to update copy trading status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStop = async (relationshipId: string) => {
    if (!confirm('Stop copying this trader? This cannot be undone and you will need to set up a new copy trade relationship.')) {
      return;
    }

    try {
      setProcessingId(relationshipId);
      
      const response = await fetch(`/api/leaderboard/copy-trade/${relationshipId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Copy trading stopped');
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to stop copy trading');
      }
    } catch (error) {
      console.error('Failed to stop:', error);
      toast.error('Failed to stop copy trading');
    } finally {
      setProcessingId(null);
    }
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}$${Math.abs(pnl).toFixed(2)}`;
  };

  if (!address) {
    return (
      <Card className="p-6 text-center border border-border">
        <p className="text-muted-foreground">
          Connect your wallet to view copy trading
        </p>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center border border-border">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (relationships.length === 0) {
    return (
      <Card className="p-8 text-center border border-border">
        <div className="max-w-md mx-auto">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Start Copy Trading</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You're not copying any traders yet. Visit the leaderboard to find top performers and automatically copy their trades.
          </p>
          <Button asChild>
            <a href="/leaderboard">Browse Top Traders</a>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Copy Trades</h2>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {relationships.map(rel => {
        const relExecutions = executions.filter(e => e.relationship_id === rel.id);
        const recentExecutions = relExecutions.slice(0, 5);

        return (
          <Card key={rel.id} className="p-4 border border-border">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-medium">
                      Following: {shortenAddress(rel.leader_id)}
                    </p>
                    <Badge variant={rel.status === 'active' ? 'default' : 'secondary'}>
                      {rel.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      Mode: {rel.copy_mode === 'exact' ? 'Exact Amount' : `${((rel.copy_ratio || 0) * 100).toFixed(0)}% of Balance`}
                    </p>
                    {rel.max_per_trade && (
                      <p>Max per trade: ${rel.max_per_trade.toFixed(2)}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {rel.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(rel.id, rel.status)}
                      disabled={processingId === rel.id}
                    >
                      {processingId === rel.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </>
                      )}
                    </Button>
                  )}
                  
                  {rel.status === 'paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePause(rel.id, rel.status)}
                      disabled={processingId === rel.id}
                    >
                      {processingId === rel.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-1" />
                          Resume
                        </>
                      )}
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleStop(rel.id)}
                    disabled={processingId === rel.id}
                  >
                    {processingId === rel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <StopCircle className="w-4 h-4 mr-1" />
                        Stop
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Copied Trades
                  </p>
                  <p className="text-xl font-semibold">{rel.total_copied_trades}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Total PnL
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-semibold ${rel.total_pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatPnL(rel.total_pnl)}
                    </p>
                    {rel.total_pnl >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Executions */}
              {recentExecutions.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-2">Recent Trades</p>
                  <div className="space-y-2">
                    {recentExecutions.map(exec => (
                      <div
                        key={exec.id}
                        className="flex items-center justify-between text-xs p-2 rounded bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {exec.action}
                          </Badge>
                          <span className="text-muted-foreground">
                            Leader: ${exec.leader_amount.toFixed(2)}
                          </span>
                          {exec.follower_amount && (
                            <span className="text-muted-foreground">
                              → You: ${exec.follower_amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={
                            exec.status === 'executed' ? 'default' :
                            exec.status === 'failed' ? 'destructive' :
                            exec.status === 'skipped' ? 'secondary' :
                            'outline'
                          }
                        >
                          {exec.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
