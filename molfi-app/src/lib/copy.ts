/** Shared plain-language labels for UI surfaces. */
import {
  formatDecimalWithSubscript,
  formatDecimalWithSubscriptFromParts,
  SUBSCRIPT_DUST_THRESHOLD,
  truncateToFractionDigits,
} from "@/lib/format-decimal-subscript";
import { formatAssetPriceUsdWithSymbol } from "@/lib/leverx/format-asset-price";

export const ui = {
  appTagline: "Leveraged trading on price predictions",
  tabMarkets: "Markets",
  tabPortfolio: "Portfolio",
  tabPoints: "Points",
  connectHint: "Demo network · Google sign-in",
  priceNow: "Price now",
  markPrice: "Current price",
  priceChart: "Price chart",
  predictionCatalogHint: "Live markets you can trade right now",
  predictionActiveOnly: "Active only",
  predictionSearchPlaceholder: "Search markets…",
  predictVaultTitle: "Shared pool",
  predictVaultHint: "dUSDC pool backing settlement and borrow on demo markets",
  predictVaultValue: "Pool value",
  predictVaultUtilization: "In use",
  predictVaultMaxPayoutUtil: "Max payout",
  predictVaultAvailable: "Available to borrow",
  predictPlpSharePrice: "Your share price",
  vaultPageTitle: "Pool",
  vaultPageHint: "Add dUSDC to the pool and earn from trading fees as activity grows.",
  vaultApr: "Estimated return",
  vaultYourPosition: "Your balance",
  vaultYourEarned: "Total earned",
  vaultAvailableWithdraw: "Available to withdraw",
  vaultLiquidityAction: "Action",
  vaultSupply: "Deposit",
  vaultWithdraw: "Withdraw",
  vaultSupplyAmount: "Deposit amount",
  vaultWithdrawAmount: "Withdraw amount",
  vaultSupplyCta: "Deposit dUSDC",
  vaultWithdrawCta: "Withdraw dUSDC",
  vaultActionHint:
    "Deposit dUSDC to earn from trading activity, or withdraw your balance anytime. Sign in first.",
  vaultPoolDetails: "Pool details",
  vaultPoolDetailsHint: "Live stats updated as trading activity changes.",
  vaultChartTitle: "Performance",
  vaultChartTvl: "Pool size",
  vaultChartApr: "Return",
  vaultChartEmpty: "No history yet",
  vaultChartEmptyHint: "Charts appear once the pool has activity.",
  keeperPageTitle: "Run a helper",
  keeperPageHint:
    "Helpers keep markets running — closing expired trades, matching orders, and stepping in on risky positions. You can earn a share of fees when yours runs successfully.",
  keeperStepPull: "Download the app",
  keeperStepKey: "Sign in with Google",
  keeperStepRun: "Start the helper",
  keeperHealthLabel: "Make sure it is running",
  keeperIndexerHint:
    "If you host your own setup, point the app to your helper’s address (default uses port 3001).",
  keeperRewardsHint: "Successful helper runs can earn a share of protocol fees.",
  keeperVaultLink: "Prefer passive income? Add funds to the pool instead",
  portfolioHint: "Your account balance, profit and loss, and open trades.",
  portfolioAccountValue: "Account value",
  balanceTotal: "Total balance",
  balanceWithdrawable: "Withdrawable now",
  balanceAvailable: "Avail",
  balanceInPositions: "In open trades",
  balanceRealizedPnl: "Realized profit & loss",
  balanceConnectHint: "Sign in to see your balance.",
  balanceWallet: "Wallet",
  predictManagerTitle: "Your trading account",
  predictManagerHint: "Balance and open trades for your wallet",
  predictManagerBalance: "Trading bal",
  predictManagerRealizedPnl: "Realized P&L",
  predictManagerUnrealizedPnl: "Unrealized P&L",
  predictManagerOpenPositions: "Open trades",
  predictManagerRecentPositions: "Recent trades",
  predictManagerEmpty: "No trading account yet — one is created when you place your first trade.",
  predictOracleSpot: "Price",
  backToMarkets: "Back to markets",
  connectForTrades: "Sign in to trade and view your positions.",
  connectToTrade: "Sign in to open a trade.",
  tradeUp: "UP",
  tradeDown: "DOWN",
  tradeRange: "RANGE",
  instrumentsHint: "Bet price goes up, down, or stays in a range",
  loadingMarkets: "Loading markets…",
  loadingOracles: "Loading markets…",
  loadingVault: "Loading pool…",
  loadingManager: "Loading account…",
  loadingTrades: "Loading trades…",
  loadingChart: "Loading chart…",
  emptyMarkets: "No markets right now",
  emptyMarketsHint: "Markets will show up here when they are available to trade.",
  emptyFavoriteMarkets: "No favorites yet",
  emptyFavoriteMarketsHint: "Bookmark markets from the list to find them here quickly.",
  emptyPositions: "No open trades",
  emptyPositionsHint: "Your open trades will appear here after your first position.",
  predictServerDisabled: "Live data unavailable",
  predictServerDisabledHint: "Some numbers may be unavailable until the connection is restored.",
} as const;

const MAX_DISPLAY_FRACTION_DIGITS = 6;
const LARGE_AMOUNT_FRACTION_DIGITS = 2;
const LARGE_AMOUNT_THRESHOLD = 1;

function hasHiddenFractionalDust(abs: number, fractionDigits: number): boolean {
  return abs > truncateToFractionDigits(abs, fractionDigits) + 1e-12;
}

function formatAmountSubscript(abs: number, sign: string, fractionDigits: number): string | null {
  const subscript = formatDecimalWithSubscript(abs, sign);
  if (subscript !== null) return subscript;

  if (!hasHiddenFractionalDust(abs, fractionDigits)) return null;

  const plain = abs.toString();
  const str =
    plain.includes("e") || plain.includes("E") || !plain.includes(".") ? abs.toFixed(6) : plain;
  const dot = str.indexOf(".");
  if (dot === -1) return null;
  return formatDecimalWithSubscriptFromParts(
    str.slice(0, dot),
    str.slice(dot + 1),
    sign,
    SUBSCRIPT_DUST_THRESHOLD,
  );
}

export function formatAmountWithMaxDigits(value: number, maximumFractionDigits?: number): string {
  if (!Number.isFinite(value)) return "0";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs === 0) return "0";

  const fractionDigits =
    maximumFractionDigits ??
    (abs >= LARGE_AMOUNT_THRESHOLD ? LARGE_AMOUNT_FRACTION_DIGITS : MAX_DISPLAY_FRACTION_DIGITS);

  const subscript = formatAmountSubscript(abs, sign, fractionDigits);
  if (subscript !== null) return subscript;

  const truncated = truncateToFractionDigits(abs, fractionDigits);
  if (truncated === 0) return "0";

  return (
    sign +
    truncated.toLocaleString(undefined, {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
    })
  );
}

export function formatAmount(value: number): string {
  return formatAmountWithMaxDigits(value);
}

export function formatPrice(_base: string, value: number): string {
  return formatAssetPriceUsdWithSymbol(value);
}

export function formatUsdc(amount: number): string {
  return `${formatAmount(amount)} USDC`;
}

export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value.toLocaleString();
}

/** Compact USD for tables, e.g. $32K / $1.2M */
export function formatCompactUsd(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "—";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${Math.round(amount)}`;
}
