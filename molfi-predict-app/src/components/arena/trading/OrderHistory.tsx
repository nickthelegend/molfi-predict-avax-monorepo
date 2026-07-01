import { useState } from 'react';
import { useGmxOrders, useCancelOrder } from '@/hooks/useGmxOrders';
import { useMolfiWallet } from '@/contexts/MolfiWalletContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import type { GmxOrder } from '@/types/molfi-wallet';

interface OrderHistoryProps {
  arenaWalletAddress?: string;
}

export function OrderHistory({ arenaWalletAddress }: OrderHistoryProps) {
  const { currentArenaWallet } = useMolfiWallet();
  const walletAddress = arenaWalletAddress || currentArenaWallet?.address;
  
  const { data: orders, isLoading, error } = useGmxOrders(walletAddress);
  const cancelOrder = useCancelOrder();

  const [activeTab, setActiveTab] = useState('pending');

  // Filter orders by status
  const pendingOrders = orders?.filter((o) => o.status === 'pending') ?? [];
  const filledOrders = orders?.filter((o) => o.status === 'filled') ?? [];
  const cancelledOrders = orders?.filter((o) => o.status === 'cancelled' || o.status === 'failed') ?? [];

  const getOrdersByTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingOrders;
      case 'filled':
        return filledOrders;
      case 'cancelled':
        return cancelledOrders;
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-border p-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Failed to load orders</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="pending" className="flex-1">
              Pending
              {pendingOrders.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="filled" className="flex-1">Filled</TabsTrigger>
            <TabsTrigger value="cancelled" className="flex-1">Cancelled</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={activeTab} className="m-0">
          <OrderTable
            orders={getOrdersByTab()}
            showCancel={activeTab === 'pending'}
            onCancel={(orderId) => cancelOrder.mutate(orderId)}
            isCancelling={cancelOrder.isPending}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}

interface OrderTableProps {
  orders: GmxOrder[];
  showCancel: boolean;
  onCancel: (orderId: string) => void;
  isCancelling: boolean;
}

function OrderTable({ orders, showCancel, onCancel, isCancelling }: OrderTableProps) {
  if (!orders.length) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        No orders found
      </div>
    );
  }

  const getStatusIcon = (status: GmxOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3.5 h-3.5 text-warning" />;
      case 'filled':
        return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    }
  };

  const getStatusBadge = (status: GmxOrder['status']) => {
    const variants: Record<GmxOrder['status'], string> = {
      pending: 'text-warning border-warning/30',
      filled: 'text-green-400 border-green-400/30',
      cancelled: 'text-muted-foreground border-border',
      failed: 'text-destructive border-destructive/30',
    };

    return (
      <Badge variant="outline" className={cn('text-[9px]', variants[status])}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.toUpperCase()}</span>
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-b border-border hover:bg-transparent">
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Market</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Side</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Type</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Size</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-right">Price</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</TableHead>
          <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground">Time</TableHead>
          {showCancel && (
            <TableHead className="text-[10px] uppercase tracking-wide text-muted-foreground text-center">Action</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow
            key={order.id}
            className="border-b border-border/50 hover:bg-muted/30"
          >
            <TableCell className="font-medium text-sm">
              {order.marketSymbol}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px]',
                  order.side === 'long'
                    ? 'text-green-400 border-green-400/30'
                    : 'text-destructive border-destructive/30'
                )}
              >
                {order.side === 'long' ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {order.side.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground capitalize">
              {order.orderType}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              ${order.size.toFixed(2)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {order.price ? `$${order.price.toLocaleString()}` : 'Market'}
            </TableCell>
            <TableCell>
              {getStatusBadge(order.status)}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(order.createdAt), 'MMM d, HH:mm')}
            </TableCell>
            {showCancel && (
              <TableCell className="text-center">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => onCancel(order.id)}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
