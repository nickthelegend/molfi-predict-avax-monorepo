import type { PredictVaultPerformancePoint } from "@/lib/predict/types";

const BPS = 10_000;
const VAULT_FEE_SHARE_BPS = 8_000;

/** Implied LP APR (%) from on-chain bps fields: borrow_rate × utilization × vault share. */
export function impliedLpAprPercent(
  borrowRateBps: number,
  utilizationBps: number,
  vaultFeeShareBps = VAULT_FEE_SHARE_BPS,
): number {
  if (!Number.isFinite(borrowRateBps) || !Number.isFinite(utilizationBps)) return NaN;
  const gross = (borrowRateBps / BPS) * (utilizationBps / BPS);
  return gross * (vaultFeeShareBps / BPS) * 100;
}

/** Annualized return from lxPLP share price history (simple CAGR). */
export function computeVaultApr(points: PredictVaultPerformancePoint[] | undefined): number | null {
  if (!points || points.length < 2) return null;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const startPrice = first.share_price;
  const endPrice = last.share_price;

  if (!startPrice || startPrice <= 0 || !endPrice) return null;

  const totalReturn = endPrice / startPrice - 1;
  const ms = last.timestamp_ms - first.timestamp_ms;
  if (ms <= 0) return null;

  const years = ms / (365.25 * 24 * 60 * 60 * 1000);
  if (years <= 0) return null;

  const apr = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
  return Number.isFinite(apr) ? apr : null;
}

export function formatApr(apr: number | null | undefined): string {
  if (apr == null || !Number.isFinite(apr)) return "—";
  const sign = apr >= 0 ? "+" : "";
  return `${sign}${apr.toFixed(2)}%`;
}
