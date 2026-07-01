import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { CopyField } from "@/components/leverx/CopyField";
import { TradeAmountInput } from "@/components/leverx/TradeFormControls";
import { QuoteAmount, QuoteAmountInline } from "@/components/leverx/QuoteAmount";
import { useLeverxProtocolConfig, useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { useWalletCoinBalance, walletCoinBalanceUsd } from "@/hooks/useWalletCoinBalance";
import { useWallet } from "@/context/WalletContext";
import {
  clampUsdInputToQuoteAtoms,
  formatMaxWithdrawUsd,
  QUOTE_INPUT_STEP,
  usdInputExceedsQuoteAtoms,
  withdrawUsdDecimals,
  withdrawUsdDisplayAmount,
} from "@/lib/leverx/trade-math";
import { pillToggleBtn, pillToggleIdle } from "@/lib/leverx/tw";
import { showTxError, showTxSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: string;
}

export function PortfolioDepositDialog({ open, onOpenChange, accountId }: Props) {
  const { address } = useWallet();
  const { cfg } = useLeverxProtocolConfig();
  const { depositQuote, isProtocolReady } = useLeverxTransactions();
  const { data: walletBalance, isLoading: walletLoading } = useWalletCoinBalance(
    open ? (cfg?.quoteType ?? null) : null,
  );

  const walletAtoms = walletBalance?.atoms ?? 0n;
  const walletUsd = walletCoinBalanceUsd(walletBalance);

  const [amountUsd, setAmountUsd] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountUsd("");
      return;
    }
    if (walletAtoms > 0n) {
      setAmountUsd(formatMaxWithdrawUsd(walletAtoms));
    }
  }, [open, walletAtoms]);

  const maxAtoms = walletAtoms;
  const maxUsd = withdrawUsdDisplayAmount(maxAtoms);
  const maxDigits = withdrawUsdDecimals(maxAtoms);
  const amountInvalid =
    maxAtoms <= 0n || !amountUsd.trim() || usdInputExceedsQuoteAtoms(amountUsd, maxAtoms);
  const pending = depositQuote.isPending;

  const close = () => onOpenChange(false);

  const onConfirm = () => {
    const amountAtoms = clampUsdInputToQuoteAtoms(amountUsd, walletAtoms);
    if (amountAtoms <= 0n) return;

    depositQuote.mutate(
      { accountId, amountAtoms },
      {
        onSuccess: () => {
          showTxSuccess("dUSDC deposited to trading account");
          close();
        },
        onError: showTxError,
      },
    );
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title="Deposit to trading account">
      <div className="space-y-4">
        {address ? (
          <CopyField
            label="Your wallet address"
            value={address}
            hint="Copy and send dUSDC here before depositing into your trading account."
          />
        ) : null}

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Wallet balance
          </p>
          <p className="mt-0.5 font-mono text-lg tabular-nums text-foreground">
            {walletLoading && walletUsd == null ? (
              "…"
            ) : (
              <QuoteAmount amount={walletUsd ?? 0} digits={2} hideZero />
            )}
          </p>
        </div>

        {walletLoading && walletUsd == null ? (
          <p className="text-sm text-muted-foreground">Loading wallet balance…</p>
        ) : walletAtoms <= 0n ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            No dUSDC in your wallet. Fund your wallet first, then deposit here.
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
                onClick={() => setAmountUsd(formatMaxWithdrawUsd(walletAtoms))}
              >
                Use max ({formatMaxWithdrawUsd(walletAtoms)})
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
              {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Confirm deposit"}
            </button>
          </>
        )}
      </div>
    </ResponsiveModal>
  );
}
