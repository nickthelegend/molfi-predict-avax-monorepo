import { FLOAT_SCALING, QUOTE_UNIT } from "@/lib/predict/constants";
import { formatAmountWithMaxDigits } from "@/lib/copy";
import {
  formatDecimalWithSubscriptFromParts,
  SUBSCRIPT_DUST_THRESHOLD,
} from "@/lib/format-decimal-subscript";

const QUOTE_ATOM_FRACTION_DIGITS = 6;

/** Coerce indexer / API atom fields (number, bigint, or numeric string) to number. */
export function coerceQuoteAtoms(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** On-chain spot / strike fields from predict-server (÷ 1e9). */
export function scaleSpot(value: number | null | undefined): number {
  if (value == null || value <= 0) return 0;
  return value / Number(FLOAT_SCALING);
}

/** dUSDC and other quote amounts from predict-server (÷ 1e6). */
export function scaleQuote(value: number | bigint | string | null | undefined): number {
  const n = coerceQuoteAtoms(value);
  if (n <= 0) return 0;
  return n / Number(QUOTE_UNIT);
}

/** Coerce on-chain / API atom fields to bigint for fixed-point math. */
export function coerceQuoteAtomsToBigInt(value: unknown): bigint {
  if (value == null) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === "string") {
    try {
      return BigInt(value);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

/** On-chain quote atoms (6-decimal dUSDC) → USD without `Number(bigint)` precision loss. */
export function scaleQuoteAtoms(atoms: bigint | number | string | null | undefined): number {
  const normalized = coerceQuoteAtomsToBigInt(atoms);
  if (normalized <= 0n) return 0;
  const whole = normalized / QUOTE_UNIT;
  const frac = normalized % QUOTE_UNIT;
  const usd = Number(whole) + Number(frac) / Number(QUOTE_UNIT);
  return Number.isFinite(usd) ? usd : 0;
}

/**
 * Format on-chain quote atoms for display — exact fractional dust, subscript when 2dp would hide it.
 * e.g. 75_000_242 atoms → `75.0₃242`
 */
export function formatQuoteAtomsAmount(
  atoms: bigint | number | string | null | undefined,
): string {
  const normalized = coerceQuoteAtomsToBigInt(atoms);
  if (normalized <= 0n) return "0";

  const sign = normalized < 0n ? "-" : "";
  const abs = normalized < 0n ? -normalized : normalized;
  const whole = abs / QUOTE_UNIT;
  const frac = abs % QUOTE_UNIT;

  if (frac === 0n) {
    return formatAmountWithMaxDigits(Number(whole));
  }

  const fracStr = frac.toString().padStart(QUOTE_ATOM_FRACTION_DIGITS, "0");
  const subscript = formatDecimalWithSubscriptFromParts(
    whole.toString(),
    fracStr,
    sign,
  );
  if (subscript !== null) return subscript;

  const relaxed = formatDecimalWithSubscriptFromParts(
    whole.toString(),
    fracStr,
    sign,
    SUBSCRIPT_DUST_THRESHOLD,
  );
  if (relaxed !== null) return relaxed;

  return formatAmountWithMaxDigits(scaleQuoteAtoms(abs), QUOTE_ATOM_FRACTION_DIGITS);
}

/** Token amounts from on-chain atom counts. */
export function scaleAtoms(value: number | null | undefined, decimals: number): number {
  if (value == null || value <= 0) return 0;
  return value / 10 ** decimals;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(2)}%`;
}
