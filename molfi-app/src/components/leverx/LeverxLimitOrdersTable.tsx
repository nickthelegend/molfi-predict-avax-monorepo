import { useMemo } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { CancelOrderTrigger } from "@/components/leverx/CancelOrderModal";
import { AnimatedPremium, AnimatedQuantity } from "@/components/ui/animated-numbers";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import type { LimitMintOrder } from "@/lib/leverx/indexer-client";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import { predictSideFromBinary, type PredictSide } from "@/lib/predict/instruments";
import { scaleQuote } from "@/lib/predict/scaling";

interface Props {
  orders: readonly LimitMintOrder[];
  className?: string;
  paginationKey?: string | number;
  pageSize?: number;
}

interface OrderRow {
  id: string;
  order: LimitMintOrder;
  side: PredictSide;
}

export function LeverxLimitOrdersTable({
  orders,
  className,
  paginationKey,
  pageSize,
}: Props) {
  const rows: OrderRow[] = useMemo(
    () =>
      orders.map((order) => ({
        id: order.placed_event_digest,
        order,
        side: predictSideFromBinary({
          isUp: order.is_up,
          isRange: order.is_range,
        }),
      })),
    [orders],
  );

  const cols: Column<OrderRow>[] = [
    {
      key: "market",
      header: "Market",
      mobileEmphasis: true,
      cell: (r) => (
        <div>
          <p className="text-sm font-medium">
            <MarketTitle side={r.side} />
          </p>
        </div>
      ),
    },
    {
      key: "limit",
      header: "Limit",
      align: "right",
      mobileTrailing: true,
      cell: (r) => (
        <AnimatedPremium value={r.order.limit_premium_per_unit} className="text-sm" />
      ),
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      mobileLabel: "Qty",
      cell: (r) => (
        <AnimatedQuantity value={r.order.quantity} className="text-sm" />
      ),
    },
    {
      key: "margin",
      header: "Margin",
      align: "right",
      mobileLabel: "Margin",
      cell: (r) => (
        <QuoteAmount
          className="text-sm"
          amount={scaleQuote(r.order.margin_quote)}
          digits={2}
          align="end"
        />
      ),
    },
    {
      key: "leverage",
      header: "Lev",
      align: "right",
      mobileLabel: "Lev",
      cell: (r) => (
        <span className="font-mono text-sm">{(r.order.leverage_bps / 10_000).toFixed(1)}×</span>
      ),
    },
    {
      key: "expires",
      header: "Expires",
      align: "right",
      mobileLabel: "Expires",
      cell: (r) => (
        <span className="text-sm text-muted-foreground">
          {r.order.order_expires_ms
            ? new Date(r.order.order_expires_ms).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      mobileLabel: "Status",
      cell: (r) => <span className="text-sm capitalize text-muted-foreground">{r.order.status}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      mobileFooter: true,
      cell: (r) =>
        r.order.status === "open" ? <CancelOrderTrigger order={r.order} /> : null,
    },
  ];

  return (
    <div className={className}>
      <DataTable
        columns={cols}
        rows={rows}
        rowKey={(r) => r.id}
        paginationKey={paginationKey}
        pageSize={pageSize}
      />
    </div>
  );
}
