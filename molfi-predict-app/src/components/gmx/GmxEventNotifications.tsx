/**
 * GMX Event Notifications Component
 * Shows real-time toast notifications for GMX events
 * Auto-refreshes positions when orders execute
 */

import { useEffect } from 'react';
import { useGmxEvents } from '@/hooks/useGmxEvents';
import { useToast } from '@/hooks/use-toast';
import type { GmxEventLog } from '@/lib/gmx-events';

interface GmxEventNotificationsProps {
  userAddress?: string;
  onOrderExecuted?: () => void; // Callback to refresh positions
  onPositionChange?: () => void; // Callback when position changes
  enabled?: boolean;
}

export function GmxEventNotifications({
  userAddress,
  onOrderExecuted,
  onPositionChange,
  enabled = true,
}: GmxEventNotificationsProps) {
  const { toast } = useToast();
  
  const { events, isConnected, error } = useGmxEvents(
    enabled ? userAddress : undefined,
    {
      onOrderExecuted: (event: GmxEventLog) => {
        toast({
          title: '✅ Order Executed',
          description: 'Your order has been filled',
          variant: 'default',
        });
        onOrderExecuted?.();
      },
      
      onOrderCreated: (event: GmxEventLog) => {
        toast({
          title: '📝 Order Created',
          description: 'Order submitted successfully',
          variant: 'default',
        });
      },
      
      onOrderCancelled: (event: GmxEventLog) => {
        toast({
          title: '❌ Order Cancelled',
          description: 'Your order has been cancelled',
          variant: 'default',
        });
      },
      
      onPositionIncrease: (event: GmxEventLog) => {
        toast({
          title: '📈 Position Increased',
          description: 'Your position has been increased',
          variant: 'default',
        });
        onPositionChange?.();
      },
      
      onPositionDecrease: (event: GmxEventLog) => {
        toast({
          title: '📉 Position Decreased',
          description: 'Your position has been decreased',
          variant: 'default',
        });
        onPositionChange?.();
      },
      
      onPositionLiquidated: (event: GmxEventLog) => {
        toast({
          title: '🔴 Position Liquidated',
          description: 'Your position has been liquidated',
          variant: 'destructive',
        });
        onPositionChange?.();
      },
      
      onDepositExecuted: (event: GmxEventLog) => {
        toast({
          title: '💵 Deposit Executed',
          description: 'Liquidity deposit complete',
          variant: 'default',
        });
      },
      
      onWithdrawalExecuted: (event: GmxEventLog) => {
        toast({
          title: '💸 Withdrawal Executed',
          description: 'Liquidity withdrawal complete',
          variant: 'default',
        });
      },
    },
    {
      autoConnect: enabled,
      maxEvents: 20,
    }
  );
  
  // Show connection status in console (dev only)
  useEffect(() => {
    if (isConnected) {
      console.log('[GMX Events] 🟢 Real-time notifications enabled');
    } else if (error) {
      console.warn('[GMX Events] 🔴 Connection error:', error);
    }
  }, [isConnected, error]);
  
  // This component doesn't render anything
  // It just manages event subscriptions and shows toasts
  return null;
}
