import { useOHLC } from "@/hooks/useOHLC";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "./LoadingSpinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useState } from "react";
import { Button } from "./ui/button";

interface MarketChartProps {
  marketId: string;
  height?: number;
}

export function MarketChart({ marketId, height = 400 }: MarketChartProps) {
  const [timeframe, setTimeframe] = useState<"1h" | "4h" | "1d" | "1w">("1h");
  const { data, isLoading } = useOHLC(marketId, timeframe);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm" style={{ height }}>
        <div className="text-center">
          <p className="font-medium mb-1">No chart data available</p>
          <p className="text-xs">Price history will appear once trades are recorded.</p>
        </div>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: d.close,
    high: d.high,
    low: d.low,
  }));

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["1h", "4h", "1d", "1w"] as const).map((tf) => (
          <Button
            key={tf}
            variant={timeframe === tf ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe(tf)}
          >
            {tf}
          </Button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis
            dataKey="time"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickLine={false}
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}¢`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}¢`, "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            fillOpacity={1}
            fill="url(#colorPrice)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
