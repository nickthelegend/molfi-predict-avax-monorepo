import { useEffect, useRef } from "react";
import {
  createChart,
  AreaSeries,
  BaselineSeries,
  ColorType,
  LineStyle,
  type UTCTimestamp,
} from "lightweight-charts";
import type { PricePoint } from "@/lib/molfi-backend";

/**
 * Live spot chart. When a `strike` is given it renders a BASELINE series —
 * green above the strike, red below — with a dashed strike line, so you can
 * see at a glance whether the market is winning YES or NO.
 */
export function LivePriceChart({
  points,
  strike,
  height = 260,
}: {
  points: PricePoint[];
  strike?: number;
  height?: number;
}) {
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

    const hasStrike = strike != null && strike > 0;
    const series = hasStrike
      ? chart.addSeries(BaselineSeries, {
          baseValue: { type: "price", price: strike },
          topLineColor: "#38ef7d",
          topFillColor1: "rgba(56,239,125,0.28)",
          topFillColor2: "rgba(56,239,125,0.03)",
          bottomLineColor: "#ef5350",
          bottomFillColor1: "rgba(239,83,80,0.03)",
          bottomFillColor2: "rgba(239,83,80,0.28)",
          lineWidth: 2,
          priceLineVisible: false,
        })
      : chart.addSeries(AreaSeries, {
          lineColor: "#c899ff",
          lineWidth: 2,
          topColor: "rgba(200,153,255,0.25)",
          bottomColor: "rgba(200,153,255,0.02)",
          priceLineVisible: false,
        });

    const seen = new Set<number>();
    const data: { time: UTCTimestamp; value: number }[] = [];
    for (const p of points) {
      const t = Math.floor(p.ts / 1000);
      if (seen.has(t)) continue;
      seen.add(t);
      data.push({ time: t as UTCTimestamp, value: p.price });
    }
    series.setData(data);

    if (hasStrike) {
      series.createPriceLine({
        price: strike,
        color: "#ababab",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: "strike",
      });
    }

    chart.timeScale().fitContent();
    return () => chart.remove();
  }, [points, strike]);

  return <div ref={ref} style={{ height }} className="w-full" />;
}
