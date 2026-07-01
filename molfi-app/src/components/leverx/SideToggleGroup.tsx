import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import {
  sideToggleClass,
  TRADE_PREDICT_SIDES,
  type PredictSide,
} from "@/lib/predict/instruments";
import { segTab, segTabsClass } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  value: PredictSide;
  onValueChange: (value: PredictSide) => void;
  className?: string;
  /** LONG/SHORT only (no RANGE). */
  dual?: boolean;
}

export function SideToggleGroup({ value, onValueChange, className, dual }: Props) {
  const sides = dual ? (["up", "down"] as const) : TRADE_PREDICT_SIDES;

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as PredictSide)}
      className={cn(segTabsClass("stretch"), className)}
    >
      {sides.map((side) => (
        <ToggleGroupItem
          key={side}
          value={side}
          className={cn(
            segTab,
            "h-auto min-h-0 rounded-none border-0 bg-transparent shadow-none",
            value === side ? sideToggleClass(side, true) : "text-muted-foreground",
          )}
        >
          <PredictSideLabel
            side={side}
            variant={dual && (side === "up" || side === "down") ? "trade" : "outcome"}
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
