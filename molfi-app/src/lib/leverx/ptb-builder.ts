import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from "@/lib/leverx/constants";
import { addMarketKey, type MarketKeyArgs } from "@/lib/leverx/market-keys";
import type { LeverxProtocolConfig } from "@/lib/leverx/protocol";
import type { TransactionObjectArgument } from "@mysten/sui/transactions";

export type PlaceLimitMintParams = {
  key: MarketKeyArgs;
  marginQuoteAtoms: bigint;
  leverageBps: bigint;
  quantity: bigint;
  limitPremiumPerUnit?: bigint;
  placementSlippageBps?: number;
  orderExpiresMs?: number;
  /** When true, keeper force-deleverage may remint a 1x position from free quote. */
  remintAfterDeleverage?: boolean;
};

export type TriggerParams = {
  key: MarketKeyArgs;
  accountId: string;
  takeProfitPremium: bigint;
  stopLossPremium: bigint;
  takeProfitSlippageBps: number;
  stopLossSlippageBps: number;
};

export type VaultSupplyParams = {
  quoteCoin: TransactionObjectArgument;
};

export type VaultWithdrawParams = {
  lpCoin: TransactionObjectArgument;
};

function placeLimitMintFn(isRange: boolean): string {
  return isRange ? "place_range_limit_mint_order" : "place_binary_limit_mint_order";
}

function cancelFn(isRange: boolean): string {
  return isRange ? "cancel_range_limit_mint_order" : "cancel_binary_limit_mint_order";
}

/**
 * Deposit quote into the single trading account. Custody is key-agnostic — there is
 * one spendable trading-account balance per proxy that funds every position.
 */
export function buildDepositQuote(
  cfg: LeverxProtocolConfig,
  accountId: string,
  quoteCoin: TransactionObjectArgument,
): Transaction {
  const tx = new Transaction();
  appendDepositQuote(tx, cfg, accountId, quoteCoin);
  return tx;
}

export function appendDepositQuote(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  quoteCoin: TransactionObjectArgument,
): void {
  tx.moveCall({
    target: `${cfg.packageId}::trade::deposit_quote`,
    typeArguments: [cfg.quoteType],
    arguments: [tx.object(accountId), quoteCoin],
  });
}

export function appendWithdrawQuote(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  amountAtoms: bigint,
): void {
  tx.moveCall({
    target: `${cfg.packageId}::trade::withdraw_quote`,
    typeArguments: [cfg.quoteType],
    arguments: [tx.object(accountId), tx.pure.u64(amountAtoms)],
  });
}

/** Sweep mint surplus from a flat market key into the trading account. */
export function appendRecoverFlatKeyQuote(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  predictManagerId: string,
  key: MarketKeyArgs,
): void {
  const marketKey = addMarketKey(tx, key, cfg.predictPackageId);
  const fn = key.isRange
    ? "recover_flat_range_key_quote"
    : "recover_flat_binary_key_quote";

  tx.moveCall({
    target: `${cfg.packageId}::trade::${fn}`,
    typeArguments: [cfg.quoteType],
    arguments: [
      tx.object(accountId),
      tx.object(predictManagerId),
      marketKey,
    ],
  });
}

/**
 * Place a resting limit mint order. Owner-scoped (`assert_can_act`) and does not
 * touch the keeper-owned Predict manager, so the trader signs it directly. The
 * keeper later executes the order when it becomes marketable.
 */
