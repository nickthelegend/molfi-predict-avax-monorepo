import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { TradeAmountInput } from "@/components/leverx/TradeFormControls";
import { QuoteAmount, QuoteAmountInline } from "@/components/leverx/QuoteAmount";
import { useTradingAccountBalance } from "@/hooks/useTradingAccountBalance";
import { useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { HintWithInfo, LabelWithInfo } from "@/components/leverx/InfoPopover";
import { showTxError, showTxSuccess } from "@/lib/toast";
import { ui } from "@/lib/copy";
import {
  clampUsdInputToQuoteAtoms,
  formatMaxWithdrawUsd,
  QUOTE_INPUT_STEP,
  usdInputExceedsQuoteAtoms,
  withdrawUsdDecimals,
  withdrawUsdDisplayAmount,
} from "@/lib/leverx/trade-math";
import { pillToggleBtn, pillToggleIdle } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

export function PortfolioWithdrawDialog({ open, onOpenChange, accountId }: Props) {
  const { atoms: balanceAtoms, usd: withdrawableUsd, isLoading } = useTradingAccountBalance(
    open ? accountId : undefined,
  );
  const { withdrawQuote, isProtocolReady } = useLeverxTransactions();

  const [amountUsd, setAmountUsd] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountUsd("");
    }
  }, [open]);

  const maxAtoms = balanceAtoms;
  const maxUsd = withdrawUsdDisplayAmount(maxAtoms);
  const maxDigits = withdrawUsdDecimals(maxAtoms);
  const pending = withdrawQuote.isPending;
  const hasBalance = maxAtoms > 0n;
  const amountInvalid =
    !hasBalance || !amountUsd.trim() || usdInputExceedsQuoteAtoms(amountUsd, maxAtoms);

  useEffect(() => {
    if (open && maxAtoms > 0n) {
      setAmountUsd(formatMaxWithdrawUsd(maxAtoms));
    }
  }, [open, maxAtoms]);

  const close = () => onOpenChange(false);

  const onConfirm = () => {
    const amountAtoms = clampUsdInputToQuoteAtoms(amountUsd, maxAtoms);
    if (amountAtoms <= 0n) return;

    withdrawQuote.mutate(
      { accountId, amountAtoms },
      {
        onSuccess: () => {
          showTxSuccess("dUSDC withdrawn to wallet");
          close();
        },
        onError: showTxError,
      },
    );
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Withdraw to wallet"
      description={leverxInfo.withdrawDialogDescription}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <LabelWithInfo
            label={ui.balanceWithdrawable}
            labelClassName="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
            info={leverxInfo.balanceWithdrawableDetail}
            infoTitle={ui.balanceWithdrawable}
          />
          <p className="mt-0.5 font-mono text-lg tabular-nums text-foreground">
            {isLoading && !hasBalance ? (
              "…"
            ) : (
              <QuoteAmount amount={withdrawableUsd} digits={2} hideZero={false} />
            )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {leverxInfo.withdrawDialogWithdrawableHint}
          </p>
        </div>

        {isLoading && !hasBalance ? (
          <p className="text-sm text-muted-foreground">Loading balance…</p>
        ) : !hasBalance ? (
          <p className="text-sm text-muted-foreground">
            <HintWithInfo
              summary={leverxInfo.withdrawEmpty}
              detail={leverxInfo.withdrawEmptyDetail}
              infoTitle="Withdraw"
            />
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Amount</p>
              <TradeAmountInput
                type="number"
                inputMode="decimal"
                min={0}
                step={QUOTE_INPUT_STEP}
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="0.00"
              />
              <button
                type="button"
                className={cn(pillToggleBtn, pillToggleIdle, "w-full text-sm")}
                disabled={maxAtoms <= 0n}
                onClick={() => setAmountUsd(formatMaxWithdrawUsd(maxAtoms))}
              >
                Use max ({formatMaxWithdrawUsd(maxAtoms)})
              </button>
              {amountInvalid && amountUsd ? (
                <p className="text-sm text-destructive">
                  Enter an amount up to{" "}
                  <QuoteAmountInline amount={maxUsd} digits={maxDigits} suffix="." />
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className={cn(pillToggleBtn, pillToggleIdle, "w-full")}
              disabled={!isProtocolReady || amountInvalid || pending}
              onClick={onConfirm}
            >
              {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirm withdraw"}
            </button>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
}
