import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import { splitCoinAmount } from "@/lib/leverx/coins";
import {
  DEFAULT_PLACEMENT_SLIPPAGE_BPS,
  DEFAULT_SLIPPAGE_BPS,
  SUI_CLOCK_OBJECT_ID,
  TRADE_GAS_BUDGET,
} from "@/lib/leverx/constants";
import type { MarketKeyArgs } from "@/lib/leverx/market-keys";
import { ensureLeverxAccount, type LeverxAccount } from "@/lib/leverx/onboarding";
import { relayTradeMint, relayTradeRedeem, relayTradeSettle, relayTradeRecoverManager } from "@/lib/leverx/keeper-client";
import {
  appendCancelLimit,
  appendClearTriggers,
  appendDepositQuote,
  appendPlaceLimitMintOrder,
  appendRegisterExecutor,
  appendDeleverageDebt,
  appendRecoverFlatKeyQuote,
  appendRevokeExecutor,
  appendSetTriggers,
  appendWithdrawQuote,
  type PlaceLimitMintParams,
} from "@/lib/leverx/ptb-builder";
import {
  prepareMintTradeRequest,
  prepareRedeemTradeRequest,
  prepareSettleTradeRequest,
  prepareRecoverManagerTradeRequest,
} from "@/lib/leverx/keeper-intent-request";
import { lxplpCoinType, type LeverxProtocolConfig } from "@/lib/leverx/protocol";
import { hasIndexerOpenQuantity } from "@/lib/leverx/position-quantity";
import { fetchManagerOpenQuantity, fetchMintQuote, fetchRedeemQuote, fetchTradingQuoteBalance } from "@/lib/leverx/quotes";
import {
  applySlippageBps,
  applySlippageFloor,
  centsToPremiumRaw,
  leverageToBps,
  marginUsdToQuoteAtoms,
  positionQuoteAtoms,
} from "@/lib/leverx/trade-math";
import type { LimitMintOrder, LeveragedPosition } from "@/lib/leverx/indexer-client";
import { assertLeverxTradeCompatibility } from "@/lib/leverx/package-resolution";
import { executeWalletTransaction } from "@/lib/sui/execute-transaction";

export type LimitExecutionMode = "resting" | "immediate";

export type OpenTradeInput = {
  key: MarketKeyArgs;
  marginUsd: number;
  leverage: number;
  orderType: "market" | "limit";
  limitExecution?: LimitExecutionMode;
  limitCents?: number;
  quantity: bigint;
  marketSlippageBps?: number;
  placementSlippageBps?: number;
  orderExpiresMs?: number;
  /** When true, keeper force-deleverage may remint a 1x position from free quote. */
  remintAfterDeleverage?: boolean;
  tpPremium?: bigint;
  slPremium?: bigint;
};

export type ClosePositionInput = {
  position: LeveragedPosition;
  redeemMode?: "market" | "limit";
  minPayout?: bigint;
  minPremiumPerUnit?: bigint;
  marketSlippageBps?: number;
};

export type WithdrawQuoteInput = {
  accountId: string;
  amountAtoms: bigint;
};

export type DepositQuoteInput = {
  accountId: string;
  amountAtoms: bigint;
};

function positionToKey(position: LeveragedPosition): MarketKeyArgs {
  return {
    oracleId: position.oracle_id,
    expiryMs: position.expiry_ms,
    strike: position.strike,
    higherStrike: position.higher_strike,
    isUp: position.is_up,
    isRange: position.is_range,
  };
}

async function resolveRedeemQuantity(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  position: LeveragedPosition;
}): Promise<bigint> {
  if (!params.position.predict_manager_id) {
    throw new Error("Position is missing a linked Predict manager.");
  }
  const onChain = await fetchManagerOpenQuantity({
    client: params.client,
    packageId: params.cfg.packageId,
    predictPackageId: params.cfg.predictPackageId,
    predictManagerId: params.position.predict_manager_id,
    key: positionToKey(params.position),
  });
  if (onChain != null && onChain > 0n) return onChain;
  throw new Error(
    "No open contracts remain in your Predict manager for this market. Refresh your portfolio — it may already be settled.",
  );
}