export function appendPlaceLimitMintOrder(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  params: PlaceLimitMintParams,
): void {
  const marketKey = addMarketKey(tx, params.key, cfg.predictPackageId);
  tx.moveCall({
    target: `${cfg.packageId}::trade::${placeLimitMintFn(params.key.isRange)}`,
    typeArguments: [cfg.quoteType],
    arguments: [
      tx.object(cfg.registryId),
      tx.object(accountId),
      tx.object(cfg.predictId),
      tx.object(params.key.oracleId),
      marketKey,
      tx.pure.u64(params.limitPremiumPerUnit ?? 0n),
      tx.pure.u64(params.placementSlippageBps ?? 500),
      tx.pure.u64(params.marginQuoteAtoms),
      tx.pure.u64(params.leverageBps),
      tx.pure.u64(params.quantity),
      tx.pure.u64(params.orderExpiresMs ?? params.key.expiryMs),
      tx.pure.bool(params.remintAfterDeleverage ?? false),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
}

/** Set or update take-profit / stop-loss triggers for a key. Owner-scoped. */
export function appendSetTriggers(tx: Transaction, cfg: LeverxProtocolConfig, params: TriggerParams): void {
  const marketKey = addMarketKey(tx, params.key, cfg.predictPackageId);
  const fn = params.key.isRange ? "set_range_triggers" : "set_automated_triggers_entry";
  tx.moveCall({
    target: `${cfg.packageId}::triggers::${fn}`,
    arguments: [
      tx.object(params.accountId),
      marketKey,
      tx.pure.u64(params.takeProfitPremium),
      tx.pure.u64(params.stopLossPremium),
      tx.pure.u64(params.takeProfitSlippageBps),
      tx.pure.u64(params.stopLossSlippageBps),
    ],
  });
}

export function appendDeleverageDebt(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  params: {
    key: MarketKeyArgs;
    accountId: string;
    repaymentCoin: TransactionObjectArgument;
    slippageBps?: number;
  },
): void {
  const marketKey = addMarketKey(tx, params.key, cfg.predictPackageId);
  const fn = params.key.isRange
    ? "deleverage_range_account_balance"
    : "deleverage_binary_account_balance";

  tx.moveCall({
    target: `${cfg.packageId}::trade::${fn}`,
    typeArguments: [cfg.quoteType],
    arguments: [
      tx.object(cfg.registryId),
      tx.object(cfg.vaultId),
      tx.object(cfg.feeCollectorId),
      tx.object(params.accountId),
      marketKey,
      params.repaymentCoin,
      tx.pure.u64(params.slippageBps ?? 500),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });
}

export function appendClearTriggers(
  tx: Transaction,
  _cfg: LeverxProtocolConfig,
  accountId: string,
  key: MarketKeyArgs,
): void {
  const marketKey = addMarketKey(tx, key, _cfg.predictPackageId);
  const fn = key.isRange ? "clear_range_triggers" : "clear_automated_triggers";

  tx.moveCall({
    target: `${_cfg.packageId}::triggers::${fn}`,
    arguments: [tx.object(accountId), marketKey],
  });
}

export function appendRegisterExecutor(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  executor: string,
): void {
  tx.moveCall({
    target: `${cfg.packageId}::trade::register_executor_entry`,
    arguments: [tx.object(accountId), tx.pure.address(executor)],
  });
}

export function appendRevokeExecutor(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  accountId: string,
  executor: string,
): void {
  tx.moveCall({
    target: `${cfg.packageId}::trade::revoke_executor_entry`,
    arguments: [tx.object(accountId), tx.pure.address(executor)],
  });
}

export function appendCancelLimit(
  tx: Transaction,
  cfg: LeverxProtocolConfig,
  params: { key: MarketKeyArgs; accountId: string },
): void {
  const marketKey = addMarketKey(tx, params.key, cfg.predictPackageId);
  tx.moveCall({
    target: `${cfg.packageId}::trade::${cancelFn(params.key.isRange)}`,
    arguments: [tx.object(params.accountId), marketKey],
  });
}

export function buildSetTriggersTx(cfg: LeverxProtocolConfig, params: TriggerParams): Transaction {
  const tx = new Transaction();
  appendSetTriggers(tx, cfg, params);
  return tx;
}

export function buildVaultSupplyTx(
  cfg: LeverxProtocolConfig,
  params: VaultSupplyParams,
  recipient: string,
): Transaction {
  const tx = new Transaction();

  const [lxplpCoin] = tx.moveCall({
    target: `${cfg.packageId}::leverage_vault::deposit_liquidity`,
    typeArguments: [cfg.quoteType],
    arguments: [tx.object(cfg.vaultId), params.quoteCoin, tx.object(SUI_CLOCK_OBJECT_ID)],
  });

  tx.transferObjects([lxplpCoin!], recipient);
  return tx;
}

export function buildVaultWithdrawTx(
  cfg: LeverxProtocolConfig,
  params: VaultWithdrawParams,
  recipient: string,
): Transaction {
  const tx = new Transaction();

  const [quoteCoin] = tx.moveCall({
    target: `${cfg.packageId}::leverage_vault::withdraw_liquidity`,
    typeArguments: [cfg.quoteType],
    arguments: [tx.object(cfg.vaultId), params.lpCoin, tx.object(SUI_CLOCK_OBJECT_ID)],
  });

  tx.transferObjects([quoteCoin!], recipient);
  return tx;
}

export function buildOnboardingTx(
  cfg: LeverxProtocolConfig,
  predictManagerId: string,
): Transaction {
  const tx = new Transaction();

  tx.moveCall({
    target: `${cfg.packageId}::trade::create_user_proxy`,
    arguments: [tx.object(cfg.registryId), tx.object(predictManagerId)],
  });

  return tx;
}
