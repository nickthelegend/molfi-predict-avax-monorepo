import { FLOAT_SCALING, QUOTE_UNIT } from "@/lib/predict/constants";
import { MINT_BUDGET_SAFETY_BPS, PREDICT_PRICE_SCALE } from "@/lib/leverx/constants";
import { clampLeverage } from "@/lib/leverx/trade-limits";

/** DeepBook Predict per-oracle ask bounds (1e9 premium scale). */
export const PREDICT_MIN_ASK_PREMIUM = 10_000_000n;
export const PREDICT_MAX_ASK_PREMIUM = 990_000_000n;
export const PREDICT_MIN_PREMIUM_CENTS = 1;
export const PREDICT_MAX_PREMIUM_CENTS = 99;

export function isPremiumWithinPredictBounds(premium: bigint): boolean {
  return premium >= PREDICT_MIN_ASK_PREMIUM && premium <= PREDICT_MAX_ASK_PREMIUM;
}

/** Positive on-chain ask for UI (includes sub-min vertical range premiums). */
export function isPremiumDisplayable(premium: bigint): boolean {
  return premium > 0n && premium < PREDICT_PRICE_SCALE;
}

export function isLimitCentsWithinPredictBounds(cents: number): boolean {
  if (!Number.isFinite(cents) || cents <= 0) return false;
  return cents >= PREDICT_MIN_PREMIUM_CENTS && cents <= PREDICT_MAX_PREMIUM_CENTS;
}

/** Total mint cost from per-contract premium (matches on-chain `cost_from_premium_per_unit`). */
export function costFromPremiumPerUnit(premiumPerUnit: bigint, quantity: bigint): bigint {
  if (premiumPerUnit <= 0n || quantity <= 0n) return 0n;
  return (premiumPerUnit * quantity) / PREDICT_PRICE_SCALE;
}

/** Matches on-chain `predict_client::premium_per_unit` (divide-and-round-up). */
export function premiumPerUnitFromMintCost(mintCost: bigint, quantity: bigint): bigint {
  if (mintCost <= 0n || quantity <= 0n) return 0n;
  return (mintCost * PREDICT_PRICE_SCALE + quantity - 1n) / quantity;
}

/** Classify a live per-contract ask returned from Predict (1e9 scale). */
export function classifyPredictPremium(
  premium: bigint,
): "ok" | "zero" | "expired" | "out_of_bounds" {
  if (premium <= 0n) return "zero";
  if (premium >= PREDICT_PRICE_SCALE) return "expired";
  if (!isPremiumWithinPredictBounds(premium)) return "out_of_bounds";
  return "ok";
}

/** USD margin → quote atoms (6-decimal dUSDC). */
export function marginUsdToQuoteAtoms(marginUsd: number): bigint {
  if (!Number.isFinite(marginUsd) || marginUsd <= 0) return 0n;
  return BigInt(Math.round(marginUsd * Number(QUOTE_UNIT)));
}

/** Floor USD from quote atoms — never rounds above on-chain balance. */
export function floorUsdFromQuoteAtoms(atoms: bigint, decimals = 6): number {
  if (atoms <= 0n) return 0;
  const factor = 10n ** BigInt(decimals);
  return Number((atoms * factor) / QUOTE_UNIT) / Number(factor);
}

/** dUSDC quote input uses full on-chain atom precision (6 decimals). */
export const QUOTE_INPUT_DECIMALS = 6;
export const QUOTE_INPUT_STEP = 0.000001;

/** Floor USD input → quote atoms (never rounds up vs typed/max amount). */
export function floorUsdToQuoteAtoms(usd: number): bigint {
  if (!Number.isFinite(usd) || usd <= 0) return 0n;
  return BigInt(Math.floor(usd * Number(QUOTE_UNIT) + 1e-9));
}

/** Parse a USD input string → quote atoms without float round-up. */
export function parseUsdInputToQuoteAtoms(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed) return 0n;

  const negative = trimmed.startsWith("-");
  const raw = negative ? trimmed.slice(1) : trimmed;
  const [intPart = "0", fracPart = ""] = raw.split(".");
  if (!/^\d+$/.test(intPart) || (fracPart && !/^\d+$/.test(fracPart))) return 0n;

  const fracPadded = fracPart
    .padEnd(QUOTE_INPUT_DECIMALS, "0")
    .slice(0, QUOTE_INPUT_DECIMALS);
  const atoms = BigInt(intPart) * QUOTE_UNIT + BigInt(fracPadded || "0");
  return negative ? -atoms : atoms;
}

