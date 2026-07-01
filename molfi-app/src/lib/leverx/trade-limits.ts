import { formatProtocolDurationMs } from "@/lib/leverx/protocol";
import { appConfig } from "@/lib/config";

/** Whether leverage is offered at all. Off → every trade is forced to 1x (spot). */
export function isLeverageEnabled(): boolean {
  return appConfig.leverageEnabled;
}

/** Min/max leverage multiplier for trades (1x = no vault borrow). */
export const LEVERAGE_MIN = 1;
export const LEVERAGE_MAX = 10;
export const LEVERAGE_STEP = 0.1;
export const DEFAULT_LEVERAGE = LEVERAGE_MIN;

/** Effective ceiling — collapses to 1x when leverage is disabled. */
function effectiveLeverageMax(): number {
  return isLeverageEnabled() ? LEVERAGE_MAX : LEVERAGE_MIN;
}

/** Min/max dUSDC margin per trade (USD). */
export const MIN_MARGIN_USD = 0.1;
export const MAX_MARGIN_USD = 100;

function roundToLeverageStep(value: number): number {
  const inv = 1 / LEVERAGE_STEP;
  return Math.round(value * inv) / inv;
}

export function clampLeverage(value: number): number {
  const rounded = roundToLeverageStep(value);
  return Math.min(effectiveLeverageMax(), Math.max(LEVERAGE_MIN, rounded));
}

export function formatLeverage(value: number): string {
  const clamped = clampLeverage(value);
  return Number.isInteger(clamped) ? `${clamped}x` : `${clamped.toFixed(1)}x`;
}

export function formatLeverageBadge(value: number): string {
  const clamped = clampLeverage(value);
  return Number.isInteger(clamped) ? `${clamped}X` : `${clamped.toFixed(1)}X`;
}

/** Distinct pill colors for 1×–10× leverage badges. */
export function leverageBadgeToneClass(leverage: number): string {
  const tier = Math.round(clampLeverage(leverage));
  switch (tier) {
    case 1:
      return "border-border/70 bg-muted/30 text-muted-foreground";
    case 2:
      return "border-blue-500/35 bg-blue-500/12 text-blue-700 dark:text-blue-300";
    case 3:
      return "border-sky-500/35 bg-sky-500/12 text-sky-700 dark:text-sky-300";
    case 4:
      return "border-teal-500/35 bg-teal-500/12 text-teal-700 dark:text-teal-300";
    case 5:
      return "border-green-500/35 bg-green-500/12 text-green-700 dark:text-green-300";
    case 6:
      return "border-lime-500/35 bg-lime-500/12 text-lime-800 dark:text-lime-300";
    case 7:
      return "border-amber-500/35 bg-amber-500/12 text-amber-800 dark:text-amber-300";
    case 8:
      return "border-orange-500/35 bg-orange-500/12 text-orange-700 dark:text-orange-300";
    case 9:
      return "border-rose-500/35 bg-rose-500/12 text-rose-700 dark:text-rose-300";
    case 10:
    default:
      return "border-purple-500/35 bg-purple-500/12 text-purple-700 dark:text-purple-300";
  }
}

export function isMarginInBounds(marginUsd: number): boolean {
  return Number.isFinite(marginUsd) && marginUsd >= MIN_MARGIN_USD && marginUsd <= MAX_MARGIN_USD;
}

/** Whether the market is in its final hour before expiry. */
export function isFinalHourBeforeExpiry(
  expiryMs: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  if (!expiryMs || expiryMs <= 0) return false;
  return now >= expiryMs - windowMs && now < expiryMs;
}

/** Whether leverage above 1x may be opened (blocked in the final hour). */
export function isLeveragedMintAllowed(
  expiryMs: number,
  windowMs: number,
  now = Date.now(),
): boolean {
  if (!expiryMs || expiryMs <= 0) return true;
  return now < expiryMs - windowMs;
}

/**
 * UI max leverage before oracle settlement: one final-window period remaining → 1×,
 * two periods → 2×, and so on, capped at 10×.
 */
export function maxLeverageForExpiry(
  expiryMs: number,
  windowMs: number,
  now = Date.now(),
): number {
  if (!isLeverageEnabled()) return LEVERAGE_MIN;
  if (!expiryMs || expiryMs <= 0) return LEVERAGE_MAX;
  if (!windowMs || windowMs <= 0) return LEVERAGE_MAX;

  const remainingMs = Math.max(0, expiryMs - now);
  if (remainingMs <= 0) return LEVERAGE_MIN;

  const windowUnits = Math.floor(remainingMs / windowMs);
  return clampLeverage(Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, windowUnits)));
}

/** Latest resting-order expiry when opening above 1x (must end before the final hour). */
export function maxLeveragedRestingOrderExpiryMs(
  expiryMs: number,
  windowMs: number,
): number | null {
  if (!expiryMs || expiryMs <= 0) return null;
  return expiryMs - windowMs - 1;
}

export const LIMIT_ORDER_EXPIRY_PRESETS = [
  { label: "15m", ms: 15 * 60_000 },
  { label: "30m", ms: 30 * 60_000 },
  { label: "45m", ms: 45 * 60_000 },
  { label: "1h", ms: 3_600_000 },
  { label: "4h", ms: 4 * 3_600_000 },
  { label: "6h", ms: 6 * 3_600_000 },
  { label: "12h", ms: 12 * 3_600_000 },
  { label: "24h", ms: 24 * 3_600_000 },
] as const;

