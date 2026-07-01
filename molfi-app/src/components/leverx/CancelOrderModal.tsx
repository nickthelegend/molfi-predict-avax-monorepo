import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { showTxError, showTxSuccess } from "@/lib/toast";
import type { LimitMintOrder } from "@/lib/leverx/indexer-client";
import { formatQuantity } from "@/lib/leverx/format-quantity";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { formatPremiumCents, MARKET_TITLES } from "@/lib/leverx/indexer-markets";
import { predictSideFromBinary } from "@/lib/predict/instruments";
import { scaleQuote } from "@/lib/predict/scaling";
import { cn } from "@/lib/utils";
import { pillToggleBtn, pillToggleIdle } from "@/lib/leverx/tw";

interface Props {
  order: LimitMintOrder;
  className?: string;
}

export function CancelOrderTrigger({ order, className }: Props) {
  const { cancelLimitOrder, isProtocolReady } = useLeverxTransactions();
  const [open, setOpen] = useState(false);

  const pending = cancelLimitOrder.isPending;
  const disabled = !isProtocolReady || order.status !== "open" || pending;
  const marketTitle = MARKET_TITLES[
    predictSideFromBinary({ isUp: order.is_up, isRange: order.is_range })
  ];

  const confirm = () => {
    cancelLimitOrder.mutate(order, {
      onError: showTxError,
      onSuccess: () => {
        showTxSuccess("Order cancelled");
        setOpen(false);
      },
    });
  };

  return (
    <>
      <button
        type="button"
        className={cn(pillToggleBtn, pillToggleIdle, "text-sm", className)}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Cancel
      </button>
      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Cancel open order"
        description={`${marketTitle} limit @ ${formatPremiumCents(order.limit_premium_per_unit)}`}
      >
        <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Quantity</dt>
          <dd className="font-mono text-right">{formatQuantity(order.quantity)}</dd>
          <dt className="text-muted-foreground">Margin reserved</dt>
          <dd className="text-right">
            <QuoteAmount amount={scaleQuote(order.margin_quote)} digits={2} align="end" />
          </dd>
          <dt className="text-muted-foreground">Leverage</dt>
          <dd className="font-mono text-right">{(order.leverage_bps / 10_000).toFixed(1)}×</dd>
        </dl>
        <p className="mb-4 text-sm text-muted-foreground">
          Cancelled orders release reserved margin back to your market balance.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={cn(pillToggleBtn, pillToggleIdle, "w-full sm:w-auto")}
            onClick={() => setOpen(false)}
          >
            Keep order
          </button>
          <button
            type="button"
            className={cn(
              pillToggleBtn,
              "w-full border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 sm:w-auto",
            )}
            disabled={pending}
            onClick={confirm}
          >
            {pending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Cancel order"}
          </button>
        </div>
      </ResponsiveModal>
    </>
  );
}
