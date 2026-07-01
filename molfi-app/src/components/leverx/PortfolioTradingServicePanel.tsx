import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2, ShieldCheck, Unplug } from "lucide-react";
import { ConfirmDialog } from "@/components/leverx/ConfirmDialog";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { useIndexerExecutors, useIndexerProtocol } from "@/hooks/useIndexer";
import { useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { appConfig } from "@/lib/config";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { labelCaps, pillIconBtn, pillToggleIdle, tradeSurface } from "@/lib/leverx/tw";
import { showTxError, showTxSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

type Props = {
  accountId: string;
  className?: string;
};

function shortAddress(addr: string): string {
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function resolveKeeperAddress(protocolKeeper?: string | null): string | null {
  const keeper = protocolKeeper?.trim() || appConfig.keeperAddress?.trim();
  return keeper || null;
}

export function PortfolioTradingServicePanel({ accountId, className }: Props) {
  const { data: protocol } = useIndexerProtocol();
  const { data: executors = [], isLoading: executorsLoading } = useIndexerExecutors(accountId);
  const { registerExecutor, revokeExecutor } = useLeverxTransactions();

  const [disableOpen, setDisableOpen] = useState(false);

  const keeperAddress = resolveKeeperAddress(protocol?.keeper_address);
  const keeperRegistered = useMemo(() => {
    if (!keeperAddress) return false;
    const normalized = keeperAddress.toLowerCase();
    return executors.some((row) => row.executor?.trim().toLowerCase() === normalized);
  }, [executors, keeperAddress]);

  const pending = registerExecutor.isPending || revokeExecutor.isPending;

  const onEnable = () => {
    if (!keeperAddress || pending) return;
    registerExecutor.mutate(
      { accountId, executor: keeperAddress },
      {
        onSuccess: () => {
          showTxSuccess("Trading service enabled on your account");
        },
        onError: showTxError,
      },
    );
  };

  const onDisable = () => {
    if (!keeperAddress || pending) return;
    revokeExecutor.mutate(
      { accountId, executor: keeperAddress },
      {
        onSuccess: () => {
          showTxSuccess("Trading service removed from your account");
          setDisableOpen(false);
        },
        onError: showTxError,
      },
    );
  };

  return (
    <>
      <section className={cn(tradeSurface, "overflow-hidden", className)}>
        <div className="border-b border-border px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
                <Bot className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className={labelCaps}>Automation</p>
                <div className="flex flex-wrap items-center gap-2">
                  <LabelWithInfo
                    label="Trading service"
                    labelClassName="text-base font-semibold tracking-tight text-foreground sm:text-lg normal-case"
                    info={leverxInfo.tradingServiceExecutor}
                    infoTitle="Trading service executor"
                  />
                  {keeperAddress && !executorsLoading ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "gap-1.5 border px-2 py-0 text-[10px] font-medium",
                        keeperRegistered
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          keeperRegistered ? "bg-success" : "bg-amber-500",
                        )}
                      />
                      {keeperRegistered ? "Enabled" : "Not enabled"}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  Allow the platform trading service to execute trades on this account.
                </p>
              </div>
            </div>

            {keeperAddress ? (
              <div className="flex shrink-0 flex-wrap gap-2 self-start">
                {keeperRegistered ? (
                  <button
                    type="button"
                    className={cn(
                      pillIconBtn,
                      "border border-destructive/35 bg-destructive/10 text-sm text-destructive",
                      "hover:border-destructive/50 hover:bg-destructive/15",
                    )}
                    disabled={pending}
                    onClick={() => setDisableOpen(true)}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Unplug className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    className={cn(pillIconBtn, pillToggleIdle, "text-sm")}
                    disabled={pending || executorsLoading}
                    onClick={onEnable}
                  >
                    {pending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {pending ? "Confirm in wallet…" : "Enable trading service"}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          {!keeperAddress ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
              Trading service address isn&apos;t available yet. Try again once protocol settings
              have synced.
            </p>
          ) : executorsLoading ? (
            <LoadingState label="Checking executor status…" compact />
          ) : keeperRegistered ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                <div className="min-w-0 text-sm leading-relaxed">
                  <p className="font-medium text-foreground">Trading service is authorized</p>
                  <p className="mt-1 text-muted-foreground">
                    Jarvis, Telegram trading, and automated limit fills can place trades on this
                    account. Remove access anytime — your wallet stays in control.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5">
                <p className={labelCaps}>Service address</p>
                <p className="mt-1 font-mono text-xs text-foreground">{shortAddress(keeperAddress)}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                Enable the trading service so Jarvis, Telegram, and limit-order automation can
                trade without your wallet signing every order.
              </p>
              <ul className="space-y-1.5 text-xs">
                <li>• Required for Jarvis and Telegram chat trading</li>
                <li>• Lets the keeper fill your resting limit orders</li>
                <li>• Revoke anytime with one wallet transaction</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        title="Remove trading service?"
        description="Jarvis, Telegram trading, and automated limit fills will stop until you enable the trading service again."
        confirmLabel="Remove access"
        variant="destructive"
        pending={revokeExecutor.isPending}
        onConfirm={onDisable}
      />
    </>
  );
}