/** Format quote atoms as a floored USD input string (no float round-up). */
export function formatQuoteAtomsToUsdInput(atoms: bigint, decimals: number): string {
  if (atoms <= 0n) return "";
  const factor = 10n ** BigInt(decimals);
  const scaled = (atoms * factor) / QUOTE_UNIT;
  const intPart = scaled / factor;
  const fracPart = scaled % factor;
  if (decimals === 0) return intPart.toString();
  return `${intPart}.${fracPart.toString().padStart(decimals, "0")}`;
}

/** Decimals for withdraw UI — enough precision for dust without misleading round-up. */
export function withdrawUsdDecimals(atoms: bigint): number {
  if (atoms < 10_000n) return 6;
  if (atoms < QUOTE_UNIT) return 4;
  return 2;
}

export function withdrawUsdDisplayAmount(atoms: bigint): number {
  const decimals = withdrawUsdDecimals(atoms);
  return floorUsdFromQuoteAtoms(atoms, decimals);
}

/** Max withdraw/deposit input string — full atom precision, never rounds up. */
export function formatMaxWithdrawUsd(atoms: bigint): string {
  if (atoms <= 0n) return "";
  const formatted = formatQuoteAtomsToUsdInput(atoms, QUOTE_INPUT_DECIMALS);
  if (!formatted.includes(".")) return formatted;
  return formatted.replace(/\.?0+$/, "") || "0";
}

export function usdExceedsQuoteAtoms(usd: number, maxAtoms: bigint): boolean {
  if (!Number.isFinite(usd) || usd <= 0) return true;
  return floorUsdToQuoteAtoms(usd) > maxAtoms;
}

export function usdInputExceedsQuoteAtoms(input: string, maxAtoms: bigint): boolean {
  const requested = parseUsdInputToQuoteAtoms(input);
  if (requested <= 0n) return true;
  return requested > maxAtoms;
}

/** Clamp a USD input to what on-chain atoms allow (for submit). */
export function clampUsdToQuoteAtoms(usd: number, maxAtoms: bigint): bigint {
  const requested = floorUsdToQuoteAtoms(usd);
  if (requested <= 0n) return 0n;
  return requested > maxAtoms ? maxAtoms : requested;
}

/** Clamp a USD input string to what on-chain atoms allow (for submit). */
export function clampUsdInputToQuoteAtoms(input: string, maxAtoms: bigint): bigint {
  const requested = parseUsdInputToQuoteAtoms(input);
  if (requested <= 0n) return 0n;
  return requested > maxAtoms ? maxAtoms : requested;
}

/** Leverage multiplier → basis points (2x → 20_000). */
export function leverageToBps(leverage: number): bigint {
  return BigInt(Math.round(clampLeverage(leverage) * 10_000));
}

/** Percent → basis points. */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/** Display label for on-chain trigger slippage (`0` stored → protocol default). */
export function formatTriggerSlippageBps(
  bps: number,
  defaultBps = 500,
): string {
  const effective = bps > 0 ? bps : defaultBps;
  return `${(effective / 100).toFixed(1)}%`;
}

/** Display cents → Predict premium per unit (1e9 scale). */
export function centsToPremiumRaw(cents: number): bigint {
  if (!Number.isFinite(cents) || cents <= 0) return 0n;
  return BigInt(Math.round((cents / 100) * Number(FLOAT_SCALING)));
}

/** Premium raw → display cents. */
export function premiumRawToCents(premium: bigint): number {
  return (Number(premium) / Number(FLOAT_SCALING)) * 100;
}

/** USD strike → raw 1e9 units. */
export function strikeUsdToRaw(strikeUsd: number): number {
  if (!Number.isFinite(strikeUsd) || strikeUsd <= 0) return 0;
  return Math.round(strikeUsd * Number(FLOAT_SCALING));
}

export function positionQuoteAtoms(marginAtoms: bigint, leverageBps: bigint): bigint {
  return (marginAtoms * leverageBps) / 10_000n;
}

export function borrowQuoteAtoms(marginAtoms: bigint, leverageBps: bigint): bigint {
  const position = positionQuoteAtoms(marginAtoms, leverageBps);
  return position > marginAtoms ? position - marginAtoms : 0n;
}

/** Max mint spend: leveraged position minus a small on-chain safety buffer. */
export function maxMintBudgetAtoms(marginAtoms: bigint, leverageBps: bigint): bigint {
  const position = positionQuoteAtoms(marginAtoms, leverageBps);
  return (position * BigInt(10_000 - MINT_BUDGET_SAFETY_BPS)) / 10_000n;
}

/** Estimate contract quantity from margin and per-unit premium (linear; verify on-chain). */
export function estimateQuantity(
  marginAtoms: bigint,
  leverageBps: bigint,
  premiumPerUnit: bigint,
): bigint {
  if (premiumPerUnit <= 0n) return 1n;
  const budget = maxMintBudgetAtoms(marginAtoms, leverageBps);
  const qty = (budget * PREDICT_PRICE_SCALE) / premiumPerUnit;
  return qty > 0n ? qty : 1n;
}

