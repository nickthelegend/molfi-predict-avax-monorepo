export const indexerKeys = {
  health: ["indexer-health"] as const,
  protocol: ["indexer-protocol"] as const,
  catalog: (oracleId?: string, isRange?: boolean) =>
    ["indexer-market-catalog", oracleId ?? "all", isRange ?? "any"] as const,
  orderBook: (
    oracleId: string,
    expiryMs: number,
    strike: number,
    higherStrike: number,
    isUp: boolean,
    isRange: boolean,
  ) =>
    [
      "indexer-orderbook",
      oracleId,
      expiryMs,
      strike,
      higherStrike,
      isUp,
      isRange,
    ] as const,
  globalTrades: (oracleId: string) => ["indexer-global-trades", oracleId] as const,
  positions: (owner?: string, status?: string, oracleId?: string) =>
    ["indexer-positions", owner ?? "", status ?? "open", oracleId ?? ""] as const,
  limitOrders: (owner?: string, oracleId?: string) =>
    ["indexer-limit-orders", owner ?? "", oracleId ?? ""] as const,
  accounts: (owner?: string) => ["indexer-accounts", owner ?? ""] as const,
  account: (accountId: string) => ["indexer-account", accountId] as const,
  vaultSummary: (vaultId: string) => ["indexer-vault-summary", vaultId] as const,
  vaultHistory: (vaultId: string) => ["indexer-vault-history", vaultId] as const,
  triggers: (accountId?: string) => ["indexer-triggers", accountId ?? ""] as const,
  executors: (accountId?: string) => ["indexer-executors", accountId ?? ""] as const,
  liquidations: (accountId?: string, owner?: string) =>
    ["indexer-liquidations", accountId ?? "", owner ?? ""] as const,
  leaderboard: (limit?: number) => ["indexer-leaderboard", limit ?? 100] as const,
};