async function resolveSettleQuantity(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  position: LeveragedPosition;
}): Promise<bigint> {
  if (!params.position.predict_manager_id) {
    throw new Error("Position is missing a linked Predict manager.");
  }
  const onChain = await fetchManagerOpenQuantity({
    client: params.client,
    packageId: params.cfg.packageId,
    predictPackageId: params.cfg.predictPackageId,
    predictManagerId: params.position.predict_manager_id,
    key: positionToKey(params.position),
  });
  if (onChain == null) {
    throw new Error(
      "Could not read contract quantity on-chain. Refresh your portfolio and try again.",
    );
  }
  if (onChain <= 0n) {
    throw new Error(
      "No contracts remain in your Predict manager for this market. The portfolio index may be stale — contracts may already be redeemed. Check Withdraw to wallet for any remaining dUSDC.",
    );
  }
  return onChain;
}

function orderToKey(order: LimitMintOrder): MarketKeyArgs {
  return {
    oracleId: order.oracle_id,
    expiryMs: order.expiry_ms,
    strike: order.strike,
    higherStrike: order.higher_strike,
    isUp: order.is_up,
    isRange: order.is_range,
  };
}

function resolveMintOrderKind(input: OpenTradeInput): "market" | "limit" | "place" {
  if (input.orderType === "market") return "market";
  return input.limitExecution === "resting" ? "place" : "limit";
}

/** Create the on-chain margin account (UserProxy + Predict manager) before the first trade. */
export async function executeCreateMarginAccount(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
}): Promise<Required<LeverxAccount>> {
  const leverxAccount = await ensureLeverxAccount({
    client: params.client,
    wallet: params.wallet,
    account: params.account,
    cfg: params.cfg,
  });

  if (!leverxAccount.predictManagerId) {
    throw new Error("Your trading account is still being set up. Refresh your portfolio and try again.");
  }

  return {
    accountId: leverxAccount.accountId,
    predictManagerId: leverxAccount.predictManagerId,
  };
}

