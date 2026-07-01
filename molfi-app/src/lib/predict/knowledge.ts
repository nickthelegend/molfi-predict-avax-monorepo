/**
 * DeepBook Predict facts (workshop FAQ, Mar 2026).
 * @see docs/DEEPBOOK_PREDICT.md
 */

export const PREDICT_WORKSHOP_SCRIPTS_URL =
  "https://github.com/MystenLabs/deepbookv3/tree/tlee/predict-workshop/scripts/transactions/predict_workshop";

/** Testnet oracle / contract expirations (days). */
export const PREDICT_TESTNET_EXPIRATION_DAYS = [1, 2, 7, 14, 21] as const;

export const PREDICT_DEFAULT_TERM_SEC = 86_400; // 1 day — shortest testnet tenor

export const PREDICT_MAINNET_TARGET = "Q3";

export const PREDICT_INSTRUMENT_SUMMARY =
  "Binary UP/DOWN positions and vertical RANGE bands on asset-price oracles (not vanilla options).";

export const PREDICT_LIQUIDITY_SUMMARY =
  "Shared LP vault (USDSUI at launch); LPs are the counterparty, not an order book.";

export function formatPredictTimeRemaining(expiryMs: number, now = Date.now()): string {
  const sec = Math.max(0, Math.floor((expiryMs - now) / 1000));
  const days = Math.floor(sec / 86_400);
  const hours = Math.floor((sec % 86_400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (days >= 1) return days === 1 ? "~1 day" : `~${days} days`;
  if (hours >= 1) return hours === 1 ? "~1 hour" : `~${hours} hours`;
  return minutes > 0 ? `~${minutes}m` : "<1m";
}

export function formatPolicyCountdown(sec: number): string {
  const days = Math.floor(sec / 86_400);
  const hours = Math.floor((sec % 86_400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${sec % 60}s`;
}
