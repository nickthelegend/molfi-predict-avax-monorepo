import { ExternalLink, Info } from "lucide-react";

interface MarketRulesProps {
  asset: string;
  timeframe: "hourly" | "daily";
}

export function MarketRules({ asset, timeframe }: MarketRulesProps) {
  const tvUrl = `https://www.tradingview.com/chart/?symbol=COINBASE%3A${asset}USD`;

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center gap-1.5">
        <Info className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rules</span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-relaxed">
        This market resolves based on the <span className="text-foreground font-medium">Coinbase {asset}-USD</span> spot price at the end of the current {timeframe === "hourly" ? "hour" : "day"} (UTC). If the closing price is <span className="text-emerald-500 font-medium">above</span> the baseline, <span className="text-emerald-500 font-medium">YES</span> wins. If the closing price is <span className="text-red-500 font-medium">at or below</span> the baseline, <span className="text-red-500 font-medium">NO</span> wins.{timeframe === "daily" ? <> Daily markets support up to <span className="text-foreground font-medium">5× leverage</span>.</> : ""} All prices are sourced from the Coinbase Exchange public API.
      </p>

      <a
        href={tvUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
      >
        <ExternalLink className="w-3 h-3" />
        View {asset}/USD on TradingView
      </a>
    </div>
  );
}
