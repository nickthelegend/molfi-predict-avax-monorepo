import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLinkIcon, RefreshCw } from 'lucide-react';
import { walletAPI } from '@/services/wallet-provider';
import type { WalletTransaction } from '@/types/wallet';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  confirmed: 'default',
  pending: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
};

const typeIcons: Record<string, string> = {
  deposit: '↓',
  withdrawal: '↑',
  trade: '↔',
  settlement: '✓',
};

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const data = await walletAPI.getTransactions(20);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaction History</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{typeIcons[tx.type]}</span>
                  <div>
                    <p className="text-sm font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`text-sm font-mono font-semibold ${tx.type === 'deposit' ? 'text-green-500' : ''}`}>
                      {tx.type === 'deposit' ? '+' : '-'}${tx.amount.toFixed(2)}
                    </p>
                    {tx.confirmations !== undefined && (
                      <p className="text-xs text-muted-foreground">{tx.confirmations} conf.</p>
                    )}
                  </div>
                  <Badge variant={statusVariant[tx.status] || 'secondary'}>{tx.status}</Badge>
                  {tx.txHash && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => window.open(`https://optimistic.etherscan.io/tx/${tx.txHash}`, '_blank')}
                    >
                      <ExternalLinkIcon className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
