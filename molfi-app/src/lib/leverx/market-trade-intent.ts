import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import {
  coercePredictSide,
  predictSideFromBinary,
  type PredictSide,
} from "@/lib/predict/instruments";

export type MarketTradeIntent = {
  oracleId: string;
  side?: PredictSide;
  strike?: number;
  lower?: number;
  upper?: number;
};

export function marketTradeIntent(
  row: LeverxMarketRow,
  side?: PredictSide,
): MarketTradeIntent {
  const resolvedSide = coercePredictSide(
    side ?? predictSideFromBinary({ isUp: row.isUp, isRange: row.isRange }),
  );

  if (resolvedSide === "range") {
    const intent: MarketTradeIntent = { oracleId: row.oracleId, side: "range" };
    if (row.strikeRaw > 0) intent.lower = row.strikeRaw;
    if (row.higherStrikeRaw > row.strikeRaw) intent.upper = row.higherStrikeRaw;
    return intent;
  }

  const intent: MarketTradeIntent = { oracleId: row.oracleId, side: resolvedSide };
  if (row.strikeRaw > 0) intent.strike = row.strikeRaw;
  return intent;
}

export function positionTradeIntent(position: {
  oracle_id: string;
  strike: number;
  higher_strike: number;
  is_up: boolean;
  is_range: boolean;
}): MarketTradeIntent {
  const side = predictSideFromBinary({
    isUp: position.is_up,
    isRange: position.is_range,
  });

  if (side === "range") {
    const intent: MarketTradeIntent = { oracleId: position.oracle_id, side: "range" };
    if (position.strike > 0) intent.lower = position.strike;
    if (position.higher_strike > position.strike) intent.upper = position.higher_strike;
    return intent;
  }

  const intent: MarketTradeIntent = { oracleId: position.oracle_id, side };
  if (position.strike > 0) intent.strike = position.strike;
  return intent;
}
