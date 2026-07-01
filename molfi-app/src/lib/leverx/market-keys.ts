import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";
import { appConfig } from "@/lib/config";
import type { PredictSide } from "@/lib/predict/instruments";

export type MarketKeyArgs = {
  oracleId: string;
  expiryMs: number;
  strike: number;
  higherStrike?: number;
  isUp: boolean;
  isRange: boolean;
};

export function marketKeyMatchesPosition(
  key: MarketKeyArgs,
  position: {
    position_key: string;
    oracle_id: string;
    expiry_ms: number;
    strike: number;
    higher_strike: number;
    is_up: boolean;
    is_range: boolean;
  },
): boolean {
  return positionKeyFromArgs(key) === position.position_key;
}

/** Canonical `position_key` / `market_key` string (matches indexer encoding). */
/** Build a market key from trade-terminal context (oracle, expiry, strike, side). */
export function marketRowToKey(row: {
  oracleId: string;
  expiry: number;
  strikeRaw: number;
  higherStrikeRaw: number;
  isUp: boolean;
  isRange: boolean;
}): MarketKeyArgs | undefined {
  if (row.expiry <= 0 || row.strikeRaw <= 0) return undefined;
  if (row.isRange && row.higherStrikeRaw <= row.strikeRaw) return undefined;
  return {
    oracleId: row.oracleId,
    expiryMs: row.expiry,
    strike: row.strikeRaw,
    higherStrike: row.isRange ? row.higherStrikeRaw : 0,
    isUp: row.isUp,
    isRange: row.isRange,
  };
}

export function tradeSideToMarketKey(args: {
  oracleId: string;
  expiryMs: number;
  strike: number;
  higherStrike?: number;
  side: PredictSide;
}): MarketKeyArgs | undefined {
  if (args.expiryMs <= 0 || args.strike <= 0) return undefined;
  const isRange = args.side === "range";
  const higherStrike = args.higherStrike ?? 0;
  if (isRange && higherStrike <= args.strike) return undefined;
  return {
    oracleId: args.oracleId,
    expiryMs: args.expiryMs,
    strike: args.strike,
    higherStrike: isRange ? higherStrike : 0,
    isUp: isRange ? true : args.side === "up",
    isRange,
  };
}

export function positionKeyFromArgs(args: MarketKeyArgs): string {
  const higherStrike = args.isRange ? (args.higherStrike ?? 0) : 0;
  const isUp = args.isRange ? true : args.isUp;
  return `${args.oracleId}:${args.expiryMs}:${args.strike}:${higherStrike}:${isUp ? 1 : 0}:${args.isRange ? 1 : 0}`;
}

function buildMarketKey(
  tx: Transaction,
  args: MarketKeyArgs,
  packageId: string,
): TransactionObjectArgument {
  if (args.isRange) {
    return tx.moveCall({
      target: `${packageId}::range_key::new`,
      arguments: [
        tx.pure.id(args.oracleId),
        tx.pure.u64(args.expiryMs),
        tx.pure.u64(args.strike),
        tx.pure.u64(args.higherStrike ?? 0),
      ],
    })[0]!;
  }

  const fn = args.isUp ? "up" : "down";
  return tx.moveCall({
    target: `${packageId}::market_key::${fn}`,
    arguments: [
      tx.pure.id(args.oracleId),
      tx.pure.u64(args.expiryMs),
      tx.pure.u64(args.strike),
    ],
  })[0]!;
}

/** Keys for DeepBook Predict and LeverX PTBs — always use the published `deepbook_predict` package. */
export function addPredictMarketKey(
  tx: Transaction,
  args: MarketKeyArgs,
  predictPackageId: string = appConfig.predictPackageId,
): TransactionObjectArgument {
  return buildMarketKey(tx, args, predictPackageId);
}

/** @alias addPredictMarketKey */
export function addLeverxMarketKey(
  tx: Transaction,
  args: MarketKeyArgs,
  predictPackageId: string = appConfig.predictPackageId,
): TransactionObjectArgument {
  return addPredictMarketKey(tx, args, predictPackageId);
}

/** @alias addPredictMarketKey */
export function addMarketKey(
  tx: Transaction,
  args: MarketKeyArgs,
  predictPackageId: string = appConfig.predictPackageId,
): TransactionObjectArgument {
  return addPredictMarketKey(tx, args, predictPackageId);
}