export async function executeOpenTrade(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: OpenTradeInput;
}): Promise<{ digest: string }> {
  const { input, cfg, client, wallet, account } = params;

  const leverxAccount = await ensureLeverxAccount({
    client,
    wallet,
    account,
    cfg,
  });

  if (!leverxAccount.predictManagerId) {
    throw new Error("Your trading account is still being set up. Refresh your portfolio and try again.");
  }

  const marginAtoms = marginUsdToQuoteAtoms(input.marginUsd);
  const leverageBps = leverageToBps(input.leverage);
  let quantity = input.quantity > 0n ? input.quantity : 1n;
  const positionAtoms = positionQuoteAtoms(marginAtoms, leverageBps);
  const orderKind = resolveMintOrderKind(input);
  const limitPremiumRaw =
    input.limitCents != null && input.limitCents > 0
      ? centsToPremiumRaw(input.limitCents)
      : undefined;

  const fresh = await fetchMintQuote({
    client,
    cfg,
    accountId: leverxAccount.accountId,
    key: input.key,
    marginQuoteAtoms: marginAtoms,
    leverageBps,
    referencePremiumOverride:
      orderKind === "place" && limitPremiumRaw ? limitPremiumRaw : undefined,
  });
  if (!fresh) {
    throw new Error(
      orderKind === "place"
        ? "Could not size the order at your limit price. Lower the limit or reduce margin/leverage."
        : "Could not refresh the live contract price. The market may have moved — adjust margin or try again.",
    );
  }
  quantity = fresh.tradeQuantity;

  const marketSlippageBps = input.marketSlippageBps ?? DEFAULT_SLIPPAGE_BPS;
  const placementSlippageBps = input.placementSlippageBps ?? DEFAULT_PLACEMENT_SLIPPAGE_BPS;
  const triggerSlippageBps =
    input.marketSlippageBps ?? input.placementSlippageBps ?? DEFAULT_SLIPPAGE_BPS;
  const hasTriggers = Boolean(input.tpPremium || input.slPremium);

  await assertLeverxTradeCompatibility({
    client,
    leverxPackageId: cfg.packageId,
    predictId: cfg.predictId,
    oracleId: input.key.oracleId,
    predictManagerId: leverxAccount.predictManagerId!,
  });

  const tradingBalance = await fetchTradingQuoteBalance({
    client,
    leverxPackageId: cfg.packageId,
    accountId: leverxAccount.accountId,
  });
  if (tradingBalance < marginAtoms) {
    throw new Error(
      "Insufficient trading account balance. Deposit funds in Portfolio before opening a trade.",
    );
  }

  // Resting limit orders are owner-scoped: the trader deposits margin onto the
  // key and places the order in a single user-signed transaction (no manager
  // touch). The keeper executes the order later when it becomes marketable.
  if (orderKind === "place") {
    const placeParams: PlaceLimitMintParams = {
      key: input.key,
      marginQuoteAtoms: marginAtoms,
      leverageBps,
      quantity,
      limitPremiumPerUnit: limitPremiumRaw,
      placementSlippageBps,
      orderExpiresMs: input.orderExpiresMs ?? input.key.expiryMs,
      remintAfterDeleverage: input.remintAfterDeleverage ?? false,
    };
    return executeWalletTransaction(
      client,
      wallet,
      account,
      async (tx) => {
        appendPlaceLimitMintOrder(tx, cfg, leverxAccount.accountId, placeParams);
        if (hasTriggers) {
          appendSetTriggers(tx, cfg, {
            key: input.key,
            accountId: leverxAccount.accountId,
            takeProfitPremium: input.tpPremium ?? 0n,
            stopLossPremium: input.slPremium ?? 0n,
            takeProfitSlippageBps:
              input.tpPremium && input.tpPremium > 0n ? triggerSlippageBps : 0,
            stopLossSlippageBps:
              input.slPremium && input.slPremium > 0n ? triggerSlippageBps : 0,
          });
        }
      },
      { gasBudget: TRADE_GAS_BUDGET },
    );
  }

  // Market / immediate-limit opens mint against the keeper-owned manager and are
  // therefore keeper-relay only. Optional user-signed trigger setup runs first;
  // the keeper executes the mint as the manager owner / proxy secondary owner.
  if (hasTriggers) {
    await executeWalletTransaction(
      client,
      wallet,
      account,
      async (tx) => {
        appendSetTriggers(tx, cfg, {
          key: input.key,
          accountId: leverxAccount.accountId,
          takeProfitPremium: input.tpPremium ?? 0n,
          stopLossPremium: input.slPremium ?? 0n,
          takeProfitSlippageBps:
            input.tpPremium && input.tpPremium > 0n ? triggerSlippageBps : 0,
          stopLossSlippageBps:
            input.slPremium && input.slPremium > 0n ? triggerSlippageBps : 0,
        });
      },
      { gasBudget: TRADE_GAS_BUDGET },
    );
  }

  const auth = await prepareMintTradeRequest({
    wallet,
    account,
    intent: {
      address: account.address,
      accountId: leverxAccount.accountId,
      predictManagerId: leverxAccount.predictManagerId!,
      oracleId: input.key.oracleId,
      expiryMs: input.key.expiryMs,
      strike: input.key.strike,
      higherStrike: input.key.higherStrike ?? 0,
      isUp: input.key.isUp,
      isRange: input.key.isRange,
      marginQuoteAtoms: marginAtoms,
      leverageBps,
      quantity,
      maxMintCost: applySlippageBps(positionAtoms, marketSlippageBps),
      marketSlippageBps,
      remintAfterDeleverage: input.remintAfterDeleverage ?? false,
      orderKind: orderKind === "limit" ? "limit" : "market",
      limitPremiumPerUnit: limitPremiumRaw ?? 0n,
      placementSlippageBps,
    },
  });

  return relayTradeMint(auth);
}

