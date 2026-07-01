import type { QueryClient } from "@tanstack/react-query";

/** Query-key prefixes invalidated after any LeverX on-chain mutation. */
export const LEVERX_MUTATION_QUERY_PREFIXES = [
  // Indexer REST + WS caches
  "indexer-protocol",
  "indexer-market-catalog",
  "indexer-orderbook",
  "indexer-global-trades",
  "indexer-positions",
  "indexer-limit-orders",
  "indexer-accounts",
  "indexer-account",
  "indexer-vault-summary",
  "indexer-vault-history",
  "indexer-triggers",
  "indexer-executors",
  "indexer-liquidations",
  "indexer-leaderboard",
  // Wallet balances & on-chain quote simulation
  "wallet-coin-balance",
  "trading-account-balance",
  "leverx-mint-quote",
  "leverx-market-ask",
  "leverx-visible-market-asks",
  "position-redeem-quote",
  "position-ledger-health",
  "manager-open-qty",
  "proxy-key-balance",
  "manager-quote-balance",
  // Predict server portfolio / vault (manager link, protection positions)
  "predict-manager-id",
  "predict-manager-summary",
  "predict-manager-positions",
  "predict-vault-summary",
  "predict-vault-performance",
] as const;

/** Portfolio + account caches refreshed by indexer WS position/limit events. */
export const PORTFOLIO_QUERY_PREFIXES = [
  "indexer-positions",
  "indexer-limit-orders",
  "indexer-accounts",
  "indexer-account",
  "indexer-triggers",
  "indexer-executors",
  "indexer-liquidations",
  "trading-account-balance",
  "manager-open-qty",
  "proxy-key-balance",
  "manager-quote-balance",
  "position-redeem-quote",
  "position-ledger-health",
  "predict-manager-id",
  "predict-manager-summary",
  "predict-manager-positions",
  "wallet-coin-balance",
] as const;

/** Live quote caches that drift when the order book or trades change. */
export const MARKET_QUOTE_QUERY_PREFIXES = [
  "leverx-mint-quote",
  "leverx-market-ask",
  "leverx-visible-market-asks",
  "position-redeem-quote",
] as const;

/** Cleared on wallet disconnect or in-wallet address switch. */
export const WALLET_SCOPED_QUERY_PREFIXES = [
  ...PORTFOLIO_QUERY_PREFIXES,
  "jarvis-settings",
  "jarvis-status",
  "jarvis-events",
  "telegram-trading-session",
  "telegram-subscription",
  "leverx-mint-quote",
] as const;

/** Indexer caches that often lag the keeper relay by a few seconds. */
const INDEXER_CATCH_UP_PREFIXES = [
  "indexer-positions",
  "indexer-limit-orders",
  "indexer-accounts",
  "indexer-account",
  "indexer-triggers",
  "indexer-executors",
  "trading-account-balance",
] as const;

const INDEXER_CATCH_UP_DELAYS_MS = [1500, 4000, 8000, 15000] as const;

type InvalidateOptions = {
  refetchType?: "active" | "all" | "none";
};

export async function invalidateQueryPrefixes(
  queryClient: QueryClient,
  prefixes: readonly string[],
  options: InvalidateOptions = {},
): Promise<void> {
  const refetchType = options.refetchType ?? "active";
  await Promise.all(
    prefixes.map((prefix) =>
      queryClient.invalidateQueries({ queryKey: [prefix], refetchType }),
    ),
  );
}

/** Refetch portfolio, balances, and on-chain verification after indexer WS updates. */
export async function invalidatePortfolioQueries(
  queryClient: QueryClient,
  options?: InvalidateOptions,
): Promise<void> {
  await invalidateQueryPrefixes(queryClient, PORTFOLIO_QUERY_PREFIXES, options);
}

/** Limit-order WS events also affect reserved margin, fills, and live quotes. */
export async function invalidateLimitOrderQueries(
  queryClient: QueryClient,
  options?: InvalidateOptions,
): Promise<void> {
  await invalidateQueryPrefixes(
    queryClient,
    [...PORTFOLIO_QUERY_PREFIXES, ...MARKET_QUOTE_QUERY_PREFIXES],
    options,
  );
}

/** Order-book / trade WS pushes — refresh tradable quotes. */
export async function invalidateMarketQuoteQueries(
  queryClient: QueryClient,
  options?: InvalidateOptions,
): Promise<void> {
  await invalidateQueryPrefixes(queryClient, MARKET_QUOTE_QUERY_PREFIXES, options);
}

/** Drop cached wallet/account data (logout or address switch). */
export function clearWalletScopedQueries(queryClient: QueryClient): void {
  for (const prefix of WALLET_SCOPED_QUERY_PREFIXES) {
    queryClient.removeQueries({ queryKey: [prefix] });
  }
}

/** Refetch wallet-scoped data after connect or address switch. */
export async function invalidateWalletScopedQueries(
  queryClient: QueryClient,
  options?: InvalidateOptions,
): Promise<void> {
  await invalidateQueryPrefixes(queryClient, WALLET_SCOPED_QUERY_PREFIXES, options);
}

function scheduleIndexerCatchUpRefetch(queryClient: QueryClient): void {
  for (const delayMs of INDEXER_CATCH_UP_DELAYS_MS) {
    globalThis.setTimeout(() => {
      void invalidateQueryPrefixes(queryClient, INDEXER_CATCH_UP_PREFIXES);
    }, delayMs);
  }
}

/** Refetch all app queries that may change after a LeverX contract call. */
export async function invalidateLeverxQueries(queryClient: QueryClient): Promise<void> {
  await invalidateQueryPrefixes(queryClient, LEVERX_MUTATION_QUERY_PREFIXES);
  scheduleIndexerCatchUpRefetch(queryClient);
}
