import type { ComponentPropsWithoutRef } from "react";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number | null | undefined;
  format?: (value: number) => string;
  duration?: number;
  enabled?: boolean;
  decimals?: number;
  animateOnMount?: boolean;
  placeholder?: string;
  loading?: boolean;
  loadingPlaceholder?: string;
} & Omit<ComponentPropsWithoutRef<"span">, "children">;

export function AnimatedNumber({
  value,
  format = (v) => v.toLocaleString("en-US"),
  duration,
  enabled = true,
  decimals,
  animateOnMount,
  placeholder = "—",
  loading,
  loadingPlaceholder = "…",
  className,
  ...props
}: AnimatedNumberProps) {
  const canAnimate =
    enabled &&
    !loading &&
    value != null &&
    Number.isFinite(value);

  const { value: animatedValue } = useAnimatedCounter(canAnimate ? value : null, {
    duration,
    enabled: canAnimate,
    decimals,
    animateOnMount,
  });

  if (loading) {
    return (
      <span className={cn("font-mono tabular-nums", className)} {...props}>
        {loadingPlaceholder}
      </span>
    );
  }

  if (value == null || !Number.isFinite(value)) {
    return (
      <span className={cn("font-mono tabular-nums", className)} {...props}>
        {placeholder}
      </span>
    );
  }

  const display = canAnimate ? animatedValue : value;

  return (
    <span className={cn("font-mono tabular-nums", className)} {...props}>
      {format(display)}
    </span>
  );
}
