import { appConfig } from "@/lib/config";

export type IndexerWsMessage = {
  type: string;
  channel?: string;
  channels?: string[];
  ts: number;
  data?: unknown;
  error?: string;
};

type Listener = (message: IndexerWsMessage) => void;
type StatusListener = (status: IndexerWsConnectionStatus) => void;

export type IndexerWsConnectionStatus = "idle" | "connecting" | "open" | "closed";

function wsConnectUrl(): string | null {
  return appConfig.leverxIndexerWsUrl;
}

export class IndexerWebSocket {
  private socket: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private statusListeners = new Set<StatusListener>();
  private subscribed = new Set<string>();
  private pendingSubscribe = new Set<string>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private shouldRun = false;
  private status: IndexerWsConnectionStatus = "idle";

  connect(): void {
    if (!wsConnectUrl()) return;
    this.shouldRun = true;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.openSocket();
  }

  disconnect(): void {
    this.shouldRun = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setStatus("closed");
  }

  subscribe(channels: string[]): void {
    for (const ch of channels) {
      this.pendingSubscribe.add(ch);
      this.subscribed.add(ch);
    }
    this.connect();
    this.flushSubscribe();
  }

  unsubscribe(channels: string[]): void {
    for (const ch of channels) {
      this.pendingSubscribe.delete(ch);
      this.subscribed.delete(ch);
    }
    if (this.socket?.readyState === WebSocket.OPEN && channels.length > 0) {
      this.socket.send(JSON.stringify({ op: "unsubscribe", channels }));
    }
  }

  onMessage(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  onStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  getStatus(): IndexerWsConnectionStatus {
    return this.status;
  }

  isLive(): boolean {
    return this.status === "open";
  }

  private setStatus(next: IndexerWsConnectionStatus): void {
    this.status = next;
    for (const listener of this.statusListeners) {
      listener(next);
    }
  }

  private openSocket(): void {
    const url = wsConnectUrl();
    if (!url) return;

    this.setStatus("connecting");
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.setStatus("open");
      this.flushSubscribe();
    });

    socket.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(String(event.data)) as IndexerWsMessage;
        for (const listener of this.listeners) {
          listener(message);
        }
      } catch {
        // ignore malformed frames
      }
    });

    socket.addEventListener("close", () => {
      this.socket = null;
      this.setStatus("closed");
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  private flushSubscribe(): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    if (this.pendingSubscribe.size === 0) return;
    const channels = [...this.pendingSubscribe];
    this.pendingSubscribe.clear();
    this.socket.send(JSON.stringify({ op: "subscribe", channels }));
  }

  private scheduleReconnect(): void {
    if (!this.shouldRun) return;
    if (this.reconnectTimer) return;
    const delay = Math.min(30_000, 1_000 * 2 ** this.reconnectAttempt);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openSocket();
    }, delay);
  }
}

let singleton: IndexerWebSocket | null = null;

export function getIndexerWebSocket(): IndexerWebSocket {
  if (!singleton) {
    singleton = new IndexerWebSocket();
  }
  return singleton;
}
