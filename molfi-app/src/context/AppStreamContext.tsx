import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
import { useWallet } from "@/context/WalletContext";
import { appConfig } from "@/lib/config";
import { resolveAccountId } from "@/lib/leverx/account-resolution";
import { fetchAccounts } from "@/lib/leverx/indexer-client";
import { limitOrdersChannel, positionsChannel } from "@/lib/leverx/indexer-channels";
import { indexerKeys } from "@/lib/leverx/indexer-query-keys";
import { applyIndexerStreamMessage } from "@/lib/leverx/indexer-ws-handlers";
import {
  getIndexerWebSocket,
  type IndexerWsConnectionStatus,
} from "@/lib/leverx/indexer-ws";
import {
  handleJarvisEvent,
  handleJarvisUnread,
  type JarvisConnectionState,
} from "@/lib/leverx/jarvis-ws-handlers";

export type { JarvisConnectionState };

const WALLET_INDEXER_SUBSCRIBER_ID = "__wallet__";
const JARVIS_INITIAL_BACKOFF_MS = 1000;
const JARVIS_MAX_BACKOFF_MS = 30_000;

type AppStreamContextValue = {
  indexerStatus: IndexerWsConnectionStatus;
  indexerLive: boolean;
  jarvisStatus: JarvisConnectionState;
};

const AppStreamContext = createContext<AppStreamContextValue>({
  indexerStatus: "idle",
  indexerLive: false,
  jarvisStatus: "disconnected",
});

type ChannelRegistry = {
  channelRefs: Map<string, number>;
  subscriberChannels: Map<string, readonly string[]>;
};

function createChannelRegistry(): ChannelRegistry {
  return {
    channelRefs: new Map(),
    subscriberChannels: new Map(),
  };
}

function syncSubscriberChannels(
  registry: ChannelRegistry,
  ws: ReturnType<typeof getIndexerWebSocket>,
  subscriberId: string,
  channels: readonly string[],
): void {
  const prev = new Set(registry.subscriberChannels.get(subscriberId) ?? []);
  const next = new Set(channels.filter(Boolean));

  const toSubscribe: string[] = [];
  const toUnsubscribe: string[] = [];

  for (const channel of prev) {
    if (next.has(channel)) continue;
    const refs = (registry.channelRefs.get(channel) ?? 1) - 1;
    if (refs <= 0) {
      registry.channelRefs.delete(channel);
      toUnsubscribe.push(channel);
    } else {
      registry.channelRefs.set(channel, refs);
    }
  }

  for (const channel of next) {
    if (prev.has(channel)) continue;
    const refs = (registry.channelRefs.get(channel) ?? 0) + 1;
    registry.channelRefs.set(channel, refs);
    if (refs === 1) toSubscribe.push(channel);
  }

  if (next.size === 0) registry.subscriberChannels.delete(subscriberId);
  else registry.subscriberChannels.set(subscriberId, [...next]);

  if (toSubscribe.length > 0) ws.subscribe(toSubscribe);
  if (toUnsubscribe.length > 0) ws.unsubscribe(toUnsubscribe);
}

