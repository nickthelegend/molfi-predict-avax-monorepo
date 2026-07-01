import {
  formatInsufficientGasMessage,
  GAS_BUDGET_EXCEEDED_MESSAGE,
  INSUFFICIENT_GAS_MESSAGE,
  InsufficientGasError,
  isGasBudgetExceededError,
  isInsufficientGasError,
  parseGasBalanceShortfall,
} from "@/lib/sui/insufficient-gas";
import { describeLeverxAbort } from "@/lib/leverx/leverx-abort-messages";

const RELAY_FAILED_MESSAGE = "Your trade could not be completed. Please try again in a moment.";

/** A relayed trade op (mint/redeem/settle) bounced back from the keeper API. */
function isRelayFailure(raw: string): boolean {
  return /\/trade\/(mint|redeem|settle)_failed/.test(raw);
}

export function formatTxError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Transaction failed.";

  if (error instanceof InsufficientGasError) {
    return error.message;
  }

  const gasShortfall = parseGasBalanceShortfall(raw);
  if (gasShortfall) {
    return formatInsufficientGasMessage(gasShortfall.have, gasShortfall.needed);
  }
  if (isInsufficientGasError(raw)) {
    return INSUFFICIENT_GAS_MESSAGE;
  }
  if (isGasBudgetExceededError(raw)) {
    return GAS_BUDGET_EXCEEDED_MESSAGE;
  }

  const abortMessage = describeLeverxAbort(raw);
  if (abortMessage) {
    return abortMessage;
  }

  if (raw.includes("LeverxOnboardingError") || raw.includes("trading account is still being set up")) {
    return "Your trading account is still being set up. Refresh your portfolio in a moment and try again.";
  }
  if (raw.includes("FunctionNotFound")) {
    return "This app build is out of sync with the on-chain LeverX package. Refresh the page; if it persists, open Portfolio → Account to set up a new trading account.";
  }
  if (
    raw.includes("LeverxDeployMismatchError") ||
    raw.includes("incompatible with the linked DeepBook Predict")
  ) {
    return raw.replace(/^LeverxDeployMismatchError:\s*/i, "");
  }
  if (raw.includes("CommandArgumentError") && raw.includes("TypeMismatch")) {
    return (
      "On-chain LeverX package types do not match the linked DeepBook Predict objects. " +
      "The testnet package must be republished with the published deepbook_predict dependency " +
      "(contracts/Move.toml), then deploy_and_share must be run again."
    );
  }
  if (raw.includes("InsufficientCoinBalanceError")) {
    return "Insufficient dUSDC in your wallet for this transaction.";
  }
  if (raw.includes("Insufficient") && raw.includes("balance") && !raw.includes("sui::SUI")) {
    return "Insufficient dUSDC in your wallet for this transaction.";
  }

  console.log("raw error", raw); // dont delete this
  if (isRelayFailure(raw)) {
    return RELAY_FAILED_MESSAGE;
  }
  return raw;
}
