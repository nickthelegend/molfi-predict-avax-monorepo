import { floorUsdToQuoteAtoms, formatMaxWithdrawUsd } from "@/lib/leverx/trade-math";

/** Fraction presets for wallet-balance quick-amount buttons. */
export const BALANCE_QUICK_FRACTIONS = [
  { label: "10%", fraction: 0.1 },
  { label: "25%", fraction: 0.25 },
  { label: "50%", fraction: 0.5 },
  { label: "75%", fraction: 0.75 },
  { label: "MAX", fraction: 1 },
] as const;

export type BuildQuickAmountsOptions = {
  /** Cap quick amounts (trade margin max). Omit for full wallet balance (vault LP). */
  capUsd?: number;
};

/** Format a numeric amount for an input field (trim trailing zeros). */
export function formatAmountInput(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "0";
  if (amount >= 1000) return amount.toFixed(0);
  if (amount >= 1) {
    const rounded = Math.round(amount * 100) / 100;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "") || "0";
  }
  const rounded = Math.round(amount * 1e6) / 1e6;
  return String(rounded);
}

function cappedBalanceAtoms(
  maxAtoms: bigint | null | undefined,
  capUsd?: number,
): bigint | null {
  if (maxAtoms == null || maxAtoms <= 0n) return null;
  if (capUsd == null || capUsd <= 0) return maxAtoms;
  const capAtoms = floorUsdToQuoteAtoms(capUsd);
  return capAtoms < maxAtoms ? capAtoms : maxAtoms;
}

function quickAmountFromFraction(
  fraction: number,
  availableUsd: number,
  availableAtoms: bigint | null,
): string {
  if (availableAtoms != null && availableAtoms > 0n) {
    if (fraction === 1) return formatMaxWithdrawUsd(availableAtoms);
    const bps = Math.round(fraction * 10_000);
    const atoms = (availableAtoms * BigInt(bps)) / 10_000n;
    return atoms > 0n ? formatMaxWithdrawUsd(atoms) : "0";
  }
  return formatAmountInput(availableUsd * fraction);
}

/** Build quick-amount button values from a wallet balance. */
export function buildQuickAmounts(
  balance: number | null | undefined,
  maxAtoms?: bigint | null,
  options?: BuildQuickAmountsOptions,
): readonly { label: string; value: string }[] {
  const capUsd = options?.capUsd;
  const availableAtoms = cappedBalanceAtoms(maxAtoms, capUsd);
  const baseBalance = balance != null && balance > 0 ? balance : 0;
  const availableUsd =
    capUsd != null && capUsd > 0 ? Math.min(baseBalance, capUsd) : baseBalance;

  return BALANCE_QUICK_FRACTIONS.map(({ label, fraction }) => ({
    label,
    value: quickAmountFromFraction(fraction, availableUsd, availableAtoms),
  }));
}

/** Basic Sui address check (0x + hex). */
export function isValidSuiAddress(value: string): boolean {
  const trimmed = value.trim();
  return /^0x[a-fA-F0-9]{64}$/.test(trimmed);
}
