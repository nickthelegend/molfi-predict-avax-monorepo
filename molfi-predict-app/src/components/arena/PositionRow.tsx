interface PositionRowProps {
  asset: string;
  side: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export function PositionRow({
  asset,
  side,
  size,
  entryPrice,
  currentPrice,
  pnl,
  pnlPercent,
}: PositionRowProps) {
  const isProfitable = pnl >= 0;

  return (
    <div className="grid grid-cols-6 gap-2 py-2 px-3 text-xs border-b border-border last:border-0">
      {/* Asset */}
      <div className="font-medium text-foreground">
        {asset}
      </div>

      {/* Side */}
      <div className={side === "LONG" ? "text-success" : "text-destructive"}>
        {side}
      </div>

      {/* Size */}
      <div className="text-muted-foreground">
        ${size.toFixed(2)}
      </div>

      {/* Entry */}
      <div className="text-muted-foreground">
        ${entryPrice.toLocaleString()}
      </div>

      {/* Current */}
      <div className="text-foreground">
        ${currentPrice.toLocaleString()}
      </div>

      {/* PnL */}
      <div className={`text-right font-medium ${isProfitable ? 'text-success' : 'text-destructive'}`}>
        {isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%
      </div>
    </div>
  );
}
