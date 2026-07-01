import type { LeveragedPosition, UserProxy } from "@/lib/leverx/indexer-client";

function nonEmptyId(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Linked Predict manager — prefer account row, fall back to open/closed positions. */
export function resolvePredictManagerId(
  accounts: readonly UserProxy[],
  positions: readonly LeveragedPosition[] = [],
): string | undefined {
  const fromAccount = nonEmptyId(accounts[0]?.predict_manager_id);
  if (fromAccount) return fromAccount;

  for (const position of positions) {
    const id = nonEmptyId(position.predict_manager_id);
    if (id) return id;
  }
  return undefined;
}

/** User proxy object id — prefer account row, fall back to position rows. */
export function resolveAccountId(
  accounts: readonly UserProxy[],
  positions: readonly LeveragedPosition[] = [],
): string | undefined {
  const fromAccount = nonEmptyId(accounts[0]?.account_id);
  if (fromAccount) return fromAccount;

  for (const position of positions) {
    const id = nonEmptyId(position.account_id);
    if (id) return id;
  }
  return undefined;
}

/** Minimal account projection when `/v1/accounts` is empty but positions exist. */
export function resolveTradingAccount(
  accounts: readonly UserProxy[],
  positions: readonly LeveragedPosition[],
  owner: string,
): UserProxy | null {
  if (accounts[0]) return accounts[0];

  const accountId = resolveAccountId(accounts, positions);
  if (!accountId) return null;

  return {
    account_id: accountId,
    owner,
    predict_manager_id: resolvePredictManagerId(accounts, positions) ?? null,
    borrowed_quote: 0,
    created_at_ms: 0,
    updated_at_ms: 0,
  };
}