export function AppStreamProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { address } = useWallet();
  const indexerEnabled = Boolean(appConfig.leverxIndexerUrl);
  const { data: accounts = [] } = useQuery({
    queryKey: indexerKeys.accounts(address ?? undefined),
    queryFn: async () => {
      const { items } = await fetchAccounts({ owner: address!, limit: 20 });
      return items;
    },
    enabled: indexerEnabled && Boolean(address),
    staleTime: 30_000,
  });

  const ws = useMemo(() => getIndexerWebSocket(), []);
  const channelRegistryRef = useRef<ChannelRegistry>(createChannelRegistry());

  const [indexerStatus, setIndexerStatus] = useState<IndexerWsConnectionStatus>("idle");
  const [jarvisStatus, setJarvisStatus] = useState<JarvisConnectionState>("disconnected");

  const owner = address?.trim() ?? null;
  const jarvisOwner = owner?.toLowerCase() ?? null;
  const accountId = useMemo(() => {
    const id = resolveAccountId(accounts, []);
    return id?.trim().toLowerCase() ?? null;
  }, [accounts]);

  const setIndexerSubscriberChannels = useCallback(
    (subscriberId: string, channels: readonly string[]) => {
      syncSubscriberChannels(
        channelRegistryRef.current,
        ws,
        subscriberId,
        channels,
      );
    },
    [ws],
  );

  useEffect(() => {
    if (!appConfig.indexerStreamEnabled) return;

    ws.connect();
    const offStatus = ws.onStatus(setIndexerStatus);
    const offMessage = ws.onMessage((message) => {
      applyIndexerStreamMessage(queryClient, message);
    });

    return () => {
      offStatus();
      offMessage();
    };
  }, [queryClient, ws]);

  useEffect(() => {
    if (!appConfig.indexerStreamEnabled || !owner) {
      setIndexerSubscriberChannels(WALLET_INDEXER_SUBSCRIBER_ID, []);
      return;
    }

    setIndexerSubscriberChannels(WALLET_INDEXER_SUBSCRIBER_ID, [
      positionsChannel(owner),
      limitOrdersChannel(owner),
    ]);

    return () => {
      setIndexerSubscriberChannels(WALLET_INDEXER_SUBSCRIBER_ID, []);
    };
  }, [owner, setIndexerSubscriberChannels]);

  useEffect(() => {
    if (!jarvisOwner || !accountId || !appConfig.jarvisWsUrl) {
      setJarvisStatus("disconnected");
      return;
    }

    let disposed = false;
    const socketRef: { current: Socket | null } = { current: null };
    let reconnectTimer: number | null = null;
    let backoffMs = JARVIS_INITIAL_BACKOFF_MS;

    const clearReconnectTimer = () => {
      if (reconnectTimer != null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const subscribe = (socket: Socket) => {
      socket.emit("subscribe", {
        owner: jarvisOwner,
        account_id: accountId,
      });
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      clearReconnectTimer();
      setJarvisStatus("connecting");
      reconnectTimer = window.setTimeout(() => {
        if (disposed) return;
        backoffMs = Math.min(backoffMs * 2, JARVIS_MAX_BACKOFF_MS);
        connect();
      }, backoffMs);
    };

    const connect = () => {
      if (disposed) return;
      clearReconnectTimer();
      setJarvisStatus("connecting");

      const socket = io(appConfig.jarvisWsUrl!, {
        path: "/socket.io",
        transports: ["websocket", "polling"],
        autoConnect: true,
        reconnection: false,
      });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (disposed) return;
        backoffMs = JARVIS_INITIAL_BACKOFF_MS;
        setJarvisStatus("connected");
        subscribe(socket);
      });

      socket.on("disconnect", () => {
        if (disposed) return;
        setJarvisStatus("disconnected");
        scheduleReconnect();
      });

      socket.on("connect_error", () => {
        if (disposed) return;
        socket.disconnect();
        setJarvisStatus("disconnected");
        scheduleReconnect();
      });

      socket.on("jarvis.event", (payload: unknown) => {
        handleJarvisEvent(queryClient, jarvisOwner, accountId, payload);
      });

      socket.on("jarvis.unread", (payload: unknown) => {
        handleJarvisUnread(queryClient, jarvisOwner, accountId, payload);
      });
    };

    connect();

    return () => {
      disposed = true;
      clearReconnectTimer();
      const socket = socketRef.current;
      if (socket) {
        socket.emit("unsubscribe", { owner: jarvisOwner, account_id: accountId });
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
      setJarvisStatus("disconnected");
    };
  }, [jarvisOwner, accountId, queryClient]);

  const value = useMemo<AppStreamContextValue>(
    () => ({
      indexerStatus,
      indexerLive: indexerStatus === "open",
      jarvisStatus,
    }),
    [indexerStatus, jarvisStatus],
  );

  return (
    <AppStreamContext.Provider value={value}>
      <IndexerChannelRegistryContext.Provider value={setIndexerSubscriberChannels}>
        {children}
      </IndexerChannelRegistryContext.Provider>
    </AppStreamContext.Provider>
  );
}

const IndexerChannelRegistryContext = createContext<
  ((subscriberId: string, channels: readonly string[]) => void) | null
>(null);

export function useIndexerStream() {
  const { indexerStatus, indexerLive } = useContext(AppStreamContext);
  return {
    status: indexerStatus,
    isLive: indexerLive,
  };
}

export function useJarvisStream() {
  const { jarvisStatus } = useContext(AppStreamContext);
  return { connectionState: jarvisStatus };
}

export function useIndexerChannelSubscription(
  channels: string[],
  enabled = true,
): void {
  const setSubscriberChannels = useContext(IndexerChannelRegistryContext);
  const subscriberId = useId();

  useEffect(() => {
    if (!setSubscriberChannels) return;
    if (!enabled || channels.length === 0) {
      setSubscriberChannels(subscriberId, []);
      return;
    }

    setSubscriberChannels(subscriberId, channels);
    return () => {
      setSubscriberChannels(subscriberId, []);
    };
  }, [setSubscriberChannels, subscriberId, enabled, channels.join("|")]);
}

/** @deprecated Use AppStreamProvider */
export const IndexerStreamProvider = AppStreamProvider;
