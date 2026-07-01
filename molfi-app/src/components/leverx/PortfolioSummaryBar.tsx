import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { AnimatedCount, AnimatedPnl } from "@/components/ui/animated-numbers";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { leverxInfo } from "@/lib/leverx/info-copy";
import type { PortfolioSummary } from "@/lib/leverx/portfolio-summary";
import { labelCaps, statValue, tradeSurface } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  summary: PortfolioSummary | null;
  loading?: boolean;
  className?: string;
}

function SummaryStat({
  label,
  value,
  info,
  tone,
  sub,
}: {
  label: string;
  value: ReactNode;
  info?: string;
  tone?: "success" | "destructive" | "muted";
  sub?: ReactNode;
}) {
  return (
    <div className="min-w-0 px-4 py-3.5">
      {info ? (
        <LabelWithInfo label={label} labelClassName={labelCaps} info={info} />
      ) : (
        <div className={labelCaps}>{label}</div>
      )}
      <div
        className={cn(
          statValue,
          "mt-1 truncate text-xl sm:text-2xl",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </div>
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

export function PortfolioSummaryBar({ summary, loading, className }: Props) {
  const pnlTone =
    summary == null
      ? undefined
      : summary.unrealizedPnlUsd > 0
        ? "success"
        : summary.unrealizedPnlUsd < 0
          ? "destructive"
          : "muted";

  const pnlValue =
    loading ? "…" : !summary ? (
      "0"
    ) : summary.liveMarkCount > 0 ? (
      <AnimatedPnl value={summary.unrealizedPnlUsd} />
    ) : (
      "—"
    );

  return (
    <div className={cn(tradeSurface, className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <LabelWithInfo
          label="Portfolio overview"
          labelClassName={labelCaps}
          info={leverxInfo.portfolioOverviewDetail}
          infoTitle="Portfolio overview"
        />
        {summary && summary.atRiskCount > 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {summary.atRiskCount} at risk
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
        <SummaryStat
          label="Net equity"
          info={leverxInfo.portfolioNetEquity}
          value={
            loading ? "…" : !summary ? (
              "0"
            ) : (
              <QuoteAmount amount={summary.netEquityUsd} hideZero />
            )
          }
          sub={
            summary ? (
              <>
                <AnimatedCount value={summary.positionCount} className="inline" /> open ·{" "}
                <QuoteAmount amount={summary.notionalUsd} hideZero className="inline-flex" /> exposure
              </>
            ) : undefined
          }
        />
        <SummaryStat
          label="Unrealized P&L"
          info={leverxInfo.unrealizedPnl}
          value={pnlValue}
          tone={pnlTone}
          sub={
            summary && summary.liveMarkCount > 0 ? (
              <span className="inline-flex items-center gap-1">
                {summary.unrealizedPnlUsd >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                Mark-to-market
              </span>
            ) : (
              "Awaiting live marks"
            )
          }
        />
        <SummaryStat
          label="Margin posted"
          info={leverxInfo.marginOpen}
          value={
            loading ? "…" : !summary ? (
              "0"
            ) : (
              <QuoteAmount amount={summary.marginTotalUsd} hideZero />
            )
          }
        />
        <SummaryStat
          label="Borrowed"
          info={leverxInfo.borrowedQuote}
          value={
            loading ? "…" : !summary ? (
              "0"
            ) : (
              <QuoteAmount amount={summary.borrowedTotalUsd} hideZero />
            )
          }
        />
      </div>
    </div>
  );
}
