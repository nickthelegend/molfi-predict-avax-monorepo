import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Wallet } from "lucide-react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { AnimatedCount } from "@/components/ui/animated-numbers";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { computeTotalBalanceUsd } from "@/lib/leverx/account-balance";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { isActiveOpenPosition } from "@/lib/leverx/position-metrics";
import { resolveAccountId } from "@/lib/leverx/account-resolution";
import { useTradingAccountBalance } from "@/hooks/useTradingAccountBalance";
import { useWallet } from "@/context/WalletContext";
import { useIndexerAccounts, useIndexerPositions } from "@/hooks/useIndexer";
import { useWalletCoinBalance, walletCoinBalanceUsd } from "@/hooks/useWalletCoinBalance";
import { ui } from "@/lib/copy";
import { appConfig } from "@/lib/config";
import {
  DATA_PLACEHOLDER,
} from "@/lib/leverx/placeholders";
import { scaleQuote } from "@/lib/predict/scaling";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

function BalanceRow({
  label,
  value,
  info,
}: {
  label: string;
  value: ReactNode;
  info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm text-muted-foreground">
      {info ? <LabelWithInfo label={label} info={info} /> : <span>{label}</span>}
      <span className="font-mono tabular-nums text-foreground">{value}</span>
    </div>
  );
}

export function BalanceBreakdown({ className }: Props) {
  const { address, isWalletConnected } = useWallet();
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isFetched: accountsFetched,
  } = useIndexerAccounts(address ?? undefined);
  const {
    data: positions = [],
    isLoading: positionsLoading,
    isFetched: positionsFetched,
  } = useIndexerPositions(address ?? undefined, { status: "open" });
  const {
    data: closedPositions = [],
    isLoading: closedPositionsLoading,
    isFetched: closedPositionsFetched,
  } = useIndexerPositions(address ?? undefined, { status: "closed" });
  const {
    data: walletBalance,
    isLoading: walletBalanceLoading,
    isFetched: walletBalanceFetched,
  } = useWalletCoinBalance(isWalletConnected ? appConfig.quoteType : null, 6);

  const accountId = useMemo(
    () => resolveAccountId(accounts, [...positions, ...closedPositions]),
    [accounts, positions, closedPositions],
  );
  const { usd: tradingBalanceUsd, isLoading: tradingBalanceLoading } =
    useTradingAccountBalance(accountId);

  const ready =
    isWalletConnected &&
    accountsFetched &&
    positionsFetched &&
    closedPositionsFetched &&
    !accountsLoading &&
    !positionsLoading &&
    !closedPositionsLoading;
  const walletUsd = walletCoinBalanceUsd(walletBalance);
  const walletReady =
    isWalletConnected && walletBalanceFetched && !walletBalanceLoading && walletUsd != null;

  const activePositions = useMemo(
    () => positions.filter(isActiveOpenPosition),
    [positions],
  );

  const margin = ready
    ? activePositions.reduce((sum, p) => sum + scaleQuote(p.margin_quote), 0)
    : null;
  const borrowed = ready ? scaleQuote(accounts[0]?.borrowed_quote ?? 0) : null;
  const positionCount = ready ? activePositions.length : null;

  const tradingBalanceRowLoading =
    isWalletConnected && Boolean(accountId) && tradingBalanceLoading;

  const total =
    ready && walletReady && margin != null
      ? computeTotalBalanceUsd({
          walletUsd: walletUsd ?? 0,
          marginUsd: margin,
          tradingAccountUsd: tradingBalanceUsd,
          borrowedUsd: borrowed ?? 0,
        })
      : null;

  const pillLabel = !isWalletConnected ? (
    DATA_PLACEHOLDER
  ) : total == null ? (
    "…"
  ) : (
    <QuoteAmount amount={total} compact />
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("header-balance-pill", className)}
          aria-label="Total balance breakdown"
        >
          <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 max-w-[4.5rem] truncate sm:max-w-none">{pillLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="balance-breakdown w-56 p-0">
        <div className="border-b border-border px-3 py-2.5">
          <LabelWithInfo
            label={ui.balanceTotal}
            labelClassName="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            info={leverxInfo.balanceTotal}
          />
          <p className="balance-breakdown-total mt-1">
            <QuoteAmount
              amount={total}
              loading={isWalletConnected && (total == null)}
              hideZero={false}
              placeholder={!isWalletConnected ? "…" : DATA_PLACEHOLDER}
            />
          </p>
        </div>

        <div className="px-3 py-1">
          {!isWalletConnected ? (
            <p className="py-3 text-sm text-muted-foreground">{ui.balanceConnectHint}</p>
          ) : (
            <>
              <BalanceRow
                label={ui.balanceWallet}
                info={leverxInfo.balanceWallet}
                value={
                  <QuoteAmount
                    amount={walletUsd}
                    quoteAtoms={walletBalance?.atoms}
                    loading={isWalletConnected && !walletReady}
                    hideZero={false}
                  />
                }
              />
              <BalanceRow
                label={ui.predictManagerBalance}
                info={leverxInfo.balanceTradingAccount}
                value={
                  <QuoteAmount
                    amount={tradingBalanceUsd}
                    loading={tradingBalanceRowLoading}
                    hideZero={false}
                  />
                }
              />
              <BalanceRow
                label="Margin"
                info={leverxInfo.balanceMargin}
                value={
                  <QuoteAmount amount={margin} loading={!ready} hideZero={false} />
                }
              />
              <BalanceRow
                label="Borrowed"
                info={leverxInfo.balanceBorrowed}
                value={
                  <QuoteAmount amount={borrowed} loading={!ready} hideZero={false} />
                }
              />
              <BalanceRow
                label="Positions"
                info={leverxInfo.balancePositions}
                value={
                  !ready ? (
                    "…"
                  ) : positionCount == null ? (
                    DATA_PLACEHOLDER
                  ) : (
                    <AnimatedCount value={positionCount} />
                  )
                }
              />
            </>
          )}
        </div>

        {isWalletConnected ? (
          <div className="border-t border-border px-3 py-2">
            <Link
              to="/portfolio"
              className="text-sm font-medium text-accent hover:underline"
            >
              View portfolio →
            </Link>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
