interface TradeLogRowProps {
  timestamp: string;
  asset: string;
  action: "OPEN_LONG" | "OPEN_SHORT" | "CLOSE_LONG" | "CLOSE_SHORT";
  size: number;
  price: number;
  pnl?: number;
}

export function TradeLogRow({
  timestamp,
  asset,
  action,
  size,
  price,
  pnl,
}: TradeLogRowProps) {
  const getActionColor = () => {
    if (action.includes("LONG")) return action.includes("OPEN") ? "text-success" : "text-success/70";
    return action.includes("OPEN") ? "text-destructive" : "text-destructive/70";
  };

  const getActionLabel = () => {
    switch (action) {
      case "OPEN_LONG": return "OPEN LONG";
      case "OPEN_SHORT": return "OPEN SHORT";
      case "CLOSE_LONG": return "CLOSE LONG";
      case "CLOSE_SHORT": return "CLOSE SHORT";
    }
  };

  return (
    <div className="grid grid-cols-5 gap-2 py-2 px-3 text-xs border-b border-border last:border-0">
      {/* Time */}
      <div className="text-muted-foreground">
        {timestamp}
      </div>

      {/* Asset */}
      <div className="font-medium text-foreground">
        {asset}
      </div>

      {/* Action */}
      <div className={`${getActionColor()} font-medium`}>
        {getActionLabel()}
      </div>

      {/* Size @ Price */}
      <div className="text-muted-foreground">
        ${size.toFixed(2)} @ ${price.toLocaleString()}
      </div>

      {/* PnL (if closing) */}
      <div className={`text-right ${pnl !== undefined ? (pnl >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>
        {pnl !== undefined ? `${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}` : '—'}
      </div>
    </div>
  );
}
