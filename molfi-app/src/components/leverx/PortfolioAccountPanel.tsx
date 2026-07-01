import { Wallet } from "lucide-react";
import { CopyField } from "@/components/leverx/CopyField";
import { PortfolioTelegramPanel } from "@/components/leverx/PortfolioTelegramPanel";
import { PortfolioTradingServicePanel } from "@/components/leverx/PortfolioTradingServicePanel";
import { InfoPopover, LabelWithInfo } from "@/components/leverx/InfoPopover";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { PortfolioFundsSection } from "@/components/leverx/PortfolioFundsSection";
import { Badge } from "@/components/ui/badge";
import { useTradingAccountBalance } from "@/hooks/useTradingAccountBalance";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { ui } from "@/lib/copy";
import type { LeveragedPosition, UserProxy } from "@/lib/leverx/indexer-client";
import { labelCaps, tradeSurface } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  account: UserProxy;
  owner: string;
  positions?: readonly LeveragedPosition[];
  allPositions?: readonly LeveragedPosition[];
  className?: string;
}

export function PortfolioAccountPanel({
  account,
  owner,
  positions = [],
  allPositions,
  className,
}: Props) {
  const accountId = account.account_id;
  const history = allPositions ?? positions;
  const managerLinked = Boolean(account.predict_manager_id);
  const { usd: tradingBalanceUsd, isLoading: tradingBalanceLoading } =
    useTradingAccountBalance(accountId);

  return (
    <div className={cn("space-y-4", className)}>
      <section className={cn(tradeSurface, "overflow-hidden")}>
        <div className="border-b border-border px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/30">
                <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className={labelCaps}>Account</p>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                    Trading account
                  </h3>
                  <InfoPopover title="Trading account">{leverxInfo.accountSettings}</InfoPopover>
                  <Badge
                    variant="outline"
                    className={cn(
                      "gap-1.5 border px-2 py-0 text-[10px] font-medium",
                      managerLinked
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        managerLinked ? "bg-success" : "bg-amber-500",
                      )}
                    />
                    {managerLinked ? "Ready to trade" : "Opens on first trade"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your wallet, account details, and connected apps.
                </p>
              </div>
            </div>
            <div className="min-w-0 sm:text-right">
              <LabelWithInfo
                label={ui.predictManagerBalance}
                labelClassName={labelCaps}
                info={leverxInfo.balanceTradingAccount}
                infoTitle={ui.predictManagerBalance}
                className="sm:justify-end"
              />
              <p className="mt-1 font-mono text-2xl tabular-nums text-foreground">
                {tradingBalanceLoading ? (
                  "…"
                ) : (
                  <QuoteAmount amount={tradingBalanceUsd} digits={2} hideZero={false} />
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4 sm:px-5">
          <CopyField
            label="Wallet address"
            value={owner}
            hint="Send dUSDC to this address, then deposit into your trading account."
            className="border-border/70 bg-muted/15"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <CopyField
              label="Account ID"
              value={account.account_id}
              className="border-border/70 bg-muted/15"
            />
            {managerLinked && account.predict_manager_id ? (
              <CopyField
                label="Settlement account"
                value={account.predict_manager_id}
                className="border-border/70 bg-muted/15"
              />
            ) : (
              <div className="flex min-h-[4.25rem] min-w-0 flex-col justify-center rounded-md border border-dashed border-border/80 bg-muted/15 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Settlement account
                </p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  Created automatically when you place your first trade
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <PortfolioTradingServicePanel accountId={accountId} />

      <PortfolioFundsSection
        accountId={accountId}
        borrowedQuote={account.borrowed_quote}
        positions={history}
      />

      <PortfolioTelegramPanel owner={owner} accountId={accountId} />
    </div>
  );
}