export async function executeClosePosition(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: ClosePositionInput;
}): Promise<{ digest: string }> {
  const { position } = params.input;
  if (!position.predict_manager_id) {
    throw new Error("Position is missing a linked Predict manager.");
  }
  const predictManagerId = position.predict_manager_id;
  const redeemMode = params.input.redeemMode ?? "market";
  const quantity = await resolveRedeemQuantity({
    client: params.client,
    cfg: params.cfg,
    position,
  });
  let minPayout = params.input.minPayout;

  if (redeemMode === "market" && minPayout == null) {
    const quote = await fetchRedeemQuote({
      client: params.client,
      cfg: params.cfg,
      key: positionToKey(position),
      quantity,
    });
    const slippageBps = params.input.marketSlippageBps ?? DEFAULT_SLIPPAGE_BPS;
    minPayout = quote ? applySlippageFloor(quote.expectedPayout, slippageBps) : 0n;
  }

  const key = positionToKey(position);

  // Redeem mints/burns against the keeper-owned manager → keeper-relay only.
  const auth = await prepareRedeemTradeRequest({
    wallet: params.wallet,
    account: params.account,
    intent: {
      address: params.account.address,
      accountId: position.account_id,
      predictManagerId,
      oracleId: key.oracleId,
      expiryMs: key.expiryMs,
      strike: key.strike,
      higherStrike: key.higherStrike ?? 0,
      isUp: key.isUp,
      isRange: key.isRange,
      quantity,
      minPayout: minPayout ?? 0n,
      redeemMode,
      minPremiumPerUnit: params.input.minPremiumPerUnit ?? 0n,
    },
  });
  return relayTradeRedeem(auth);
}

export async function executeWithdrawQuote(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: WithdrawQuoteInput;
}): Promise<{ digest: string }> {
  if (params.input.amountAtoms <= 0n) {
    throw new Error("Withdraw amount must be greater than zero.");
  }

  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendWithdrawQuote(
        tx,
        params.cfg,
        params.input.accountId,
        params.input.amountAtoms,
      );
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeDepositQuote(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: DepositQuoteInput;
}): Promise<{ digest: string }> {
  if (params.input.amountAtoms <= 0n) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    async (tx) => {
      const quoteCoin = await splitCoinAmount(
        params.client,
        params.account.address,
        params.cfg.quoteType,
        params.input.amountAtoms,
        tx,
      );
      appendDepositQuote(
        tx,
        params.cfg,
        params.input.accountId,
        quoteCoin,
      );
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeSettleExpired(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  position: LeveragedPosition;
}): Promise<{ digest: string }> {
  if (!params.position.predict_manager_id) {
    throw new Error("Position is missing a linked Predict manager.");
  }
  const predictManagerId = params.position.predict_manager_id;
  const quantity = await resolveSettleQuantity({
    client: params.client,
    cfg: params.cfg,
    position: params.position,
  });

  const key = positionToKey(params.position);

  // Settling an expired position touches the keeper-owned manager → keeper-relay only.
  const auth = await prepareSettleTradeRequest({
    wallet: params.wallet,
    account: params.account,
    intent: {
      address: params.account.address,
      accountId: params.position.account_id,
      predictManagerId,
      oracleId: key.oracleId,
      expiryMs: key.expiryMs,
      strike: key.strike,
      higherStrike: key.higherStrike ?? 0,
      isUp: key.isUp,
      isRange: key.isRange,
      quantity,
    },
  });
  return relayTradeSettle(auth);
}

export type RecoverStrandedCustodyInput = {
  position: LeveragedPosition;
  recoverKeyQuote: bigint;
  recoverManagerQuote: bigint;
};

/** Sweep key-locked mint surplus and/or orphaned manager quote into the trading account. */
export async function executeRecoverStrandedCustody(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: RecoverStrandedCustodyInput;
}): Promise<{ digest: string }> {
  const { position, recoverKeyQuote, recoverManagerQuote } = params.input;
  if (!position.predict_manager_id) {
    throw new Error("Position is missing a linked Predict manager.");
  }
  if (recoverKeyQuote <= 0n && recoverManagerQuote <= 0n) {
    throw new Error("No stranded quote is available to recover for this position.");
  }

  const key = positionToKey(position);
  let lastDigest = "";

  if (recoverKeyQuote > 0n) {
    const keyResult = await executeWalletTransaction(
      params.client,
      params.wallet,
      params.account,
      (tx) => {
        appendRecoverFlatKeyQuote(
          tx,
          params.cfg,
          position.account_id,
          position.predict_manager_id!,
          key,
        );
      },
      { gasBudget: TRADE_GAS_BUDGET },
    );
    lastDigest = keyResult.digest;
  }

  if (recoverManagerQuote > 0n) {
    const auth = await prepareRecoverManagerTradeRequest({
      wallet: params.wallet,
      account: params.account,
      intent: {
        address: params.account.address,
        accountId: position.account_id,
        predictManagerId: position.predict_manager_id,
        oracleId: key.oracleId,
        expiryMs: key.expiryMs,
        strike: key.strike,
        higherStrike: key.higherStrike ?? 0,
        isUp: key.isUp,
        isRange: key.isRange,
        managerQuoteAtoms: recoverManagerQuote,
      },
    });
    const managerResult = await relayTradeRecoverManager(auth);
    lastDigest = managerResult.digest;
  }

  return { digest: lastDigest };
}

