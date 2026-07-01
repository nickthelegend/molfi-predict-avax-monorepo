import { useEffect, useRef } from "react";
import {
  createChart,
  BaselineSeries,
  ColorType,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";

export interface PnlPoint {
  ts: number;
  value: number;
}

/**
 * Cumulative P&L curve — a baseline series anchored at 0 so green = in profit,
 * red = underwater. Built only from the signed-in trader's own settled trades;
 * no other trader's positions are ever plotted.
 */
export function PnlChart({ points, height = 220 }: { points: PnlPoint[]; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length === 0) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9a9a97",
        fontFamily: "Barlow, sans-serif",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      handleScale: false,
      handleScroll: false,
    });

    const series = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: 0 },
      topLineColor: "#38ef7d",
      topFillColor1: "rgba(56,239,125,0.28)",
      topFillColor2: "rgba(56,239,125,0.03)",
      bottomLineColor: "#ef5350",
      bottomFillColor1: "rgba(239,83,80,0.03)",
      bottomFillColor2: "rgba(239,83,80,0.28)",
      lineWidth: 2,
      priceLineVisible: false,
    });

    const seen = new Set<number>();
    const data: { time: UTCTimestamp; value: number }[] = [];
    for (const p of points) {
      let t = Math.floor(p.ts / 1000);
      while (seen.has(t)) t += 1; // keep strictly-ascending times for same-second trades
      seen.add(t);
      data.push({ time: t as UTCTimestamp, value: p.value });
    }
    series.setData(data);

    series.createPriceLine({
      price: 0,
      color: "#ababab",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "breakeven",
    });

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [points]);

  return <div ref={ref} style={{ height }} className="w-full" />;
}
