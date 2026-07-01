import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { AssetBadge, type AssetBadgeSize } from "@/components/AssetBadge";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { formatAmountWithMaxDigits } from "@/lib/copy";
import { formatQuoteAtomsAmount } from "@/lib/predict/scaling";
import { isQuoteAssetSymbol } from "@/lib/asset-icons";
import { formatQuantity } from "@/lib/leverx/format-quantity";
import { DATA_PLACEHOLDER } from "@/lib/leverx/placeholders";
import { cn } from "@/lib/utils";

type QuoteAmountProps = {
  amount: number | null | undefined;
  /** When set, display uses exact on-chain quote atoms (6 dp) instead of a float amount. */
  quoteAtoms?: bigint | number | string | null;
  symbol?: string;
  placeholder?: string;
  loading?: boolean;
  /** When true, amounts ≤ 0 render the placeholder (matches formatUsdcOrPlaceholder). */
  hideZero?: boolean;
  /** Compact K/M/B/T for balances and quantities — not for asset spot/strike prices. */
  compact?: boolean;
  digits?: number;
  /** Animate value changes (default true). */
  animate?: boolean;
  className?: string;
  amountClassName?: string;
  iconSize?: AssetBadgeSize;
  iconClassName?: string;
  align?: "start" | "end";
  /** Show a lock before the quote icon (e.g. amount not withdrawable). */
  locked?: boolean;
  lockedTitle?: string;
};

function formatQuoteValue(
  amount: number,
  compact?: boolean,
  digits?: number,
  quoteAtoms?: bigint | number | string | null,
): string {
  if (compact) return formatQuantity(amount);
  if (quoteAtoms != null && quoteAtoms !== "" && quoteAtoms !== 0 && quoteAtoms !== 0n) {
    return formatQuoteAtomsAmount(quoteAtoms);
  }
  return formatAmountWithMaxDigits(amount, digits);
}

export function QuoteIcon({
  symbol = "DUSDC",
  size = "sm",
  className,
}: {
  symbol?: string;
  size?: AssetBadgeSize;
  className?: string;
}) {
  return (
    <AssetBadge
      asset={symbol}
      size={size}
      className={cn("h-4 w-4", className)}
    />
  );
}

export function QuoteAmount({
  amount,
  quoteAtoms,
  symbol = "DUSDC",
  placeholder = DATA_PLACEHOLDER,
  loading,
  hideZero,
  compact,
  digits,
  animate = true,
  className,
  amountClassName,
  iconSize = "sm",
  iconClassName,
  align = "start",
  locked = false,
  lockedTitle = "Locked",
}: QuoteAmountProps) {
  const canAnimate =
    animate &&
    !loading &&
    amount != null &&
    Number.isFinite(amount) &&
    !(hideZero && amount <= 0);

  const { value: animatedAmount } = useAnimatedCounter(canAnimate ? amount : null, {
    decimals: digits,
    enabled: canAnimate,
  });

  if (loading) {
    return <span className={className}>…</span>;
  }

  if (amount == null || !Number.isFinite(amount)) {
    return <span className={className}>{placeholder}</span>;
  }

  if (hideZero && amount <= 0) {
    return <span className={className}>{placeholder}</span>;
  }

  const displayAmount = canAnimate ? animatedAmount : amount;
  const sym = symbol.trim().toUpperCase();
  const text = formatQuoteValue(displayAmount, compact, digits, quoteAtoms);

  if (!isQuoteAssetSymbol(sym)) {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className={cn("font-mono tabular-nums", amountClassName)}>{text}</span>
        <span className="text-muted-foreground">{sym}</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1",
        align === "end" && "justify-end",
        className,
      )}
      aria-label={`${text} ${sym}${locked ? ", locked" : ""}`}
    >
      <span
        className={cn("min-w-0 truncate font-mono tabular-nums", amountClassName)}
        aria-hidden
      >
        {text}
      </span>
      {locked ? (
        <Lock
          className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
          title={lockedTitle}
        />
      ) : null}
      <QuoteIcon symbol={sym} size={iconSize} className={cn("shrink-0", iconClassName)} />
    </span>
  );
}

/** Inline amount + quote icon for mixed copy, e.g. "up to 12.50 [icon]". */
export function QuoteAmountInline({
  amount,
  prefix,
  suffix,
  digits = 2,
  className,
}: {
  amount: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  digits?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {prefix}
      <QuoteAmount amount={amount} digits={digits} />
      {suffix}
    </span>
  );
}
