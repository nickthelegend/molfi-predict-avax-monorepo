import { useMemo, useState, type ReactNode } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { PortfolioDepositDialog } from "@/components/leverx/PortfolioDepositDialog";
import { PortfolioWithdrawDialog } from "@/components/leverx/PortfolioWithdrawDialog";
import { useLeverxProtocolConfig } from "@/hooks/useLeverxTransactions";
import { useWalletCoinBalance, walletCoinBalanceUsd } from "@/hooks/useWalletCoinBalance";
import { useTradingAccountBalance } from "@/hooks/useTradingAccountBalance";
import { computeTotalBalanceUsd } from "@/lib/leverx/account-balance";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { isActiveOpenPosition } from "@/lib/leverx/position-metrics";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { ui } from "@/lib/copy";
import { scaleQuote } from "@/lib/predict/scaling";
import { labelCaps, tradeSurface } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  accountId: string;
  borrowedQuote: number;
  positions: readonly LeveragedPosition[];
  className?: string;
}

function FundsMetric({
  label,
  value,
  info,
  infoTitle,
  loading,
  hint,
}: {
  label: string;
  value: ReactNode;
  info?: string;
  infoTitle?: string;
  loading?: boolean;
  hint?: string;
}) {
  return (
    <div className="min-w-0 px-4 py-3">
      {info ? (
        <LabelWithInfo
          label={label}
          labelClassName={labelCaps}
          info={info}
          infoTitle={infoTitle ?? label}
        />
      ) : (
        <p className={labelCaps}>{label}</p>
      )}
      <div className="mt-1 min-w-0 text-base sm:text-lg">
        {loading ? (
          <span className="font-mono tabular-nums text-foreground">…</span>
        ) : (
          value
        )}
      </div>
      {hint ? (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function FundsActionButton({
  icon: Icon,
  label,
  disabled,
  onClick,
}: {
  icon: typeof ArrowDownToLine;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 text-left transition-colors",
        "hover:bg-hover/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </button>
  );
}

export function PortfolioFundsSection({
  accountId,
  borrowedQuote,
  positions,
  className,
}: Props) {
  const { cfg } = useLeverxProtocolConfig();
  const { data: walletBalance, isLoading: walletLoading } = useWalletCoinBalance(cfg?.quoteType ?? null);
  const walletUsd = walletCoinBalanceUsd(walletBalance);
  const { usd: tradingBalanceUsd, isLoading: tradingBalanceLoading } =
    useTradingAccountBalance(accountId);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const marginUsd = useMemo(
    () =>
      positions
        .filter(isActiveOpenPosition)
        .reduce((sum, position) => sum + scaleQuote(position.margin_quote), 0),
    [positions],
  );
  const borrowedUsd = scaleQuote(borrowedQuote);
  const walletReady = walletUsd != null && !walletLoading;

  const totalBalanceUsd = walletReady
    ? computeTotalBalanceUsd({
        walletUsd: walletUsd ?? 0,
        marginUsd,
        tradingAccountUsd: tradingBalanceUsd,
        borrowedUsd,
      })
    : null;

  return (
    <>
      <section className={cn(tradeSurface, "overflow-hidden", className)}>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
          <LabelWithInfo
            label="Funds"
            labelClassName={labelCaps}
            info={leverxInfo.funds}
            infoTitle="Funds"
          />
          <div className="min-w-0 sm:text-right">
            <LabelWithInfo
              label={ui.balanceTotal}
              labelClassName={labelCaps}
              info={leverxInfo.balanceTotal}
              infoTitle={ui.balanceTotal}
              className="sm:justify-end"
            />
            <p className="mt-1 font-mono text-2xl tabular-nums text-foreground sm:text-3xl">
              {totalBalanceUsd == null ? (
                "…"
              ) : (
                <QuoteAmount amount={totalBalanceUsd} digits={2} hideZero={false} />
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-y divide-border border-b border-border md:grid-cols-4 md:divide-x md:divide-y-0">
          <FundsMetric
            label={ui.balanceWallet}
            info={leverxInfo.balanceWallet}
            loading={walletLoading && walletUsd == null}
            value={
              <QuoteAmount
                amount={walletUsd ?? 0}
                quoteAtoms={walletBalance?.atoms}
                digits={2}
                hideZero={false}
              />
            }
          />
          <FundsMetric
            label={ui.predictManagerBalance}
            info={leverxInfo.balanceTradingAccount}
            infoTitle={ui.predictManagerBalance}
            loading={tradingBalanceLoading}
            value={<QuoteAmount amount={tradingBalanceUsd} digits={2} hideZero={false} />}
          />
          <FundsMetric
            label="Margin"
            info={leverxInfo.balanceMargin}
            value={<QuoteAmount amount={marginUsd} digits={2} hideZero={false} />}
          />
          <FundsMetric
            label="Borrowed"
            info={leverxInfo.balanceBorrowed}
            value={<QuoteAmount amount={borrowedUsd} digits={2} hideZero={false} />}
          />
        </div>

        <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
          <FundsActionButton
            icon={ArrowDownToLine}
            label="Deposit"
            onClick={() => setDepositOpen(true)}
          />
          <FundsActionButton
            icon={ArrowUpFromLine}
            label="Withdraw"
            onClick={() => setWithdrawOpen(true)}
          />
        </div>
      </section>

      <PortfolioDepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        accountId={accountId}
      />
      <PortfolioWithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        accountId={accountId}
      />
    </>
  );
}
