import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldAlert, Target } from "lucide-react";

interface StopLossTakeProfitProps {
  entryPrice: number;
  leverage: number;
  side: "yes" | "no";
  liquidationPrice: number | null;
  onValuesChange: (values: { stopLoss: string; takeProfit: string }) => void;
}

const SL_PRESETS = [-5, -10, -20] as const;
const TP_PRESETS = [10, 20, 50] as const;

export function StopLossTakeProfit({ entryPrice, leverage, side, liquidationPrice, onValuesChange }: StopLossTakeProfitProps) {
  const [enabled, setEnabled] = useState(false);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      setStopLoss("");
      setTakeProfit("");
      onValuesChange({ stopLoss: "", takeProfit: "" });
    }
  };

  const handleSL = (v: string) => {
    setStopLoss(v);
    onValuesChange({ stopLoss: v, takeProfit });
  };

  const handleTP = (v: string) => {
    setTakeProfit(v);
    onValuesChange({ stopLoss, takeProfit: v });
  };

  const applySLPreset = (pct: number) => {
    const delta = (pct / 100) * entryPrice;
    const val = side === "yes" ? entryPrice + delta : entryPrice - delta;
    handleSL(Math.max(0, Math.min(100, val)).toFixed(1));
  };

  const applyTPPreset = (pct: number) => {
    const delta = (pct / 100) * entryPrice;
    const val = side === "yes" ? entryPrice + delta : entryPrice - delta;
    handleTP(Math.max(0, Math.min(100, val)).toFixed(1));
  };

  const slNum = Number(stopLoss);
  const slError = stopLoss && slNum > 0 && liquidationPrice !== null
    ? (side === "yes" ? slNum <= liquidationPrice : slNum >= liquidationPrice)
      ? "Below liquidation price"
      : null
    : null;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox checked={enabled} onCheckedChange={(v) => handleToggle(v === true)} className="h-3.5 w-3.5" />
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Target className="w-2.5 h-2.5" /> Stop-Loss / Take-Profit
        </span>
      </label>

      {enabled && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[9px] text-destructive flex items-center gap-0.5">
              <ShieldAlert className="w-2.5 h-2.5" /> Stop-Loss (¢)
            </Label>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => handleSL(e.target.value)}
              className={cn("h-7 text-[11px]", slError && "border-destructive")}
              placeholder={liquidationPrice ? (liquidationPrice + (side === "yes" ? 5 : -5)).toFixed(0) : "—"}
              min={0}
              max={100}
            />
            <div className="flex gap-0.5">
              {SL_PRESETS.map((pct) => (
                <Button key={pct} variant="outline" size="sm" className="h-4 text-[8px] flex-1 px-0" onClick={() => applySLPreset(pct)}>
                  {pct}%
                </Button>
              ))}
            </div>
            {slError && <p className="text-[8px] text-destructive">{slError}</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] text-emerald-500 flex items-center gap-0.5">
              <Target className="w-2.5 h-2.5" /> Take-Profit (¢)
            </Label>
            <Input
              type="number"
              value={takeProfit}
              onChange={(e) => handleTP(e.target.value)}
              className="h-7 text-[11px]"
              placeholder={side === "yes" ? "95" : "5"}
              min={0}
              max={100}
            />
            <div className="flex gap-0.5">
              {TP_PRESETS.map((pct) => (
                <Button key={pct} variant="outline" size="sm" className="h-4 text-[8px] flex-1 px-0" onClick={() => applyTPPreset(pct)}>
                  +{pct}%
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