export const DEFAULT_LIMIT_ORDER_EXPIRY_MS = 6 * 3_600_000;

const MIN_RESTING_ORDER_LEAD_MS = 90_000;

export function marketRemainingMs(expiryMs: number, now = Date.now()): number {
  if (!expiryMs || expiryMs <= 0) return 0;
  return Math.max(0, expiryMs - now);
}

/** Presets that fit before market close (with a small buffer). */
export function availableLimitOrderExpiryPresets(
  expiryMs: number,
  now = Date.now(),
): readonly { label: string; ms: number }[] {
  const remaining = marketRemainingMs(expiryMs, now);
  if (remaining <= MIN_RESTING_ORDER_LEAD_MS) return [];
  return LIMIT_ORDER_EXPIRY_PRESETS.filter((p) => p.ms <= remaining - 60_000);
}

export function formatLimitOrderExpiryLabel(ms: number): string {
  if (ms < 3_600_000) {
    const minutes = Math.round(ms / 60_000);
    return `${minutes}m`;
  }
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

/** Human-readable countdown for trade headers when expiry is soon. */
export function formatMarketCloses(expiryMs: number, now = Date.now()): string {
  if (!expiryMs || expiryMs <= 0) return "—";
  const remaining = marketRemainingMs(expiryMs, now);
  if (remaining <= 0) return "Closed";
  if (remaining < 3_600_000) {
    const minutes = Math.max(1, Math.ceil(remaining / 60_000));
    return minutes === 1 ? "1m left" : `${minutes}m left`;
  }
  if (remaining < 86_400_000) {
    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m left`;
    if (hours > 0) return `${hours}h left`;
    return `${minutes}m left`;
  }
  return new Date(expiryMs).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function pickDefaultLimitOrderExpiryMs(
  expiryMs: number,
  now = Date.now(),
): number {
  const presets = availableLimitOrderExpiryPresets(expiryMs, now);
  if (presets.length === 0) return DEFAULT_LIMIT_ORDER_EXPIRY_MS;
  const preferred = presets.find((p) => p.ms === DEFAULT_LIMIT_ORDER_EXPIRY_MS);
  return preferred?.ms ?? presets[presets.length - 1]!.ms;
}

export type LeverageCountdownPhase = "leverage-open" | "leverage-closed" | "market-closed";

export function leverageClosesAtMs(expiryMs: number, windowMs: number): number {
  if (!expiryMs || expiryMs <= 0) return 0;
  return expiryMs - windowMs;
}

export function leverageCountdownState(
  expiryMs: number,
  windowMs: number,
  now = Date.now(),
): {
  phase: LeverageCountdownPhase;
  leverageClosesAtMs: number;
  leverageRemainingMs: number;
  marketRemainingMs: number;
} | null {
  if (!expiryMs || expiryMs <= 0) return null;

  const marketRemaining = marketRemainingMs(expiryMs, now);
  const closesAt = leverageClosesAtMs(expiryMs, windowMs);

  if (marketRemaining <= 0) {
    return {
      phase: "market-closed",
      leverageClosesAtMs: closesAt,
      leverageRemainingMs: 0,
      marketRemainingMs: 0,
    };
  }

  const leverageRemaining = Math.max(0, closesAt - now);
  return {
    phase: leverageRemaining > 0 ? "leverage-open" : "leverage-closed",
    leverageClosesAtMs: closesAt,
    leverageRemainingMs: leverageRemaining,
    marketRemainingMs: marketRemaining,
  };
}

/** Stopwatch display — always HH:MM:SS. */
export function formatCountdownStopwatch(remainingMs: number): string {
  if (remainingMs <= 0) return "00:00:00";
  const totalSec = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function maxLeverageLabelForExpiry(
  expiryMs: number | undefined,
  windowMs: number,
  now = Date.now(),
): string {
  if (!expiryMs || expiryMs <= 0) return "10X";
  return formatLeverageBadge(maxLeverageForExpiry(expiryMs, windowMs, now));
}

export type LeverageTimetableRow = {
  maxLeverage: number;
  periodsRemaining: number;
  timeRemainingLabel: string;
};

/** Rows for guide/UI: max open leverage by final-window periods remaining. */
export function buildLeverageTimetable(
  finalWindowMs: number,
  leverageMax = LEVERAGE_MAX,
): LeverageTimetableRow[] {
  if (!finalWindowMs || finalWindowMs <= 0) return [];

  const rows: LeverageTimetableRow[] = [];

  for (let leverage = 1; leverage <= leverageMax; leverage += 1) {
    let timeRemainingLabel: string;

    if (leverage === 1) {
      timeRemainingLabel = `Final window — under ${formatProtocolDurationMs(finalWindowMs, "short")}`;
    } else if (leverage === leverageMax) {
      timeRemainingLabel = `${formatProtocolDurationMs((leverage - 1) * finalWindowMs, "short")} or more`;
    } else {
      const lowMs = (leverage - 1) * finalWindowMs;
      const highMs = leverage * finalWindowMs;
      timeRemainingLabel = `${formatProtocolDurationMs(lowMs, "short")} – ${formatProtocolDurationMs(highMs, "short")}`;
    }

    rows.push({
      maxLeverage: leverage,
      periodsRemaining: leverage,
      timeRemainingLabel,
    });
  }

  return rows.reverse();
}
