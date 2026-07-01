import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  Power,
  PowerOff,
  Settings,
  Sparkles,
} from "lucide-react";
import { JarvisEnablePasswordDialog } from "@/components/leverx/JarvisEnablePasswordDialog";
import { JarvisSettingsDialog } from "@/components/leverx/JarvisSettingsDialog";
import { InfoPopover } from "@/components/leverx/InfoPopover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import {
  isJarvisConfigured,
  useDisableJarvis,
  useEnableJarvis,
  useJarvisEvents,
  useJarvisStatus,
  useMarkJarvisRead,
  useJarvisStream,
} from "@/hooks/useJarvis";
import type { JarvisConnectionState } from "@/context/AppStreamContext";
import { leverxInfo } from "@/lib/leverx/info-copy";
import type { JarvisEventRecord, JarvisEventType } from "@/lib/leverx/keeper-client";
import { cn } from "@/lib/utils";

const WELCOME_KEY = "leverx-jarvis-welcome-seen";
const SCROLL_LOAD_THRESHOLD_PX = 48;
const NEAR_BOTTOM_THRESHOLD_PX = 80;

type Props = {
  owner: string;
  accountId: string;
  className?: string;
};

type BubbleTone = "default" | "success" | "warning" | "destructive" | "muted" | "accent";

type EventMetadata = {
  reasoning?: string;
  confidence?: number;
  leverage?: number;
  portfolio_pct?: number;
  dry_run?: boolean;
};

function parseEventMetadata(metadata: Record<string, unknown> | null): EventMetadata {
  if (!metadata) return {};
  return {
    reasoning: typeof metadata.reasoning === "string" ? metadata.reasoning : undefined,
    confidence: typeof metadata.confidence === "number" ? metadata.confidence : undefined,
    leverage: typeof metadata.leverage === "number" ? metadata.leverage : undefined,
    portfolio_pct: typeof metadata.portfolio_pct === "number" ? metadata.portfolio_pct : undefined,
    dry_run: metadata.dry_run === true,
  };
}

function bubbleTone(type: JarvisEventType, dryRun?: boolean): BubbleTone {
  if (dryRun) return "muted";
  switch (type) {
    case "welcome":
    case "enabled":
      return "accent";
    case "opening_position":
      return "success";
    case "closing_position":
    case "repaying_debt":
      return "warning";
    case "error":
      return "destructive";
    case "account_required":
    case "no_funds":
    case "low_balance":
    case "executor_required":
      return "warning";
    case "disabled":
    case "idle":
    case "skipped":
      return "muted";
    default:
      return "default";
  }
}

const BUBBLE_TONE_CLASS: Record<BubbleTone, string> = {
  default: "bg-card text-foreground",
  accent: "bg-accent/15 text-foreground",
  success: "bg-success/12 text-foreground",
  warning: "bg-warning/12 text-foreground",
  destructive: "bg-destructive/10 text-foreground",
  muted: "bg-muted/70 text-muted-foreground",
};

