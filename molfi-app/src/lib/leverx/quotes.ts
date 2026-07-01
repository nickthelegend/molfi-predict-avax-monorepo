import { Transaction } from "@mysten/sui/transactions";
import type { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { READONLY_SENDER } from "@/context/WalletContext";
import {
  PREDICT_QUOTE_REFERENCE_QUANTITY,
  SUI_CLOCK_OBJECT_ID,
} from "@/lib/leverx/constants";
import { addLeverxMarketKey, addPredictMarketKey, type MarketKeyArgs } from "@/lib/leverx/market-keys";
import type { LeverxProtocolConfig } from "@/lib/leverx/protocol";
import {
  classifyPredictPremium,
  estimateQuantity,
  isPremiumDisplayable,
  maxMintBudgetAtoms,
  premiumPerUnitFromMintCost,
} from "@/lib/leverx/trade-math";
import { coerceQuoteAtomsToBigInt } from "@/lib/predict/scaling";

export type PredictQuoteConfig = Pick<
  LeverxProtocolConfig,
  "packageId" | "predictId" | "predictPackageId"
>;

export type MintQuote = {
  marketAskPerUnit: bigint;
  mintCost: bigint;
  borrowQuote: bigint;
  /** Contracts implied by margin, leverage, and live ask. */
  tradeQuantity: bigint;
};

export type RedeemQuote = {
  marketBidPerUnit: bigint;
  expectedPayout: bigint;
};

type ReturnValueBytes = number[] | Uint8Array | string;

function toU8(raw: ReturnValueBytes): Uint8Array {
  if (typeof raw === "string") {
    const bin = atob(raw);
    return Uint8Array.from(bin, (c) => c.charCodeAt(0));
  }
  if (raw instanceof Uint8Array) return raw;
  return Uint8Array.from(raw);
}

/** Parse the first 8 BCS bytes as little-endian u64. */
function parseU64(raw: ReturnValueBytes): bigint {
  const bytes = toU8(raw);
  const len = Math.min(bytes.length, 8);
  let value = 0n;
  for (let i = 0; i < len; i++) {
    value += BigInt(bytes[i] ?? 0) << BigInt(8 * i);
  }
  return value;
}

function findReturnTuple(
  results: Array<{ returnValues?: Array<[ReturnValueBytes, string]> }> | null | undefined,
  count: number,
): bigint[] | null {
  // PTBs often include helper calls (e.g. market_key::new) before the read; use the last match.
  let found: bigint[] | null = null;
  for (const result of results ?? []) {
    const values = result.returnValues;
    if (values && values.length >= count) {
      found = values.slice(0, count).map(([bytes]) => parseU64(bytes));
    }
  }
  return found;
}

async function devInspectMarketAsk(params: {
  client: SuiJsonRpcClient;
  cfg: PredictQuoteConfig;
  key: MarketKeyArgs;
  quantity: bigint;
}): Promise<{ marketAskPerUnit: bigint; mintCost: bigint } | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addPredictMarketKey(tx, params.key, params.cfg.predictPackageId);
  // Read via DeepBook Predict directly — must use predict-package keys.
  const fn = params.key.isRange ? "get_range_trade_amounts" : "get_trade_amounts";

  tx.moveCall({
    target: `${params.cfg.predictPackageId}::predict::${fn}`,
    arguments: [
      tx.object(params.cfg.predictId),
      tx.object(params.key.oracleId),
      marketKey,
      tx.pure.u64(params.quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const tuple = findReturnTuple(inspect.results, 2);
    if (!tuple) return null;
    const [mintCost] = tuple;
    const marketAskPerUnit = premiumPerUnitFromMintCost(mintCost, params.quantity);
    return { marketAskPerUnit, mintCost };
  } catch {
    return null;
  }
}

/** Live per-contract ask at reference size (qty=1 often rounds to 0). */
export async function fetchPredictMarketAsk(params: {
  client: SuiJsonRpcClient;
  cfg: PredictQuoteConfig;
  key: MarketKeyArgs;
}): Promise<bigint | null> {
  const atRef = await devInspectMarketAsk({
    client: params.client,
    cfg: params.cfg,
    key: params.key,
    quantity: PREDICT_QUOTE_REFERENCE_QUANTITY,
  });
  // Range bands can quote below the 1¢ mint floor; still show the live ask in UI.
  if (!atRef || !isPremiumDisplayable(atRef.marketAskPerUnit)) return null;
  return atRef.marketAskPerUnit;
}

/** Find the largest quantity whose on-chain mint cost fits margin × leverage. */
export async function resolveTradeQuantity(params: {
  client: SuiJsonRpcClient;
  cfg: PredictQuoteConfig;
  key: MarketKeyArgs;
  marginQuoteAtoms: bigint;
  leverageBps: bigint;
  referencePremium: bigint;
}): Promise<Pick<MintQuote, "marketAskPerUnit" | "mintCost" | "tradeQuantity"> | null> {
  const budget = maxMintBudgetAtoms(params.marginQuoteAtoms, params.leverageBps);
  if (budget <= 0n) return null;

  let quantity = estimateQuantity(
    params.marginQuoteAtoms,
    params.leverageBps,
    params.referencePremium,
  );

  for (let attempt = 0; attempt < 12; attempt++) {
    const atQty = await devInspectMarketAsk({
      client: params.client,
      cfg: params.cfg,
      key: params.key,
      quantity,
    });
    if (!atQty) return null;
    if (classifyPredictPremium(atQty.marketAskPerUnit) !== "ok") return null;

    if (atQty.mintCost > 0n && atQty.mintCost <= budget) {
      return {
        marketAskPerUnit: atQty.marketAskPerUnit,
        mintCost: atQty.mintCost,
        tradeQuantity: quantity,
      };
    }

    if (atQty.mintCost <= 0n) {
      if (quantity <= 1n) return null;
      quantity /= 2n;
      continue;
    }

    quantity = (quantity * budget) / atQty.mintCost;
    if (quantity < 1n) return null;
  }

  return null;
}

async function fetchMintBorrowQuote(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  accountId: string;
  key: MarketKeyArgs;
  marginQuoteAtoms: bigint;
  leverageBps: bigint;
  quantity: bigint;
}): Promise<bigint | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addLeverxMarketKey(tx, params.key, params.cfg.predictPackageId);
  const fn = params.key.isRange
    ? "quote_leveraged_mint_range"
    : "quote_leveraged_mint_binary";

  tx.moveCall({
    target: `${params.cfg.packageId}::trade::${fn}`,
    typeArguments: [params.cfg.quoteType],
    arguments: [
      tx.object(params.cfg.registryId),
      tx.object(params.accountId),
      tx.object(params.cfg.predictId),
      tx.object(params.key.oracleId),
      marketKey,
      tx.pure.u64(params.marginQuoteAtoms),
      tx.pure.u64(params.leverageBps),
      tx.pure.u64(params.quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const tuple = findReturnTuple(inspect.results, 3);
    return tuple?.[2] ?? null;
  } catch {
    return null;
  }
}

export async function fetchMintQuote(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  accountId?: string | null;
  key: MarketKeyArgs;
  marginQuoteAtoms: bigint;
  leverageBps: bigint;
  /** Size quantity against this per-contract premium instead of the live ask (resting limits). */
  referencePremiumOverride?: bigint;
}): Promise<MintQuote | null> {
  const referencePremium =
    params.referencePremiumOverride != null && params.referencePremiumOverride > 0n
      ? params.referencePremiumOverride
      : await fetchPredictMarketAsk({
          client: params.client,
          cfg: params.cfg,
          key: params.key,
        });
  if (referencePremium == null || referencePremium <= 0n) return null;
  if (
    params.referencePremiumOverride == null &&
    classifyPredictPremium(referencePremium) !== "ok"
  ) {
    return null;
  }

  const resolved = await resolveTradeQuantity({
    client: params.client,
    cfg: params.cfg,
    key: params.key,
    marginQuoteAtoms: params.marginQuoteAtoms,
    leverageBps: params.leverageBps,
    referencePremium,
  });
  if (!resolved) return null;

  let borrowQuote = 0n;
  if (params.accountId && params.cfg.registryId) {
    const borrow = await fetchMintBorrowQuote({
      client: params.client,
      cfg: params.cfg,
      accountId: params.accountId,
      key: params.key,
      marginQuoteAtoms: params.marginQuoteAtoms,
      leverageBps: params.leverageBps,
      quantity: resolved.tradeQuantity,
    });
    if (borrow != null) borrowQuote = borrow;
  }

  return { ...resolved, borrowQuote };
}

/** Open contract quantity held in a Predict manager for a market key. */
export async function fetchManagerOpenQuantity(params: {
  client: SuiJsonRpcClient;
  packageId: string;
  predictPackageId: string;
  predictManagerId: string;
  key: MarketKeyArgs;
}): Promise<bigint | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addLeverxMarketKey(tx, params.key, params.predictPackageId);
  const fn = params.key.isRange ? "manager_range_position" : "manager_binary_position";

  tx.moveCall({
    target: `${params.packageId}::predict_client::${fn}`,
    arguments: [tx.object(params.predictManagerId), marketKey],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const tuple = findReturnTuple(inspect.results, 1);
    if (!tuple) return null;
    return coerceQuoteAtomsToBigInt(tuple[0]);
  } catch {
    return null;
  }
}

/** Quote balance held in a Predict manager (shared across markets on that manager). */
export async function fetchManagerQuoteBalance(params: {
  client: SuiJsonRpcClient;
  packageId: string;
  quoteType: string;
  predictManagerId: string;
}): Promise<bigint | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);

  tx.moveCall({
    target: `${params.packageId}::predict_client::manager_balance`,
    typeArguments: [params.quoteType],
    arguments: [tx.object(params.predictManagerId)],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const scalars = parseScalarResults(inspect.results);
    return scalars.at(-1) ?? 0n;
  } catch {
    return null;
  }
}

export type PositionLedgerHealthInputs = {
  borrowedQuote: bigint;
  leverageBps: bigint;
  keyQuoteBalance: bigint;
};

/** On-chain key ledger fields used for liquidation health (matches keeper dev-inspect). */
export async function fetchPositionLedgerHealthInputs(params: {
  client: SuiJsonRpcClient;
  leverxPackageId: string;
  predictPackageId: string;
  accountId: string;
  key: MarketKeyArgs;
}): Promise<PositionLedgerHealthInputs | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addLeverxMarketKey(tx, params.key, params.predictPackageId);
  const borrowedFn = params.key.isRange ? "range_borrowed_quote" : "binary_borrowed_quote";
  const leverageFn = params.key.isRange ? "range_leverage_bps" : "binary_leverage_bps";
  const balanceFn = params.key.isRange ? "range_quote_balance" : "binary_quote_balance";

  tx.moveCall({
    target: `${params.leverxPackageId}::user_proxy::${borrowedFn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });
  tx.moveCall({
    target: `${params.leverxPackageId}::user_proxy::${leverageFn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });
  tx.moveCall({
    target: `${params.leverxPackageId}::user_proxy::${balanceFn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const scalars = parseScalarResults(inspect.results);
    if (scalars.length < 3) return null;
    const borrowedQuote = scalars[scalars.length - 3]!;
    const leverageBps = scalars[scalars.length - 2]!;
    const keyQuoteBalance = scalars[scalars.length - 1]!;
    return { borrowedQuote, leverageBps, keyQuoteBalance };
  } catch {
    return null;
  }
}

/** On-chain quote balance held on a market key ledger (not in the trading account). */
export async function fetchKeyQuoteBalance(params: {
  client: SuiJsonRpcClient;
  leverxPackageId: string;
  predictPackageId: string;
  accountId: string;
  key: MarketKeyArgs;
}): Promise<bigint> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addLeverxMarketKey(tx, params.key, params.predictPackageId);
  const fn = params.key.isRange ? "range_quote_balance" : "binary_quote_balance";

  tx.moveCall({
    target: `${params.leverxPackageId}::user_proxy::${fn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return 0n;
    const tuple = findReturnTuple(inspect.results, 1);
    return tuple?.[0] ?? 0n;
  } catch {
    return 0n;
  }
}

/**
 * Withdrawable balance of the single trading account (key-agnostic).
 *
 * Custody is pooled per proxy: one spendable trading-account balance funds every position and
 * is fully withdrawable at any time (outstanding borrow is not subtracted). Positions hold only
 * locked collateral, which is not part of this balance.
 */
export async function fetchTradingQuoteBalance(params: {
  client: SuiJsonRpcClient;
  leverxPackageId: string;
  accountId: string;
}): Promise<bigint> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);

  tx.moveCall({
    target: `${params.leverxPackageId}::user_proxy::withdrawable_trading_quote`,
    arguments: [tx.object(params.accountId)],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return 0n;
    const scalars = parseScalarResults(inspect.results);
    return scalars.at(-1) ?? 0n;
  } catch {
    return 0n;
  }
}

export async function fetchRedeemQuote(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  key: MarketKeyArgs;
  quantity: bigint;
}): Promise<RedeemQuote | null> {
  const tx = new Transaction();
  tx.setSender(READONLY_SENDER);
  const marketKey = addLeverxMarketKey(tx, params.key, params.cfg.predictPackageId);
  const fn = params.key.isRange
    ? "quote_leveraged_redeem_range"
    : "quote_leveraged_redeem_binary";

  tx.moveCall({
    target: `${params.cfg.packageId}::trade::${fn}`,
    arguments: [
      tx.object(params.cfg.registryId),
      tx.object(params.cfg.predictId),
      tx.object(params.key.oracleId),
      marketKey,
      tx.pure.u64(params.quantity),
      tx.object(SUI_CLOCK_OBJECT_ID),
    ],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: READONLY_SENDER,
    });
    if (inspect.effects?.status?.status !== "success") return null;
    const tuple = findReturnTuple(inspect.results, 2);
    if (!tuple) return null;
    const [marketBidPerUnit, expectedPayout] = tuple;
    return { marketBidPerUnit, expectedPayout };
  } catch {
    return null;
  }
}

function parseScalarResults(
  results: Array<{ returnValues?: Array<[ReturnValueBytes, string]> }> | null | undefined,
): bigint[] {
  const values: bigint[] = [];
  for (const result of results ?? []) {
    const row = result.returnValues;
    if (row?.length === 1) {
      values.push(parseU64(row[0]![0]));
    }
  }
  return values;
}

/**
 * Simulate close/settle then read key borrowed + quote balance.
 * Returns withdrawable atoms when debt is cleared; otherwise 0n.
 */
export async function simulateCloseWithdrawAtoms(params: {
  client: SuiJsonRpcClient;
  cfg: LeverxProtocolConfig;
  sender: string;
  accountId: string;
  key: MarketKeyArgs;
  appendClose: (tx: Transaction) => void;
}): Promise<bigint> {
  const tx = new Transaction();
  tx.setSender(params.sender);
  params.appendClose(tx);

  const marketKey = addLeverxMarketKey(tx, params.key, params.cfg.predictPackageId);
  const borrowedFn = params.key.isRange ? "range_borrowed_quote" : "binary_borrowed_quote";
  const balanceFn = params.key.isRange ? "range_quote_balance" : "binary_quote_balance";

  tx.moveCall({
    target: `${params.cfg.packageId}::user_proxy::${borrowedFn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });
  tx.moveCall({
    target: `${params.cfg.packageId}::user_proxy::${balanceFn}`,
    arguments: [tx.object(params.accountId), marketKey],
  });

  try {
    const inspect = await params.client.devInspectTransactionBlock({
      transactionBlock: tx,
      sender: params.sender,
    });
    if (inspect.effects?.status?.status !== "success") return 0n;
    const scalars = parseScalarResults(inspect.results);
    if (scalars.length < 2) return 0n;
    const borrowed = scalars[scalars.length - 2]!;
    const balance = scalars[scalars.length - 1]!;
    if (borrowed > 0n || balance <= 0n) return 0n;
    return balance;
  } catch {
    return 0n;
  }
}
