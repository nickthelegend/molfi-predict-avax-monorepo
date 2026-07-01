/**
 * usePriceTicker — Shared real-time price feed via Coinbase WebSocket.
 *
 * Architecture:
 * - A single WebSocket connection is shared across all consumers.
 * - Emits the latest trade price per asset every ~1s.
 * - Falls back to REST polling if WS fails.
 * - No candle fetching. This is purely real-time ticks.
 */
import { useEffect, useRef, useSyncExternalStore } from "react";

const COINBASE_WS = "wss://ws-feed.exchange.coinbase.com";
const COINBASE_REST = "https://api.exchange.coinbase.com";

const PAIR_MAP: Record<string, string> = {
  BTC: "BTC-USD",
  ETH: "ETH-USD",
  SOL: "SOL-USD",
  DOGE: "DOGE-USD",
  XRP: "XRP-USD",
};

/* ── Singleton store ── */
interface TickerState {
  prices: Record<string, number>;        // asset → latest price
  lastUpdate: Record<string, number>;    // asset → timestamp ms
  subscribers: Set<string>;              // active asset subscriptions
  listeners: Set<() => void>;            // React listeners
}

const store: TickerState = {
  prices: {},
  lastUpdate: {},
  subscribers: new Set(),
  listeners: new Set(),
};

let ws: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let restFallbackTimer: ReturnType<typeof setInterval> | null = null;
let wsConnected = false;

function notify() {
  store.listeners.forEach((l) => l());
}

function setPrice(asset: string, price: number) {
  if (price <= 0) return;
  store.prices[asset] = price;
  store.lastUpdate[asset] = Date.now();
  notify();
}

/* ── WebSocket management ── */
function connectWs() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  const pairs = Array.from(store.subscribers).map((a) => PAIR_MAP[a] || `${a}-USD`);
  if (pairs.length === 0) return;

  try {
    ws = new WebSocket(COINBASE_WS);

    ws.onopen = () => {
      wsConnected = true;
      // Stop REST fallback when WS is live
      if (restFallbackTimer) { clearInterval(restFallbackTimer); restFallbackTimer = null; }

      ws!.send(JSON.stringify({
        type: "subscribe",
        product_ids: pairs,
        channels: ["ticker"],
      }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "ticker" && msg.product_id && msg.price) {
          const asset = Object.entries(PAIR_MAP).find(([, v]) => v === msg.product_id)?.[0];
          if (asset) setPrice(asset, parseFloat(msg.price));
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      wsConnected = false;
      ws = null;
      startRestFallback();
      // Reconnect after 3s
      wsReconnectTimer = setTimeout(connectWs, 3000);
    };

    ws.onerror = () => {
      ws?.close();
    };
  } catch {
    startRestFallback();
  }
}

function disconnectWs() {
  if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
  if (ws) { ws.close(); ws = null; }
  wsConnected = false;
}

/* ── REST fallback (one call per asset every 5s — very light) ── */
function startRestFallback() {
  if (restFallbackTimer) return;
  restFallbackTimer = setInterval(async () => {
    if (wsConnected) { clearInterval(restFallbackTimer!); restFallbackTimer = null; return; }
    for (const asset of store.subscribers) {
      try {
        const pair = PAIR_MAP[asset] || `${asset}-USD`;
        const res = await fetch(`${COINBASE_REST}/products/${pair}/ticker`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.price) setPrice(asset, parseFloat(data.price));
      } catch { /* swallow */ }
    }
  }, 5000);
}

function subscribe(asset: string) {
  const wasEmpty = store.subscribers.size === 0;
  store.subscribers.add(asset);

  // Immediate REST seed so chart doesn't wait for WS or 5s fallback
  if (!store.prices[asset]) {
    const pair = PAIR_MAP[asset] || `${asset}-USD`;
    fetch(`${COINBASE_REST}/products/${pair}/ticker`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.price) setPrice(asset, parseFloat(d.price)); })
      .catch(() => {});
  }

  if (wasEmpty) connectWs();
  else if (ws?.readyState === WebSocket.OPEN) {
    const pair = PAIR_MAP[asset] || `${asset}-USD`;
    ws.send(JSON.stringify({ type: "subscribe", product_ids: [pair], channels: ["ticker"] }));
  }
}

function unsubscribe(asset: string) {
  store.subscribers.delete(asset);
  if (store.subscribers.size === 0) {
    disconnectWs();
    if (restFallbackTimer) { clearInterval(restFallbackTimer); restFallbackTimer = null; }
  }
}

/* ── Hook ── */
export function usePriceTicker(asset: string): { price: number; lastUpdate: number } {
  const assetRef = useRef(asset);
  assetRef.current = asset;

  useEffect(() => {
    subscribe(asset);
    return () => unsubscribe(asset);
  }, [asset]);

  const price = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb); },
    () => store.prices[assetRef.current] ?? 0,
  );

  const lastUpdate = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb); },
    () => store.lastUpdate[assetRef.current] ?? 0,
  );

  return { price, lastUpdate };
}

/** Imperative getter for non-React code (e.g. canvas render loop) */
export function getTickerPrice(asset: string): number {
  return store.prices[asset] ?? 0;
}
