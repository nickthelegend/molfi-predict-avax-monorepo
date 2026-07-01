/** Total account value: wallet + position margin + free trading-account surplus. */
export function computeTotalBalanceUsd(params: {
  walletUsd: number;
  marginUsd: number;
  tradingAccountUsd: number;
  borrowedUsd?: number;
}): number {
  return params.walletUsd + params.marginUsd + params.tradingAccountUsd;
}