export async function executeRepayDebt(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  position: LeveragedPosition;
  amountAtoms: bigint;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    async (tx) => {
      const repaymentCoin = await splitCoinAmount(
        params.client,
        params.account.address,
        params.cfg.quoteType,
        params.amountAtoms,
        tx,
      );
      appendDeleverageDebt(tx, params.cfg, {
        key: positionToKey(params.position),
        accountId: params.position.account_id,
        repaymentCoin,
        slippageBps: DEFAULT_SLIPPAGE_BPS,
      });
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export type SetTriggersInput = {
  accountId: string;
  key: MarketKeyArgs;
  takeProfitPremium: bigint;
  stopLossPremium: bigint;
  marketSlippageBps?: number;
};

export async function executeSetTriggers(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  input: SetTriggersInput;
}): Promise<{ digest: string }> {
  const slippageBps = params.input.marketSlippageBps ?? DEFAULT_SLIPPAGE_BPS;
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendSetTriggers(tx, params.cfg, {
        accountId: params.input.accountId,
        key: params.input.key,
        takeProfitPremium: params.input.takeProfitPremium,
        stopLossPremium: params.input.stopLossPremium,
        takeProfitSlippageBps:
          params.input.takeProfitPremium > 0n ? slippageBps : 0,
        stopLossSlippageBps: params.input.stopLossPremium > 0n ? slippageBps : 0,
      });
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeClearTriggers(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  accountId: string;
  key: MarketKeyArgs;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendClearTriggers(tx, params.cfg, params.accountId, params.key);
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeRegisterExecutor(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  accountId: string;
  executor: string;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendRegisterExecutor(tx, params.cfg, params.accountId, params.executor);
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeRevokeExecutor(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  accountId: string;
  executor: string;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendRevokeExecutor(tx, params.cfg, params.accountId, params.executor);
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeCancelLimitOrder(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  order: LimitMintOrder;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    (tx) => {
      appendCancelLimit(tx, params.cfg, {
        key: orderToKey(params.order),
        accountId: params.order.account_id,
      });
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeVaultSupply(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  amountAtoms: bigint;
}): Promise<{ digest: string }> {
  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    async (tx) => {
      const quoteCoin = await splitCoinAmount(
        params.client,
        params.account.address,
        params.cfg.quoteType,
        params.amountAtoms,
        tx,
      );
      const [lxplpCoin] = tx.moveCall({
        target: `${params.cfg.packageId}::leverage_vault::deposit_liquidity`,
        typeArguments: [params.cfg.quoteType],
        arguments: [tx.object(params.cfg.vaultId), quoteCoin, tx.object(SUI_CLOCK_OBJECT_ID)],
      });
      tx.transferObjects([lxplpCoin!], params.account.address);
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}

export async function executeVaultWithdraw(params: {
  client: SuiJsonRpcClient;
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  cfg: LeverxProtocolConfig;
  lpAmountAtoms: bigint;
}): Promise<{ digest: string }> {
  const lxplpType = lxplpCoinType(params.cfg.packageId);

  return executeWalletTransaction(
    params.client,
    params.wallet,
    params.account,
    async (tx) => {
      const lpCoin = await splitCoinAmount(
        params.client,
        params.account.address,
        lxplpType,
        params.lpAmountAtoms,
        tx,
      );
      const [quoteCoin] = tx.moveCall({
        target: `${params.cfg.packageId}::leverage_vault::withdraw_liquidity`,
        typeArguments: [params.cfg.quoteType],
        arguments: [tx.object(params.cfg.vaultId), lpCoin, tx.object(SUI_CLOCK_OBJECT_ID)],
      });
      tx.transferObjects([quoteCoin!], params.account.address);
    },
    { gasBudget: TRADE_GAS_BUDGET },
  );
}
