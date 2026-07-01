import { MarketSparkline } from "@/components/leverx/MarketSparkline";
import { MarketPremiumQuoteSkeleton } from "@/components/ui/market-skeleton";
import { AnimatedMarketPremium } from "@/components/ui/animated-numbers";
import { changePercentEndpoints } from "@/lib/charts/sparkline-path";
import {
  marketCardSparkline,
  marketCardSparklineFooter,
  marketsPriceCell,
  marketsPriceValue,
  marketsTableSparklineBand,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  series: readonly number[];
  lastAskPremium: number | null;
  premiumLoading?: boolean;
  quotePaused?: boolean;
  variant?: "inline" | "band";
  /** Band at card footer — full width, no background tint */
  footer?: boolean;
  /** Shorter sparkline for markets list/table density */
  compact?: boolean;
  className?: string;
}

function pricePending(
  premiumLoading: boolean | undefined,
  lastAskPremium: number | null,
  quotePaused: boolean | undefined,
): boolean {
  return Boolean(
    premiumLoading &&
      !quotePaused &&
      (lastAskPremium == null || lastAskPremium <= 0),
  );
}

export function MarketPremiumQuote({
  series,
  lastAskPremium,
  premiumLoading,
  quotePaused,
  variant = "inline",
  footer = false,
  compact = false,
  className,
}: Props) {
  const pending = pricePending(premiumLoading, lastAskPremium, quotePaused);
  const change = changePercentEndpoints(series);
  const positive = change >= 0;
  const showChange = !pending && series.length >= 2 && Math.abs(change) >= 0.05;

  if (variant === "band") {
    if (pending) {
      return (
        <MarketPremiumQuoteSkeleton
          band
          compact={compact}
          className={className}
        />
      );
    }

    const bandClass = footer
      ? marketCardSparklineFooter
      : compact
        ? marketsTableSparklineBand
        : marketCardSparkline;

    return (
      <div className={cn(bandClass, className)}>
        <MarketSparkline
          series={series}
          height={compact ? 12 : 32}
          width="100%"
          edgeToEdge={footer}
          viewWidth={footer ? 240 : 104}
          viewHeight={compact ? 10 : 20}
        />
      </div>
    );
  }

  if (pending) {
    return (
      <MarketPremiumQuoteSkeleton
        compact={compact}
        className={cn(marketsPriceCell, className)}
      />
    );
  }

  return (
    <div className={cn(marketsPriceCell, className)}>
      <MarketSparkline
        series={series}
        width={compact ? 64 : 52}
        height={compact ? 20 : 20}
        viewWidth={compact ? 96 : 104}
        viewHeight={compact ? 20 : 20}
        strokeWidth={compact ? 1.5 : 1.5}
      />
      <AnimatedMarketPremium
        className={marketsPriceValue}
        premium={lastAskPremium}
        quotePaused={quotePaused}
        loading={false}
      />
      {showChange ? (
        <span
          className={cn(
            "markets-change",
            positive ? "markets-change--up" : "markets-change--down",
          )}
        >
          {positive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      ) : null}
    </div>
  );
}
