import { useMemo } from "react";
import { payoutMultiplier } from "@/lib/leverx/featured-market-utils";

/** Reactive payout multiplier label (e.g. `1.94x`) from a live or catalog ask premium. */
export function usePayoutMultiplier(
  premium: number | bigint | null | undefined,
): string | null {
  const premiumKey =
    premium == null ? null : typeof premium === "bigint" ? premium.toString() : premium;

  return useMemo(() => payoutMultiplier(premium), [premiumKey]);
}
