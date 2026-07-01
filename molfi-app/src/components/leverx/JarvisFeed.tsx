import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  Loader2,
  Moon,
  Power,
  Search,
  ShieldAlert,
  SkipForward,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCircle,
  Wallet,
  XCircle,
} from "lucide-react";
import type { JarvisEventType } from "@/lib/leverx/keeper-client";
import { cn } from "@/lib/utils";

export type JarvisEventStyle = {
  icon: LucideIcon;
  bubble: string;
  label: string;
  glow?: string;
};

const WARNING_BUBBLE =
  "border-amber-500/35 bg-amber-500/10 text-foreground";

const EVENT_STYLES: Record<JarvisEventType, JarvisEventStyle> = {
  welcome: {
    icon: Sparkles,
    label: "Welcome",
    bubble:
      "border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-card to-card text-foreground",
    glow: "shadow-[0_0_24px_-8px] shadow-violet-500/40",
  },
  enabled: {
    icon: Power,
    label: "Activated",
    bubble: "border-emerald-500/35 bg-emerald-500/10 text-foreground",
  },
  disabled: {
    icon: Moon,
    label: "Paused",
    bubble: "border-border bg-muted/40 text-muted-foreground",
  },
  startup: {
    icon: Bot,
    label: "Starting",
    bubble: "border-sky-500/30 bg-sky-500/8 text-foreground",
  },
  running: {
    icon: Activity,
    label: "Update",
    bubble: "border-border bg-card text-foreground",
  },
  analyzing_trades: {
    icon: Brain,
    label: "Positions",
    bubble: "border-indigo-500/30 bg-indigo-500/8 text-foreground",
  },
  closing_position: {
    icon: TrendingDown,
    label: "Closing",
    bubble: "border-rose-500/35 bg-rose-500/10 text-foreground",
    glow: "shadow-[0_0_20px_-10px] shadow-rose-500/50",
  },
  repaying_debt: {
    icon: Wallet,
    label: "Paying down borrow",
    bubble: "border-amber-500/35 bg-amber-500/10 text-foreground",
  },
  analyzing_markets: {
    icon: Search,
    label: "Markets",
    bubble: "border-cyan-500/30 bg-cyan-500/8 text-foreground",
  },
  opening_position: {
    icon: TrendingUp,
    label: "Opening",
    bubble: "border-emerald-500/35 bg-emerald-500/10 text-foreground",
    glow: "shadow-[0_0_24px_-8px] shadow-emerald-500/45",
  },
  idle: {
    icon: Moon,
    label: "Waiting",
    bubble: "border-border bg-muted/30 text-muted-foreground",
  },
  cycle_complete: {
    icon: CheckCircle2,
    label: "Idle",
    bubble: "border-border bg-card/80 text-muted-foreground",
  },
  account_required: {
    icon: UserCircle,
    label: "Account needed",
    bubble: WARNING_BUBBLE,
  },
  no_funds: {
    icon: Wallet,
    label: "No funds",
    bubble: WARNING_BUBBLE,
  },
  low_balance: {
    icon: Wallet,
    label: "Low balance",
    bubble: WARNING_BUBBLE,
  },
  executor_required: {
    icon: ShieldAlert,
    label: "Setup needed",
    bubble: WARNING_BUBBLE,
  },
  skipped: {
    icon: SkipForward,
    label: "Skipped",
    bubble: "border-border bg-muted/30 text-muted-foreground",
  },
  error: {
    icon: AlertTriangle,
    label: "Error",
    bubble: "border-destructive/40 bg-destructive/10 text-foreground",
    glow: "shadow-[0_0_20px_-10px] shadow-destructive/40",
  },
};

export function jarvisEventStyle(type: JarvisEventType): JarvisEventStyle {
  return EVENT_STYLES[type] ?? EVENT_STYLES.running;
}

export function formatJarvisTime(ms: string): string {
  const date = new Date(Number(ms));
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JarvisTypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
      Jarvis is thinking…
    </div>
  );
}

export function JarvisEventBubble({
  eventType,
  message,
  timestamp,
  unread,
  className,
}: {
  eventType: JarvisEventType;
  message: string;
  timestamp: string;
  unread?: boolean;
  className?: string;
}) {
  const style = jarvisEventStyle(eventType);
  const Icon = style.icon;
  const isWarning =
    eventType === "account_required" ||
    eventType === "no_funds" ||
    eventType === "low_balance" ||
    eventType === "executor_required";

  return (
    <article
      className={cn(
        "relative flex gap-3 rounded-2xl border px-4 py-3 transition-all",
        style.bubble,
        style.glow,
        unread && "ring-1 ring-violet-400/30",
        className,
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/60">
        <Icon
          className={cn(
            "h-4 w-4",
            eventType === "error" ? "text-destructive" : isWarning ? "text-amber-500" : "text-violet-400",
          )}
          aria-hidden
        />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.12em]",
              eventType === "error" ? "text-destructive" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-violet-400/90",
            )}
          >
            {style.label}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {formatJarvisTime(timestamp)}
          </span>
          {unread ? (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" aria-label="Unread" />
          ) : null}
        </div>
        <p className="text-sm leading-relaxed text-foreground/95">{message}</p>
      </div>
    </article>
  );
}

export function JarvisEmptyState({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
        <Bot className="h-7 w-7 text-violet-400" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {enabled ? "Waiting for the next scan" : "Jarvis is paused"}
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {enabled
            ? "Updates appear here as Jarvis checks your account every 5 minutes."
            : "Turn on Jarvis to manage positions and look for markets closing soon."}
        </p>
      </div>
    </div>
  );
}

export function JarvisOfflineBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <XCircle className="h-3 w-3" />
      Offline
    </span>
  );
}
