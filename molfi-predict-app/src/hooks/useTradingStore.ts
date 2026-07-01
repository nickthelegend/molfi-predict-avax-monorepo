import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';

// ── Types ──

export interface LivePosition {
  id: string;
  asset: string;
  timeframe: 'hourly' | 'daily';
  market: string;
  side: 'YES' | 'NO';
  size: number;
  shares: number;
  entryPrice: number;
  leverage: number;
  openedAt: number;
}

export interface FilledOrder {
  id: string;
  asset: string;
  market: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  price: number;
  size: number;
  shares: number;
  filledAt: number;
}

export interface TradeNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info';
  createdAt: number;
  read: boolean;
}

const STORAGE_KEY = 'molfi_live_positions';
const ORDERS_KEY = 'molfi_filled_orders';
const NOTIF_KEY = 'molfi_trade_notifications';

// ── Singleton store (external to React) ──

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

let _positions: LivePosition[] = load(STORAGE_KEY, []);
let _orders: FilledOrder[] = load(ORDERS_KEY, []);
let _notifications: TradeNotification[] = load(NOTIF_KEY, []);
let _version = 0;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  _version++;
  listeners.forEach((l) => l());
}

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getVersion() { return _version; }

// ── Mutations (synchronous, outside React) ──

function _openPosition(pos: LivePosition) {
  _positions = [pos, ..._positions];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_positions));

  const order: FilledOrder = {
    id: `order-${Date.now()}`,
    asset: pos.asset,
    market: pos.market,
    side: 'BUY',
    type: 'MARKET',
    price: pos.entryPrice,
    size: pos.size,
    shares: pos.shares,
    filledAt: Date.now(),
  };
  _orders = [order, ..._orders];
  localStorage.setItem(ORDERS_KEY, JSON.stringify(_orders));

  const notif: TradeNotification = {
    id: `notif-${Date.now()}`,
    title: `Order Filled — ${pos.market}`,
    message: `Bought ${pos.shares.toFixed(1)} ${pos.side} shares at ${pos.entryPrice.toFixed(1)}¢ for $${pos.size.toFixed(2)} USDC${pos.leverage > 1 ? ` (${pos.leverage}x leverage)` : ''}`,
    type: 'success',
    createdAt: Date.now(),
    read: false,
  };
  _notifications = [notif, ..._notifications];
  localStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));

  emit();
}

function _closePosition(id: string) {
  _positions = _positions.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(_positions));
  emit();
}

export function clearAllTradingState() {
  _positions = [];
  _orders = [];
  _notifications = [];
  localStorage.setItem(STORAGE_KEY, '[]');
  localStorage.setItem(ORDERS_KEY, '[]');
  localStorage.setItem(NOTIF_KEY, '[]');
  emit();
}

function _markNotifRead(id: string) {
  _notifications = _notifications.map((n) => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));
  emit();
}

// ── Hook ──

export function useTradingStore() {
  // Subscribe to external store so every consumer re-renders on mutations
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);

  // Derived from singleton — always fresh
  const positions = _positions;
  const orders = _orders;
  const notifications = _notifications;
  const unreadNotifCount = _notifications.filter((n) => !n.read).length;

  return {
    positions,
    orders,
    notifications,
    unreadNotifCount,
    openPosition: _openPosition,
    closePosition: _closePosition,
    clearAll: clearAllTradingState,
    markNotifRead: _markNotifRead,
  };
}
