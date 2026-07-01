import { MARKET_TITLES } from "@/lib/leverx/indexer-markets";
import type { PredictSide } from "@/lib/predict/instruments";
import { cn } from "@/lib/utils";

type Props = {
  /** Defaults to up — catalog and trade pages always show "Bitcoin Up". */
  side?: PredictSide;
  /** Explicit market question (Stellar markets); falls back to the static title. */
  title?: string;
  className?: string;
};

export function MarketTitle({ side = "up", title, className }: Props) {
  return <span className={cn(className)}>{title ?? MARKET_TITLES[side]}</span>;
}
