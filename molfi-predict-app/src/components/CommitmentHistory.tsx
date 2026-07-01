import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/db";
import { motion } from "framer-motion";
import { Clock, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Commitment {
  id: string;
  token: string;
  committed_amount: string;
  status: string;
  created_at: string;
  updated_at: string;
  yield_active: boolean;
  balance_warnings: number;
}

interface CommitmentHistoryProps {
  userAddress: string;
}

export function CommitmentHistory({ userAddress }: CommitmentHistoryProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommitmentHistory();
  }, [userAddress]);

  const loadCommitmentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('soft_staking')
        .select('*')
        .eq('user_address', userAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommitments(data || []);
    } catch (error) {
      console.error('Failed to load commitment history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'withdrawn':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusIcon = (status: string, yieldActive: boolean) => {
    if (status === 'active' && yieldActive) {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    } else if (status === 'active' && !yieldActive) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commitment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (commitments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Commitment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No commitment history yet. Start staking to see your history here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Commitment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {commitments.map((commitment, index) => {
            const rawAmount = Number(commitment.committed_amount);
            // USDC and USDT use 6 decimals, BNB uses 18 decimals
            const decimals = commitment.token === 'BNB' ? 18 : 6;
            
            // Handle legacy incorrectly stored values
            let amount;
            if (rawAmount > 10_000_000_000 && commitment.token !== 'BNB') {
              // Legacy value - stored with 18 decimals instead of 6
              amount = rawAmount / Math.pow(10, 18);
            } else {
              amount = rawAmount / Math.pow(10, decimals);
            }
            
            return (
              <motion.div
                key={commitment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Timeline line */}
                {index < commitments.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
                )}
                
                <div className="flex gap-4 p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center relative z-10">
                    {getStatusIcon(commitment.status, commitment.yield_active)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <span>{commitment.token} Commitment</span>
                          <Badge variant="outline" className={getStatusColor(commitment.status)}>
                            {commitment.status}
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-primary mt-1">
                          ${amount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-right text-sm text-muted-foreground">
                        <div>{formatDistanceToNow(new Date(commitment.created_at), { addSuffix: true })}</div>
                        {commitment.updated_at !== commitment.created_at && (
                          <div className="text-xs">
                            Updated {formatDistanceToNow(new Date(commitment.updated_at), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Details */}
                    <div className="flex items-center gap-4 text-sm">
                      {!commitment.yield_active && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <AlertCircle className="w-3 h-3" />
                          <span>Yield Paused</span>
                        </div>
                      )}
                      
                      {commitment.balance_warnings > 0 && (
                        <div className="flex items-center gap-1 text-accent">
                          <AlertCircle className="w-3 h-3" />
                          <span>{commitment.balance_warnings} balance warning(s)</span>
                        </div>
                      )}
                      
                      {commitment.yield_active && commitment.status === 'active' && (
                        <div className="flex items-center gap-1 text-green-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>Earning Rewards</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
