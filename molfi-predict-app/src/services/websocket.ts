/**
 * Molfi WebSocket Service v3 - Supabase Realtime
 * Using Supabase Realtime instead of Socket.IO for better integration
 */

import { supabase } from '@/integrations/supabase/db';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type WebSocketChannel = 'markets' | 'orderbook' | 'trades' | 'positions';

export type WebSocketEventType =
  | 'market_update'
  | 'orderbook_update'
  | 'trade'
  | 'position_update';

export interface WebSocketEvent {
  type: WebSocketEventType;
  market_id?: string;
  [key: string]: any;
}

export interface MarketUpdateEvent {
  type: 'market_update';
  market_id: string;
  yes_price: number;
  no_price: number;
  volume_24h: number;
  last_trade_price: number;
  timestamp: string;
}

export interface OrderbookUpdateEvent {
  type: 'orderbook_update';
  market_id: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  timestamp: string;
}

export type WebSocketCallback = (event: WebSocketEvent) => void;

export class WebSocketService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private callbacks: Map<string, Set<WebSocketCallback>> = new Map();

  constructor() {}

  connect(): Promise<void> {
    console.log('✅ Supabase Realtime ready');
    return Promise.resolve();
  }

  subscribeToMarkets(marketIds?: string[]): void {
    const channelName = 'markets-realtime';
    if (this.channels.has(channelName)) return;

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets' }, (payload) => {
        const market = payload.new as any;
        this.handleMessage({
          type: 'market_update',
          market_id: market.id,
          yes_price: market.yes_price,
          no_price: market.no_price,
          volume_24h: market.volume_24h,
          last_trade_price: market.last_trade_price,
          timestamp: new Date().toISOString(),
        });
      })
      .subscribe();

    this.channels.set(channelName, channel);
  }

  subscribe(channel: WebSocketChannel, marketId?: string): void {
    if (channel === 'markets') this.subscribeToMarkets(marketId ? [marketId] : undefined);
  }

  disconnect(): void {
    this.channels.forEach((channel) => supabase.removeChannel(channel));
    this.channels.clear();
  }

  on(eventType: WebSocketEventType | WebSocketChannel, callback: WebSocketCallback): void {
    if (!this.callbacks.has(eventType)) this.callbacks.set(eventType, new Set());
    this.callbacks.get(eventType)!.add(callback);
  }

  off(eventType: WebSocketEventType | WebSocketChannel, callback: WebSocketCallback): void {
    this.callbacks.get(eventType)?.delete(callback);
  }

  private handleMessage(message: WebSocketEvent): void {
    this.callbacks.get(message.type)?.forEach(cb => cb(message));
    if (message.type === 'market_update') {
      this.callbacks.get('markets')?.forEach(cb => cb(message));
    }
  }

  get isConnected(): boolean { return true; }
}

export const websocketService = new WebSocketService();
export const wsService = websocketService;
