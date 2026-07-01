/**
 * GMX Real-Time Events Hook
 * Subscribes to GMX EventEmitter contract via Arbitrum WebSocket
 * Provides instant notifications for orders, positions, and liquidations
 * 
 * Cost: $0 gas (read-only WebSocket subscription)
 * Latency: Sub-second (block-level real-time)
 * 
 * Usage:
 * ```tsx
 * const { events, isConnected } = useGmxEvents(userAddress, {
 *   onOrderExecuted: (event) => toast.success('Order executed!'),
 *   onPositionLiquidated: (event) => toast.error('Position liquidated!'),
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPublicClient, webSocket, type Hex } from 'viem';
import { arbitrum } from 'viem/chains';
import { 
  decodeGmxEvent, 
  isEventForUser, 
  getEventMessage, 
  getEventSeverity,
  type GmxEventLog,
  GMX_EVENT_NAMES 
} from '@/lib/gmx-events';

// GMX EventEmitter contract address
const EVENT_EMITTER_ADDRESS = '0xC8ee91A54287DB53897056e12D9819156D3822Fb';

// EventLog1 ABI (the event we're listening to)
const EVENT_LOG1_ABI = {
  type: 'event',
  name: 'EventLog1',
  inputs: [
    { name: 'msgSender', type: 'address', indexed: true },
    { name: 'eventName', type: 'bytes32', indexed: true },
    { name: 'topic1', type: 'bytes32', indexed: true },
    { name: 'eventData', type: 'bytes', indexed: false },
  ],
} as const;

export interface GmxEventCallbacks {
  // Order events
  onOrderCreated?: (event: GmxEventLog) => void;
  onOrderExecuted?: (event: GmxEventLog) => void;
  onOrderCancelled?: (event: GmxEventLog) => void;
  onOrderUpdated?: (event: GmxEventLog) => void;
  
  // Position events
  onPositionIncrease?: (event: GmxEventLog) => void;
  onPositionDecrease?: (event: GmxEventLog) => void;
  onPositionLiquidated?: (event: GmxEventLog) => void;
  
  // Liquidity events
  onDepositExecuted?: (event: GmxEventLog) => void;
  onWithdrawalExecuted?: (event: GmxEventLog) => void;
  
  // Generic handler for all events
  onEvent?: (event: GmxEventLog) => void;
}

export interface GmxEventsState {
  events: GmxEventLog[];
  isConnected: boolean;
  error: string | null;
  lastEventTime: number | null;
}

/**
 * Hook to subscribe to GMX events for a specific user
 */
export function useGmxEvents(
  userAddress: string | undefined,
  callbacks?: GmxEventCallbacks,
  options: {
    maxEvents?: number; // Max events to keep in state (default: 50)
    autoConnect?: boolean; // Auto-connect on mount (default: true)
  } = {}
): GmxEventsState {
  const { maxEvents = 50, autoConnect = true } = options;
  
  const [events, setEvents] = useState<GmxEventLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  
  const clientRef = useRef<any>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const callbacksRef = useRef(callbacks);
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);
  
  // Handle incoming event
  const handleEvent = useCallback((log: any) => {
    const event = decodeGmxEvent(log);
    
    if (!event) return;
    
    // Filter events for this user
    if (userAddress && !isEventForUser(event, userAddress)) {
      return;
    }
    
    // Add to events list
    setEvents((prev) => {
      const newEvents = [event, ...prev].slice(0, maxEvents);
      return newEvents;
    });
    
    setLastEventTime(Date.now());
    
    // Call specific event handler
    const cbs = callbacksRef.current;
    if (cbs) {
      switch (event.eventName) {
        case 'OrderCreated':
          cbs.onOrderCreated?.(event);
          break;
        case 'OrderExecuted':
          cbs.onOrderExecuted?.(event);
          break;
        case 'OrderCancelled':
          cbs.onOrderCancelled?.(event);
          break;
        case 'OrderUpdated':
          cbs.onOrderUpdated?.(event);
          break;
        case 'PositionIncrease':
          cbs.onPositionIncrease?.(event);
          break;
        case 'PositionDecrease':
          cbs.onPositionDecrease?.(event);
          break;
        case 'PositionLiquidated':
          cbs.onPositionLiquidated?.(event);
          break;
        case 'DepositExecuted':
          cbs.onDepositExecuted?.(event);
          break;
        case 'WithdrawalExecuted':
          cbs.onWithdrawalExecuted?.(event);
          break;
      }
      
      // Generic handler
      cbs.onEvent?.(event);
    }
  }, [userAddress, maxEvents]);
  
  // Connect to WebSocket
  useEffect(() => {
    if (!autoConnect) return;
    
    // Don't connect if no user address (anonymous mode)
    // In production, you might still want to listen for public events
    
    let cancelled = false;
    
    const connect = async () => {
      try {
        // Get WebSocket RPC URL from environment or use public endpoint
        const wsUrl = import.meta.env.VITE_ARBITRUM_WS_RPC || 'wss://arb1.arbitrum.io/rpc';
        
        console.log('[GMX Events] Connecting to Arbitrum WebSocket...', wsUrl);
        
        // Create WebSocket client
        const client = createPublicClient({
          chain: arbitrum,
          transport: webSocket(wsUrl, {
            reconnect: {
              attempts: 10,
              delay: 1000,
            },
            timeout: 30000,
          }),
        });
        
        if (cancelled) return;
        
        clientRef.current = client;
        
        // Subscribe to EventLog1 events from EventEmitter contract
        const unwatch = client.watchContractEvent({
          address: EVENT_EMITTER_ADDRESS,
          abi: [EVENT_LOG1_ABI],
          eventName: 'EventLog1',
          // Optional: Filter by user address if needed
          // args: userAddress ? { msgSender: userAddress as Hex } : undefined,
          onLogs: (logs) => {
            logs.forEach(handleEvent);
          },
          onError: (err) => {
            console.error('[GMX Events] WebSocket error:', err);
            setError(err.message || 'WebSocket error');
            setIsConnected(false);
          },
        });
        
        if (cancelled) {
          unwatch();
          return;
        }
        
        unsubscribeRef.current = unwatch;
        setIsConnected(true);
        setError(null);
        console.log('[GMX Events] Connected successfully');
        
      } catch (err: any) {
        if (cancelled) return;
        
        console.error('[GMX Events] Connection failed:', err);
        setError(err.message || 'Failed to connect');
        setIsConnected(false);
      }
    };
    
    connect();
    
    // Cleanup
    return () => {
      cancelled = true;
      
      if (unsubscribeRef.current) {
        console.log('[GMX Events] Disconnecting...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [autoConnect, handleEvent]);
  
  return {
    events,
    isConnected,
    error,
    lastEventTime,
  };
}

/**
 * Hook to get formatted event messages for UI display
 */
export function useGmxEventMessages(events: GmxEventLog[]): Array<{
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
  event: GmxEventLog;
}> {
  return events.map(event => ({
    message: getEventMessage(event),
    severity: getEventSeverity(event),
    timestamp: Number(event.blockNumber),
    event,
  }));
}
