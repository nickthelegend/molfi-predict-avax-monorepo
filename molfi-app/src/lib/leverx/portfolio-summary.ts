import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import {
  positionRowId,
  type PositionMarkToMarket,
} from "@/lib/leverx/position-metrics";
import { scaleQuote } from "@/lib/predict/scaling";

export type PortfolioSummary = {
  positionCount: number;
  marginTotalUsd: number;
  borrowedTotalUsd: number;
  notionalUsd: number;
  unrealizedPnlUsd: number;
  netEquityUsd: number;
  liveMarkCount: number;
  atRiskCount: number;
};

export function aggregatePortfolioSummary(
  positions: readonly LeveragedPosition[],
  markToMarket: Map<string, PositionMarkToMarket>,
): PortfolioSummary {
  let marginTotalUsd = 0;
  let borrowedTotalUsd = 0;
  let unrealizedPnlUsd = 0;
  let netEquityUsd = 0;
  let liveMarkCount = 0;
  let atRiskCount = 0;

  for (const position of positions) {
    const marginUsd = scaleQuote(position.margin_quote);
    const borrowedUsd = scaleQuote(position.borrow_quote);
    marginTotalUsd += marginUsd;
    borrowedTotalUsd += borrowedUsd;

    const mtm = markToMarket.get(positionRowId(position));
    if (mtm?.isLive) {
      unrealizedPnlUsd += mtm.unrealizedPnlUsd;
      netEquityUsd += mtm.netEquityUsd;
      liveMarkCount += 1;
      if (mtm.healthLabel === "margin_call" || mtm.healthLabel === "at_risk") {
        atRiskCount += 1;
      }
    }
  }

  return {
    positionCount: positions.length,
    marginTotalUsd,
    borrowedTotalUsd,
    notionalUsd: marginTotalUsd + borrowedTotalUsd,
    unrealizedPnlUsd,
    netEquityUsd,
    liveMarkCount,
    atRiskCount,
  };
}