export function applySlippageBps(amount: bigint, slippageBps: number): bigint {
  return (amount * BigInt(10_000 + slippageBps)) / 10_000n;
}

/** Minimum acceptable payout after slippage (market redeem floor). */
export function applySlippageFloor(amount: bigint, slippageBps: number): bigint {
  if (amount <= 0n || slippageBps <= 0) return amount;
  const bps = Math.min(Math.max(slippageBps, 0), 9_999);
  return (amount * BigInt(10_000 - bps)) / 10_000n;
}

/** Slippage band on a per-contract premium (matches on-chain `premium_slippage_tolerance`). */
export function premiumSlippageTolerance(premiumPerUnit: bigint, slippageBps: number): bigint {
  if (premiumPerUnit <= 0n || slippageBps <= 0) return 0n;
  return (premiumPerUnit * BigInt(slippageBps)) / 10_000n;
}

/** Max ask for an immediate limit buy: `limit + slippage`. */
export function maxAcceptableBuyAsk(limitPremiumPerUnit: bigint, slippageBps: number): bigint {
  return limitPremiumPerUnit + premiumSlippageTolerance(limitPremiumPerUnit, slippageBps);
}

/** Immediate limit buy can fill when live ask is at or below limit + slippage. */
export function isLimitBuyFillableNow(
  marketAskPerUnit: bigint,
  limitPremiumPerUnit: bigint,
  slippageBps: number,
): boolean {
  if (limitPremiumPerUnit <= 0n || marketAskPerUnit <= 0n) return false;
  return marketAskPerUnit <= maxAcceptableBuyAsk(limitPremiumPerUnit, slippageBps);
}

/** Resting limit placement requires live ask within limit ± placement slippage. */
export function isPlacementPriceAligned(
  marketAskPerUnit: bigint,
  limitPremiumPerUnit: bigint,
  placementSlippageBps: number,
): boolean {
  if (limitPremiumPerUnit <= 0n || marketAskPerUnit <= 0n) return false;
  const tolerance = premiumSlippageTolerance(limitPremiumPerUnit, placementSlippageBps);
  const lower = limitPremiumPerUnit > tolerance ? limitPremiumPerUnit - tolerance : 0n;
  const upper = limitPremiumPerUnit + tolerance;
  return marketAskPerUnit >= lower && marketAskPerUnit <= upper;
}

/** Quick-pick offsets from entry premium (display cents). */
export const TP_SL_OFFSET_PRESETS = [5, 10, 15, 25] as const;

export const DEFAULT_TP_OFFSET_CENTS = 15;
export const DEFAULT_SL_OFFSET_CENTS = 10;

export function formatTpSlCentsInput(cents: number): string {
  if (!Number.isFinite(cents)) return "";
  const clamped = Math.min(
    PREDICT_MAX_PREMIUM_CENTS,
    Math.max(PREDICT_MIN_PREMIUM_CENTS, cents),
  );
  return clamped.toFixed(1);
}

export function tpPremiumCentsFromEntry(entryCents: number, offsetCents: number): number {
  return Math.min(PREDICT_MAX_PREMIUM_CENTS, entryCents + offsetCents);
}

export function slPremiumCentsFromEntry(entryCents: number, offsetCents: number): number {
  return Math.max(PREDICT_MIN_PREMIUM_CENTS, entryCents - offsetCents);
}

export function defaultTpSlPremiumsFromEntry(entryCents: number): { tp: string; sl: string } {
  return {
    tp: formatTpSlCentsInput(tpPremiumCentsFromEntry(entryCents, DEFAULT_TP_OFFSET_CENTS)),
    sl: formatTpSlCentsInput(slPremiumCentsFromEntry(entryCents, DEFAULT_SL_OFFSET_CENTS)),
  };
}

/** Map TP/SL UI value to on-chain premium (1e9 scale). */
export function tpSlToPremiumRaw(args: {
  value: number;
  unit: "pct" | "cents";
  entryPremiumRaw: bigint;
  isTakeProfit: boolean;
}): bigint {
  const { value, unit, entryPremiumRaw, isTakeProfit } = args;
  if (!Number.isFinite(value) || value <= 0 || entryPremiumRaw <= 0n) return 0n;

  if (unit === "cents") {
    return centsToPremiumRaw(value);
  }

  const factor = isTakeProfit ? 1 + value / 100 : 1 - value / 100;
  if (factor <= 0) return 0n;
  return BigInt(Math.round(Number(entryPremiumRaw) * factor));
}
