/** Floor for “you have almost no SUI” — real txs also need balance >= gas budget. */
export const MIN_SUI_GAS_MIST = 5_000_000n;

const SUI_SCALE = 1_000_000_000n;

export const INSUFFICIENT_GAS_MESSAGE =
  "Not enough SUI for network fees. Add SUI to your wallet to pay gas, then try again.";

export const GAS_BUDGET_EXCEEDED_MESSAGE =
  "This transaction needs more gas than allowed. Refresh the page and try again.";

/** Wallet dry-run: "Balance of gas object 95641264 is lower than the needed amount: 150000000" */
const GAS_OBJECT_BALANCE_RE =
  /balance of gas object (\d+) is lower than the needed amount:\s*(\d+)/i;

export class InsufficientGasError extends Error {
  constructor(message = INSUFFICIENT_GAS_MESSAGE) {
    super(message);
    this.name = "InsufficientGasError";
  }
}

function mistToSuiDisplay(mist: bigint): string {
  const whole = mist / SUI_SCALE;
  const frac = mist % SUI_SCALE;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole}.${fracStr}`;
}

export function formatInsufficientGasMessage(
  haveMist?: bigint,
  neededMist?: bigint,
): string {
  if (haveMist != null && neededMist != null) {
    return (
      `Not enough SUI for network fees. You have ${mistToSuiDisplay(haveMist)} SUI ` +
      `but this transaction needs at least ${mistToSuiDisplay(neededMist)} SUI reserved for gas. ` +
      "Add SUI to your wallet and try again."
    );
  }
  return INSUFFICIENT_GAS_MESSAGE;
}

export function parseGasBalanceShortfall(
  raw: string,
): { have: bigint; needed: bigint } | null {
  const match = raw.match(GAS_OBJECT_BALANCE_RE);
  if (!match) return null;
  return { have: BigInt(match[1]!), needed: BigInt(match[2]!) };
}

export function isInsufficientGasError(raw: string): boolean {
  if (raw.includes("InsufficientGasError")) return true;
  if (GAS_OBJECT_BALANCE_RE.test(raw)) return true;

  const lower = raw.toLowerCase();
  if (lower.includes("insufficient gas")) return true;
  if (lower.includes("gasbalancetoolow")) return true;
  if (lower.includes("no valid gas coins")) return true;
  if (lower.includes("no gas coin")) return true;
  if (lower.includes("not enough sui")) return true;
  if (raw.includes("sui::SUI") && lower.includes("insufficient")) return true;
  if (lower.includes("gas payment") && lower.includes("insufficient")) return true;
  if (lower.includes("insufficient") && lower.includes("gas")) return true;
  if (
    lower.includes("error checking transaction input objects") &&
    lower.includes("gas object")
  ) {
    return true;
  }

  return false;
}

export function isGasBudgetExceededError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return (
    lower.includes("gas budget") &&
    (lower.includes("exceed") || lower.includes("too low") || lower.includes("too small"))
  );
}
