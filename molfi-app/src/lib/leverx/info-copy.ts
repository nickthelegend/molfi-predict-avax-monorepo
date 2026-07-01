/** Short help copy for info popovers across LeverX UI. */
export const leverxInfo = {
  orderType:
    "Market orders open right away at the best available price. Limit orders queue under Open Orders until the market reaches your price.",
  marketSlippage: "How far the price can move from your target when your order fills.",
  placementSlippage:
    "Resting limits use one tolerance for two checks: the live price must be within ± this % of your limit when you submit, and fills are capped at limit + this %.",
  orderExpires: "How long a waiting order stays open before it is cancelled.",
  collateral: "dUSDC margin posted for a trade.",
  margin:
    "dUSDC from your trading account per trade (0.1–100 dUSDC). Deposit in Portfolio first. Higher leverage borrows from the vault to increase position size.",
  quantity: "How many contracts you are opening. Each one pays out based on the final price at expiry.",
  leverage:
    "Multiplier on your deposit (1×–10×). At 1× there is no vault borrow. Leverage above 1× closes one hour before market expiry.",
  leveragedMintWindow:
    "New leveraged positions cannot be opened in the final hour before expiry. Existing borrowed positions in that window are force-deleveraged to 1× (or liquidated if underwater).",
  leverageCountdown:
    "Countdown until new trades are limited to 1× margin (no vault borrow). In the final hour, only the market settlement timer remains.",
  preTradeQuote: "Estimated cost before you confirm. Sign in for the most accurate number.",
  askPerUnit: "Best available price per contract right now.",
  mintCost: "Total cost to open, including your deposit and any fees.",
  vaultBorrow: "Amount borrowed from the vault to reach your target leverage.",
  tpSl:
    "Optional auto-exit when the contract premium hits your take-profit or stop-loss price (¢ per contract). Take profit should be above entry; stop loss below entry.",
  tpSlEntry: "Estimated entry premium for this trade — used to suggest TP/SL levels.",
  tpSlTakeProfit: "Close when the contract premium rises to this price (above entry).",
  tpSlStopLoss: "Close when the contract premium falls to this price (below entry).",
  tpSlExitSlippage:
    "Maximum price movement allowed when your take-profit or stop-loss closes automatically (same limits as market orders for market exits, limit orders for limit exits).",
  remintAfterDeleverage:
    "If the pool force-deleverages your position, automatically reopen at 1× with any leftover margin. Turn off to stay in cash after deleverage.",
  strikePrice:
    "Price level for this bet. Market uses the current spot (rounded to the oracle tick). Presets offset from spot; Custom lets you enter any valid strike at or above the oracle minimum.",
  lowerStrike: "Bottom of the range — the bet pays if the final price lands inside your band.",
  upperStrike: "Top of the range — the bet pays if the final price lands inside your band.",
  limitPrice: "Most you will pay per contract when placing a limit order.",
  rangeMarket: "Pays when the final price lands inside your chosen range.",
  rangePreset:
    "Market is a tight ±0.2% band around spot. 0.5% and 1% widen the band symmetrically. Custom sets exact low and high strikes.",

  marginOpen: "Total you have locked in open trades.",
  borrowedQuote: "Amount borrowed from the pool across your account.",
  openPositions: "Number of trades still open.",
  openPositionsTable:
    "Live profit and loss and health update as prices move. Use Manage to close, repay debt, or settle after expiry.",
  positionAvgFill:
    "Average price you paid per contract when you opened (total mint cost ÷ contracts). Repaying borrow or lowering leverage does not change this.",
  positionNow:
    "Current redeem bid per contract (open positions) or average exit price when you closed.",
  positionPnlMargin:
    "Net cash back minus everything you put in from your wallet: posted margin plus any repay/deleverage payments while the position was open.",
  positionMarginBorrow:
    "Your posted margin and vault borrow on this market key. Borrow drops when you repay; leverage updates with it.",
  closedPnlBreakdown:
    "Cash you received after close, minus margin posted and any wallet repayments made before close (deleverage/repay debt). Borrow repaid at close comes from the redeem payout, not your wallet. On liquidation, surplus in the on-chain event is returned to the keeper — you only receive cash if close_surplus_quote is credited to your account.",
  accountSettings:
    "Link your trading account and allow trusted apps to trade on your behalf.",
  predictManager: "Your trading account that holds positions and balances.",
  sessionExecutor:
    "A trusted wallet or bot that can place trades for you without your main wallet key.",
  tradingServiceExecutor:
    "Authorizes the LeverX trading service to place trades on your account — used by Jarvis, Telegram trading, and limit-order automation. You approve or revoke this from your wallet anytime.",
  telegramAlerts:
    "Telegram notifications for limit fills, liquidation risk, and completed liquidations on this trading account.",
  telegramTrading:
    "Trade from Telegram. Generate a one-time code here, send /auth in the bot, then use /markets and /up. Sessions last 7 days; disconnect anytime.",
  jarvis:
    "AI assistant that checks your account every 5 minutes, manages risk, finds opportunities in markets closing soon, and closes losing positions.",
  jarvisExecutor:
    "Jarvis places trades through the platform trading service. Deposit dUSDC to your account before you turn Jarvis on.",
  triggers: "Active profit-target and stop-loss rules. Clear them when you close the matching trade.",
  collateralBalances: "dUSDC margin allocated to each open market key.",
  marginInTrades: "dUSDC margin allocated to each open market key.",
  liquidations:
    "Liquidations, force-deleverages, and bad-debt write-offs when health falls below the protocol threshold.",
  withdrawTradingBalance: "Move surplus to your wallet.",
  withdrawDialogDescription:
    "Withdraw free surplus from your trading account to your wallet. Outstanding vault borrow reduces what you can pull out (withdrawable = key balance − borrow).",
  withdrawDialogWithdrawableHint:
    "Free surplus on each market key — not vault borrow (debt), and not margin locked in open trades.",
  withdrawTradingBalanceDetail:
    "dUSDC credited after closing a trade or adding margin. You can withdraw up to the free balance on each key after subtracting any outstanding borrow on that key.",
  depositTradingBalance: "Move dUSDC from your wallet to trade.",
  depositTradingBalanceDetail:
    "Deposits go to a specific market on your trading account. Your trusted trading bot uses that balance when placing trades.",
  funds:
    "Move dUSDC between wallet and trading account. Withdrawable is free surplus you can pull out now (key balance minus borrow).",
  portfolioOverviewDetail:
    "Net equity, unrealized P&L, margin posted, and vault borrow across open positions. P&L and health include quote locked on market keys, matching on-chain liquidation math.",
  portfolioNetEquity:
    "What you would keep after redeeming at the live bid and repaying vault borrow, including quote locked on each market key.",
  withdrawEmpty: "Nothing to withdraw right now.",
  withdrawEmptyDetail:
    "Withdrawable is free surplus on your trading account — not borrowed vault debt. Surplus appears on a market key after you close a trade and that key’s payout lands.",
  managerWithdrawLockedDetail:
    "Borrowed is debt on your trading account, not cash you can pull out. Outstanding vault borrow reduces what you can withdraw (withdrawable = trading-account balance − borrow). Close positions or repay debt to free more.",
  estimatedHealth:
    "Estimated collateral ratio: (live redeem bid + quote locked on the market key) ÷ vault borrow. Matches on-chain liquidation checks.",

  vaultSupply: "Add dUSDC to the pool and receive shares that earn from trading fees.",
  vaultWithdraw: "Cash out your shares back to dUSDC, including any earnings.",
  vaultAmount: "dUSDC to deposit, or shares to redeem when withdrawing.",
  vaultTvl: "Total value currently in the pool.",
  vaultApr: "Estimated yearly return from trading fees and borrow demand.",
  vaultUtil: "Share of pool funds currently lent to traders.",

  markPrice: "Live price of the underlying asset.",
  premium: "Current contract price for this market (shown in cents).",
  volume24h: "Total traded in the last 24 hours.",
  vaultNav: "Total value in the pool backing leveraged trades.",
  autoClose: "When this market settles and your position closes.",

  orderBook:
    "Resting limit bids from traders and the live LP mint price. Bids are real open limits; the ask is the current vault mint quote.",
  orderBookSide: "Switch outcome to view limits and LP pricing for UP, DOWN, or RANGE.",
  spread: "Gap between the best limit bid and the live LP mint price.",

  balanceTotal:
    "Wallet dUSDC plus margin and free trading-account surplus, minus vault borrow across your account.",
  balanceTradingAccount:
    "dUSDC in your trading account — deposit from your wallet to trade. You can withdraw free surplus back to your wallet anytime.",
  balanceWithdrawable: "Surplus you can withdraw to your wallet now.",
  balanceWithdrawableHint:
    "Free surplus only — not vault borrow (debt), and not margin in open trades.",
  balanceWithdrawableDetail:
    "Counts dUSDC sitting as free surplus on your trading-account market keys. Outstanding vault borrow reduces it (withdrawable = trading-account balance − borrow); borrowed debt itself is not withdrawable.",
  balanceWallet: "dUSDC in your connected wallet. Deposit to your trading account before opening trades.",
  balanceMargin: "Your own funds posted in open trades.",
  balanceBorrowed:
    "Vault debt from leveraged trades. Not withdrawable — repay by closing positions or repaying debt.",
  balancePositions: "Number of open trades.",
  unrealizedPnl:
    "Profit or loss if you closed now at the live redeem bid, including quote locked on the market key (mint surplus stays on the key until close or recovery).",
  openOrders: "Resting limit orders waiting to be filled.",
  closedPositions:
    "Trades that have been closed or settled. Avg fill is what you paid per contract; P&L is your net return on posted margin (can be positive even when exit price is below entry, after borrow is repaid).",

  closeMarket: "Close now at the best available price.",
  closeLimit: "Close only if the price meets your minimum.",
  repayDebt: "Pay back borrowed dUSDC without closing contracts. Leverage and borrow update after repay.",
  settleExpired:
    "Finalize redemption after the market settles. Uses your actual contract count, not the portfolio summary.",
  recoverStrandedCustody:
    "Move quote locked on this market key and/or sitting in your Predict manager into your trading account. Use when contracts are already flat on-chain.",
  portfolioIndexStaleDetail:
    "On-chain contract count is zero, but the portfolio index still lists these rows. Check locked-on-key and manager balances below — use Recover funds if quote is stranded. Then withdraw from the Account tab.",
  positionIndexStaleDetail:
    "On-chain contracts are zero while the portfolio index still shows this row. Funds may be locked on the market key (mint surplus) or in your Predict manager — not in Trading Balance until recovered.",
  lockedKeyQuote:
    "Mint surplus and collateral locked on this market key. Counted in health and unrealized P&L the same way as on-chain — not in free Trading Balance until recovered.",
  managerQuoteBalance:
    "Quote held in your Predict manager. After contracts are flat, use Recover funds to move it into your trading account.",
  positionFullyRedeemed: "Contracts fully redeemed on-chain.",
  positionAwaitingOracleSettlement:
    "Market expired. Wait for oracle settlement, then use Settle expired.",
  tradingPaused:
    "New opens, limit fills, and triggers are paused. You can still close, repay debt, and settle expired positions.",
  quotePaused:
    "Live contract pricing is unavailable right now. New orders are paused until the quote recovers.",
  protocolNotConfigured:
    "Trading is not fully set up yet. Check back once the app is connected to live markets.",

  landingHealth:
    "Each trade tracks whether you are ahead or behind. If the market moves too far against you, the position may be closed automatically.",
  landingVault:
    "The pool holds dUSDC for settlement and borrow. Add funds and earn a share of fees over time.",
  landingKeeper:
    "A helper is a small app you run in the background. It keeps markets fair and you can earn fees when yours completes work first.",

  keeperPull: "Official download for the LeverX helper app.",
  keeperPrivateKey:
    "A demo wallet that pays network fees. Use a separate wallet with only enough for fees — never share your main key.",
  keeperKeyHint: "Add your key as an environment variable. Never save it in code or commit it to git.",
  keeperRun: "Starts the helper on port 3001.",
  keeperRunHint: "Replace the placeholder key before starting. Restart if you change keys.",
  keeperHealth: "Shows OK when the helper is up and responding.",
  keeperRewards:
    "When your helper closes a risky trade or settles an expired one, you may receive part of the fee.",
} as const;
