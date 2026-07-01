import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  TrendingUp,
  Unplug,
} from "lucide-react";
import { ConfirmDialog } from "@/components/leverx/ConfirmDialog";
import { CopyField } from "@/components/leverx/CopyField";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { leverxInfo } from "@/lib/leverx/info-copy";
import {
  isTelegramConfigured,
  useConnectTelegram,
  useTelegramSubscription,
} from "@/hooks/useTelegramSubscription";
import {
  useGenerateTelegramOtp,
  useRevokeTelegramTradingSession,
  useTelegramTradingSession,
} from "@/hooks/useTelegramTradingAuth";
import { labelCaps, pillIconBtn, pillToggleIdle, tradeSurface } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

type Props = {
  owner: string;
  accountId: string;
  className?: string;
};

function formatSubDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatExpiry(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "relative inline-flex h-2 w-2 rounded-full",
        active ? "bg-success" : "bg-muted-foreground/40",
      )}
    >
      {active ? (
        <span className="absolute inset-0 animate-ping rounded-full bg-success/60 opacity-75" />
      ) : null}
    </span>
  );
}

function FeatureCard({
  title,
  info,
  infoTitle,
  icon: Icon,
  active,
  activeLabel,
  action,
  children,
}: {
  title: string;
  info: string;
  infoTitle: string;
  icon: typeof Bell;
  active?: boolean;
  activeLabel?: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-card">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/30">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <LabelWithInfo
                  label={title}
                  labelClassName={labelCaps}
                  info={info}
                  infoTitle={infoTitle}
                />
                {active && activeLabel ? (
                  <Badge
                    variant="outline"
                    className="gap-1.5 border-success/30 bg-success/10 px-2 py-0 text-[10px] font-medium text-success"
                  >
                    <StatusDot active />
                    {activeLabel}
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
          {action}
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

export function PortfolioTelegramPanel({ owner, accountId, className }: Props) {
  const { data, isLoading, isError } = useTelegramSubscription(owner, accountId);
  const sessionQuery = useTelegramTradingSession(owner, accountId);
  const connect = useConnectTelegram(owner, accountId);
  const generateOtp = useGenerateTelegramOtp(owner, accountId);
  const revokeSession = useRevokeTelegramTradingSession(owner, accountId);

  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [otp, setOtp] = useState<{ code: string; expires_at_ms: number } | null>(null);

  const configured = isTelegramConfigured(data);
  const subscribed = Boolean(data?.subscribed);
  const botUsername = data?.bot_username?.replace(/^@/, "") ?? null;
  const botUrl = botUsername ? `https://t.me/${botUsername}` : null;
  const session = sessionQuery.data;
  const sessionActive = Boolean(session?.active);
  const sessionLoading = sessionQuery.isLoading;

  const handleGenerateOtp = async () => {
    const result = await generateOtp.mutateAsync();
    setOtp(result);
  };

  const openOtpDialog = () => {
    setOtp(null);
    setOtpDialogOpen(true);
  };

  return (
    <>
      <section className={cn(tradeSurface, "overflow-hidden", className)}>
        <div className="border-b border-border px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
                <Send className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-0.5">
                <p className={labelCaps}>Integrations</p>
                <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  Telegram
                </h3>
                <p className="text-sm text-muted-foreground">
                  Alerts and trading from Telegram on this account
                </p>
              </div>
            </div>
            {botUrl ? (
              <a
                href={botUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  pillIconBtn,
                  pillToggleIdle,
                  "self-start border border-border bg-muted/20 text-sm",
                )}
              >
                @{botUsername}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {!configured && !isLoading ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
              Telegram isn&apos;t set up on this server yet.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <FeatureCard
                title="Alerts"
                info={leverxInfo.telegramAlerts}
                infoTitle="Telegram alerts"
                icon={Bell}
                active={subscribed}
                activeLabel="Subscribed"
                action={
                  <button
                    type="button"
                    className={cn(pillIconBtn, pillToggleIdle, "text-sm")}
                    disabled={!configured || connect.isPending || isLoading || isError}
                    onClick={() => connect.mutate()}
                  >
                    {connect.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Bell className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {connect.isPending
                      ? "Opening…"
                      : subscribed
                        ? "Link another chat"
                        : "Subscribe"}
                  </button>
                }
              >
                {isLoading ? (
                  <LoadingState label="Checking alerts…" compact />
                ) : isError ? (
                  <p>Could not load alert status.</p>
                ) : (
                  <>
                    <p>
                      Limit fills, liquidation risk, and completed liquidations — delivered to
                      Telegram.
                    </p>
                    {subscribed && data?.subscriptions?.length ? (
                      <ul className="mt-3 space-y-2">
                        {data.subscriptions.map((sub) => (
                          <li
                            key={`${sub.chat_id}:${sub.account_id}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/15 px-3 py-2 text-xs"
                          >
                            <span className="font-medium text-foreground">
                              {sub.telegram_username
                                ? `@${sub.telegram_username}`
                                : `Chat …${sub.chat_id.slice(-4)}`}
                            </span>
                            <span className="text-muted-foreground">
                              since {formatSubDate(sub.subscribed_at_ms)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs">
                        Tap Subscribe, then press Start in the bot to link this account.
                      </p>
                    )}
                  </>
                )}
              </FeatureCard>

              <FeatureCard
                title="Chat trading"
                info={leverxInfo.telegramTrading}
                infoTitle="Telegram trading"
                icon={TrendingUp}
                active={sessionActive}
                activeLabel="Connected"
                action={
                  sessionActive ? (
                    <button
                      type="button"
                      className={cn(
                        pillIconBtn,
                        "border border-destructive/35 bg-destructive/10 text-sm text-destructive",
                        "hover:border-destructive/50 hover:bg-destructive/15",
                      )}
                      disabled={revokeSession.isPending || !configured}
                      onClick={() => setDisconnectOpen(true)}
                    >
                      {revokeSession.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Unplug className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Disconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={cn(pillIconBtn, pillToggleIdle, "text-sm")}
                      disabled={!configured || sessionLoading}
                      onClick={openOtpDialog}
                    >
                      <Send className="h-3.5 w-3.5" aria-hidden />
                      Connect
                    </button>
                  )
                }
              >
                {sessionLoading ? (
                  <LoadingState label="Checking session…" compact />
                ) : sessionActive && session ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      <div className="min-w-0 text-xs leading-relaxed">
                        <p className="font-medium text-foreground">
                          Authorized until {formatExpiry(session.expires_at_ms ?? 0)}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {session.telegram_username
                            ? `@${session.telegram_username}`
                            : session.chat_id
                              ? `Chat …${session.chat_id.slice(-4)}`
                              : "Telegram chat"}{" "}
                          can place trades on this account.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-2 text-xs sm:grid-cols-2">
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <p className={labelCaps}>Active market</p>
                        <p className="mt-1 font-mono text-foreground">
                          {session.active_oracle_id
                            ? shortId(session.active_oracle_id)
                            : "Not set — /markets in bot"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <p className={labelCaps}>Quick command</p>
                        <p className="mt-1 font-mono text-foreground">/up 10 4x</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>
                    Generate a one-time code in the app, authenticate in Telegram, then trade with{" "}
                    <span className="font-mono text-foreground">/markets</span> and{" "}
                    <span className="font-mono text-foreground">/up</span>. Sessions last 7 days.
                  </p>
                )}
              </FeatureCard>
            </div>
          )}
        </div>
      </section>

      <ResponsiveModal
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        title={
          <span className="inline-flex items-center gap-2.5">
            <Send className="h-4 w-4 text-muted-foreground" aria-hidden />
            Connect Telegram trading
          </span>
        }
        description="Link this trading account to your Telegram chat for secure bot trading."
        className="max-w-md"
      >
        {otp ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/15 p-4">
              <p className="text-sm text-muted-foreground">
                Send this in{" "}
                {botUrl ? (
                  <a
                    href={botUrl}
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    @{botUsername}
                  </a>
                ) : (
                  "the LeverX bot"
                )}
                :
              </p>
              <p className="mt-2 font-mono text-lg font-semibold tracking-widest text-foreground">
                /auth {otp.code}
              </p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                Code expires in 10 minutes · session lasts 7 days
              </p>
            </div>
            <CopyField label="Auth code" value={otp.code} className="bg-card/80" />
            <ol className="space-y-1.5 text-xs text-muted-foreground">
              <li>1. Open the bot and send /auth with the code (or paste the code).</li>
              <li>2. Deposit dUSDC to your trading account on the web.</li>
              <li>3. Send /markets, pick a market, then /up 10 4x.</li>
            </ol>
            <button
              type="button"
              className={cn(pillIconBtn, pillToggleIdle, "w-full justify-center")}
              onClick={() => setOtpDialogOpen(false)}
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Trades run through the platform trading service. Deposit dUSDC to your account
              before connecting.
            </p>
            <button
              type="button"
              className={cn(pillIconBtn, pillToggleIdle, "w-full justify-center")}
              disabled={generateOtp.isPending}
              onClick={() => void handleGenerateOtp()}
            >
              {generateOtp.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Send className="h-4 w-4" aria-hidden />
              )}
              {generateOtp.isPending ? "Generating code…" : "Generate auth code"}
            </button>
          </div>
        )}
      </ResponsiveModal>

      <ConfirmDialog
        open={disconnectOpen}
        onOpenChange={setDisconnectOpen}
        title="Disconnect Telegram trading?"
        description="This chat will no longer be able to place trades on your account. You can reconnect anytime with a new auth code."
        confirmLabel="Disconnect session"
        variant="destructive"
        pending={revokeSession.isPending}
        onConfirm={() => {
          revokeSession.mutate(undefined, {
            onSuccess: () => {
              setDisconnectOpen(false);
              setOtp(null);
            },
          });
        }}
      >
        {session?.telegram_username ? (
          <p className="text-sm text-muted-foreground">
            Connected as{" "}
            <span className="font-medium text-foreground">@{session.telegram_username}</span>
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
