import type { ReactNode } from "react";
import { MarketTradeLink } from "@/components/leverx/MarketTradeLink";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import type { PredictSide } from "@/lib/predict/instruments";
import { isRangeTradingEnabled } from "@/lib/predict/instruments";
import {
  marketSideAction,
  marketSideActionDown,
  marketSideActionRange,
  marketSideActionUp,
  marketSideActions,
  marketSideActionsPlain,
  marketSideActionsStretch,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  market: LeverxMarketRow;
  className?: string;
  stretch?: boolean;
  plain?: boolean;
  hideRangeOnMobile?: boolean;
}

function SideLink({
  market,
  side,
  className,
  children,
}: {
  market: LeverxMarketRow;
  side: PredictSide;
  className?: string;
  children: ReactNode;
}) {
  return (
    <MarketTradeLink market={market} side={side} className={className}>
      {children}
    </MarketTradeLink>
  );
}

export function MarketSideActions({
  market,
  className,
  stretch = false,
  plain = false,
  hideRangeOnMobile = false,
}: Props) {
  return (
    <div
      className={cn(
        plain ? marketSideActionsPlain : marketSideActions,
        stretch && marketSideActionsStretch,
        className,
      )}
      role="group"
      aria-label="Trade side"
    >
      <SideLink
        market={market}
        side="up"
        className={cn(marketSideAction, marketSideActionUp)}
      >
        <PredictSideLabel side="up" />
      </SideLink>
      <SideLink
        market={market}
        side="down"
        className={cn(marketSideAction, marketSideActionDown)}
      >
        <PredictSideLabel side="down" />
      </SideLink>
      {isRangeTradingEnabled() ? (
        <SideLink
          market={market}
          side="range"
          className={cn(
            marketSideAction,
            marketSideActionRange,
            hideRangeOnMobile && "hidden sm:inline-flex",
          )}
        >
          <PredictSideLabel side="range" />
        </SideLink>
      ) : null}
    </div>
  );
}
