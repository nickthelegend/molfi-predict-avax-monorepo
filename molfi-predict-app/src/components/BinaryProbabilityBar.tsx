/**
 * BinaryProbabilityBar
 * =====================
 * Production-ready Yes / No probability bar for binary prediction markets.
 *
 * Design contract:
 *  - Accepts a single `yesProb` number (0–100 range, % units).
 *  - noProb is always derived: `100 - yesProb` — never separately sourced.
 *  - Values are clamped to [0, 100] and rounded to the nearest integer.
 *  - Bar widths ALWAYS sum to 100 % — no overflow, no collapse.
 *  - A visual minimum width of 4 px is applied via CSS min-width so both
 *    segments are always legible, without inflating the actual percentage.
 *  - Percentages are always displayed in the labels below the bar.
 *  - The dominant side (> 50) receives the bolder label treatment.
 *  - If `yesProb` is invalid (undefined / null / NaN / out-of-range after
 *    normalisation) a "—" fallback is rendered and a console warning emitted
 *    so upstream API issues are surfaced quickly.
 *
 * Usage:
 *   <BinaryProbabilityBar yesProb={60} />
 *   <BinaryProbabilityBar yesProb={market.yesPercentage} size="sm" />
 */

import React from "react";

// ─── types ───────────────────────────────────────────────────────────────────

export interface BinaryProbabilityBarProps {
  /** Probability of YES in percent (0–100). Derived from API `yes_price` field. */
  yesProb: number | undefined | null;
  /** Visual size variant.  Default: "md" */
  size?: "sm" | "md" | "lg";
  /** Additional Tailwind classes applied to the outer wrapper */
  className?: string;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse and sanitise a raw probability value into an integer in [0, 100].
 * Returns `null` if the value is not usable (undefined / null / NaN / Infinity).
 */
function parseProbability(raw: number | undefined | null): number | null {
  if (raw === undefined || raw === null) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!isFinite(n) || isNaN(n)) return null;
  // Clamp to [0, 100] and round to nearest integer
  return Math.round(Math.min(100, Math.max(0, n)));
}

// ─── component ───────────────────────────────────────────────────────────────

export function BinaryProbabilityBar({
  yesProb: rawYesProb,
  size = "md",
  className = "",
}: BinaryProbabilityBarProps) {
  const yesProb = parseProbability(rawYesProb);

  // Surface malformed upstream data in dev tooling
  if (rawYesProb !== undefined && rawYesProb !== null && yesProb === null) {
    console.warn(
      "[BinaryProbabilityBar] Received invalid yesProb — rendering fallback.",
      { rawYesProb },
    );
  }

  // ── Fallback for missing / invalid data ──────────────────────────────────
  if (yesProb === null) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div
          className={`w-full rounded-full bg-muted ${
            size === "sm" ? "h-1.5" : size === "lg" ? "h-5" : "h-3"
          }`}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Yes —</span>
          <span>No —</span>
        </div>
      </div>
    );
  }

  const noProb = 100 - yesProb;
  const yesLeads = yesProb >= noProb; // true when Yes ≥ 50

  // Pixel heights for each size variant
  const barHeightClass =
    size === "sm" ? "h-1.5" : size === "lg" ? "h-5" : "h-3";

  // Inline min-width ensures a visible sliver at 1–3 % without breaking the sum
  const MIN_PX = 4;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* ── Bar ── */}
      <div className={`flex w-full rounded-full overflow-hidden ${barHeightClass}`}>
        {/* Yes segment */}
        <div
          className="bg-emerald-500 transition-[width] duration-300 ease-out"
          style={{
            width: `${yesProb}%`,
            minWidth: yesProb > 0 ? MIN_PX : 0,
          }}
        />
        {/* No segment */}
        <div
          className="bg-red-500 flex-1 transition-[width] duration-300 ease-out"
          style={{
            /* flex-1 fills the remainder so we can't overflow even with min-width */
            minWidth: noProb > 0 ? MIN_PX : 0,
          }}
        />
      </div>

      {/* ── Labels ── */}
      <div className="flex justify-between items-baseline">
        <span
          className={`text-xs font-medium transition-colors ${
            yesLeads
              ? "text-emerald-500 font-semibold"
              : "text-muted-foreground"
          }`}
        >
          Yes{" "}
          <span
            className={`tabular-nums ${
              yesLeads ? "font-bold" : "font-medium"
            }`}
          >
            {yesProb}%
          </span>
        </span>
        <span
          className={`text-xs font-medium transition-colors ${
            !yesLeads
              ? "text-red-500 font-semibold"
              : "text-muted-foreground"
          }`}
        >
          No{" "}
          <span
            className={`tabular-nums ${
              !yesLeads ? "font-bold" : "font-medium"
            }`}
          >
            {noProb}%
          </span>
        </span>
      </div>
    </div>
  );
}