function formatEventTime(ms: string): string {
  const n = Number(ms);
  if (!Number.isFinite(n)) return "";
  return new Date(n).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function headerSubtitle(args: {
  configured: boolean;
  enabled: boolean;
  connectionState: JarvisConnectionState;
  nextRunAtMs?: number | null;
}): string {
  const { configured, enabled, connectionState, nextRunAtMs } = args;
  if (!configured) return "Unavailable on this server";
  if (!enabled) return "Paused — turn on to start scanning";
  if (connectionState === "connecting") return "Reconnecting…";
  if (connectionState === "connected") {
    if (nextRunAtMs) {
      const time = new Date(nextRunAtMs).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `Online · next scan ${time}`;
    }
    return "Online";
  }
  return "Offline";
}

function ChatSystemLine({ children }: { children: ReactNode; }) {
  return (
    <div className="flex justify-center py-1.5">
      <span className="rounded-md bg-background/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm">
        {children}
      </span>
    </div>
  );
}

function MessageBubble({ event }: { event: JarvisEventRecord; }) {
  const meta = parseEventMetadata(event.metadata);
  const isDryRun =
    meta.dry_run ||
    event.message.startsWith("[DRY RUN]") ||
    event.message.toLowerCase().includes("dry run");
  const tone = bubbleTone(event.event_type, isDryRun);
  const [whyOpen, setWhyOpen] = useState(false);
  const hasWhy =
    Boolean(meta.reasoning) ||
    meta.confidence != null ||
    meta.leverage != null ||
    meta.portfolio_pct != null;

  return (
    <article className="flex max-w-[min(100%,22rem)] flex-col self-start">
      <div
        className={cn(
          "jarvis-chat-bubble relative rounded-lg rounded-tl-sm px-2.5 py-1.5 shadow-sm",
          BUBBLE_TONE_CLASS[tone],
          isDryRun && "border border-dashed border-border/70",
          !event.read && "ring-1 ring-accent/25",
        )}
      >
        {isDryRun ? (
          <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Simulated
          </p>
        ) : null}
        <p className="whitespace-pre-wrap text-[13px] leading-snug text-foreground">{event.message}</p>
        {hasWhy ? (
          <div className="mt-1 border-t border-border/40 pt-1">
            <button
              type="button"
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent"
              onClick={() => setWhyOpen((v) => !v)}
            >
              Why?
              <ChevronDown className={cn("h-3 w-3 transition-transform", whyOpen && "rotate-180")} />
            </button>
            {whyOpen ? (
              <div className="mt-1 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                {meta.confidence != null ? <p>Confidence: {meta.confidence}%</p> : null}
                {meta.leverage != null ? <p>Leverage: {meta.leverage}×</p> : null}
                {meta.portfolio_pct != null ? <p>Portfolio: {meta.portfolio_pct}%</p> : null}
                {meta.reasoning ? <p>{meta.reasoning}</p> : null}
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-0.5 flex justify-end">
          <time className="text-[10px] leading-none text-muted-foreground/80">
            {formatEventTime(event.created_at_ms)}
          </time>
        </div>
      </div>
    </article>
  );
}

function ChatHeader({
  configured,
  enabled,
  connectionState,
  toggleBusy,
  nextRunAtMs,
  unreadCount,
  onSettings,
  onToggle,
}: {
  configured: boolean;
  enabled: boolean;
  connectionState: JarvisConnectionState;
  toggleBusy: boolean;
  nextRunAtMs?: number | null;
  unreadCount: number;
  onSettings: () => void;
  onToggle: () => void;
}) {
  const subtitle = headerSubtitle({ configured, enabled, connectionState, nextRunAtMs });

  return (
    <header className="jarvis-chat-header flex h-[50px] min-h-[50px] max-h-[50px] shrink-0 items-center">
      <div className="mx-auto flex w-full max-w-[500px] items-center gap-2.5 px-2.5 sm:px-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
          <Sparkles className="h-4 w-4 text-accent" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-semibold leading-none text-foreground">Jarvis</p>
            <InfoPopover title="AI trading assistant" iconClassName="h-3.5 w-3.5">
              {leverxInfo.jarvis}
            </InfoPopover>
            {enabled && connectionState === "connected" ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-[11px] leading-none text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {unreadCount > 0 ? (
            <Badge variant="secondary" className="mr-0.5 hidden h-5 px-1.5 text-[10px] sm:inline-flex">
              {unreadCount}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!configured}
            aria-label="Trading limits"
            onClick={onSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={!configured || toggleBusy}
            aria-label={enabled ? "Turn Jarvis off" : "Turn Jarvis on"}
            onClick={onToggle}
          >
            {toggleBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : enabled ? (
              <PowerOff className="h-4 w-4" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

export function JarvisWorkspace({ owner, accountId, className }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const initialScrollRef = useRef(true);
  const pendingPrependRef = useRef<{ scrollHeight: number; scrollTop: number; } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [enablePasswordOpen, setEnablePasswordOpen] = useState(false);
  const [showScrollFab, setShowScrollFab] = useState(false);
  const welcomeSeen =
    typeof window !== "undefined" && localStorage.getItem(WELCOME_KEY) === "1";

  const { data: status, isLoading: statusLoading } = useJarvisStatus(owner, accountId);
  const {
    data: eventsData,
    isLoading: eventsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useJarvisEvents(owner, accountId);
  const enableJarvis = useEnableJarvis();
  const disableJarvis = useDisableJarvis();
  const markRead = useMarkJarvisRead();
  const { connectionState } = useJarvisStream();

  const events = useMemo(() => {
    const map = new Map<string, JarvisEventRecord>();
    for (const page of eventsData?.pages ?? []) {
      for (const event of page) {
        map.set(event.id, event);
      }
    }
    return [...map.values()];
  }, [eventsData]);

  const displayEvents = useMemo(
    () => [...events].sort((a, b) => Number(a.created_at_ms) - Number(b.created_at_ms)),
    [events],
  );

  const showWelcome = !welcomeSeen && !status?.enabled && displayEvents.length === 0;
  const toggleBusy = enableJarvis.isPending || disableJarvis.isPending;
  const configured = isJarvisConfigured() && (status?.configured ?? true);
  const unreadCount = status?.unread_count ?? 0;

  useEffect(() => {
    if (!owner || !accountId || !unreadCount) return;
    const timer = window.setTimeout(() => {
      markRead.mutate({ owner, accountId });
    }, 800);
    return () => window.clearTimeout(timer);
  }, [owner, accountId, unreadCount, markRead]);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = feedRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
    stickToBottomRef.current = true;
    setShowScrollFab(false);
  }, []);

  const handleFeedScroll = useCallback(() => {
    const el = feedRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD_PX;
    stickToBottomRef.current = nearBottom;
    setShowScrollFab(!nearBottom);

    if (el.scrollTop <= SCROLL_LOAD_THRESHOLD_PX && hasNextPage && !isFetchingNextPage) {
      pendingPrependRef.current = {
        scrollHeight: el.scrollHeight,
        scrollTop: el.scrollTop,
      };
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useLayoutEffect(() => {
    const el = feedRef.current;
    if (!el) return;

    const pending = pendingPrependRef.current;
    if (pending) {
      el.scrollTop = pending.scrollTop + (el.scrollHeight - pending.scrollHeight);
      pendingPrependRef.current = null;
      return;
    }

    if (stickToBottomRef.current || initialScrollRef.current) {
      el.scrollTop = el.scrollHeight;
      initialScrollRef.current = false;
      setShowScrollFab(false);
    }
  }, [displayEvents, isFetchingNextPage]);

  const handleToggle = () => {
    if (!configured || toggleBusy) return;
    if (status?.enabled) {
      disableJarvis.mutate({ owner, accountId });
      return;
    }
    setEnablePasswordOpen(true);
  };

  const handleEnableConfirm = () => {
    localStorage.setItem(WELCOME_KEY, "1");
    enableJarvis.mutate(
      { owner, accountId },
      {
        onSuccess: () => setEnablePasswordOpen(false),
      },
    );
  };

  return (
    <div className={cn("jarvis-chat flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <JarvisSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        owner={owner}
        accountId={accountId}
      />

      <JarvisEnablePasswordDialog
        open={enablePasswordOpen}
        onOpenChange={setEnablePasswordOpen}
        busy={enableJarvis.isPending}
        onConfirm={handleEnableConfirm}
      />

      <ChatHeader
        configured={configured}
        enabled={status?.enabled ?? false}
        connectionState={connectionState}
        toggleBusy={toggleBusy}
        nextRunAtMs={status?.next_run_at_ms}
        unreadCount={unreadCount}
        onSettings={() => setSettingsOpen(true)}
        onToggle={handleToggle}
      />

      <div className="jarvis-chat-feed relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={feedRef}
          onScroll={handleFeedScroll}
          className="jarvis-activity-feed flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain py-2 touch-pan-y"
        >
          <div className="mx-auto flex w-full max-w-[500px] flex-col gap-1 px-2.5 sm:px-3">
            {isFetchingNextPage ? (
              <div className="flex justify-center py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" aria-hidden />
                <span className="sr-only">Loading earlier messages</span>
              </div>
            ) : hasNextPage && displayEvents.length > 0 ? (
              <ChatSystemLine>Scroll up for earlier messages</ChatSystemLine>
            ) : displayEvents.length > 0 ? (
              <ChatSystemLine>Start of conversation</ChatSystemLine>
            ) : null}

            {showWelcome ? <WelcomeMessage /> : null}

            {statusLoading || eventsLoading ? (
              <LoadingState compact label="Loading messages…" />
            ) : displayEvents.length === 0 ? (
              <EmptyFeed enabled={status?.enabled ?? false} configured={configured} />
            ) : (
              displayEvents.map((event) => <MessageBubble key={event.id} event={event} />)
            )}
          </div>
        </div>

        {showScrollFab ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-15 z-10 px-2.5 sm:px-3 max-md:bottom-[calc(50px+0.75rem+env(safe-area-inset-bottom,0))]">
            <div className="relative mx-auto w-full max-w-[500px]">
              <button
                type="button"
                className="pointer-events-auto absolute right-0 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-transform hover:scale-105 active:scale-95"
                aria-label="Jump to latest messages"
                onClick={() => scrollToBottom(true)}
              >
                <ChevronDown className="h-5 w-5" aria-hidden />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WelcomeMessage() {
  return (
    <ChatSystemLine>
      <span className="inline-flex items-center gap-1">
        <Sparkles className="h-3 w-3" aria-hidden />
        Turn on Jarvis to start
      </span>
    </ChatSystemLine>
  );
}

function EmptyFeed({ enabled, configured }: { enabled: boolean; configured: boolean; }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm">
        <Bot className="h-6 w-6 text-muted-foreground/60" aria-hidden />
      </span>
      <p className="max-w-xs text-[13px] leading-snug text-muted-foreground">
        {!configured
          ? "Jarvis isn't available on this server yet."
          : enabled
            ? "Jarvis is running. Updates will appear here after the first scan."
            : "Turn on Jarvis to see trades and decisions here."}
      </p>
      {configured ? (
        <p className="max-w-xs text-[11px] text-muted-foreground/80">{leverxInfo.jarvisExecutor}</p>
      ) : null}
    </div>
  );
}
