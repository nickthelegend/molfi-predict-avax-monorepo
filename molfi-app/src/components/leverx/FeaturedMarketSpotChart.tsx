import { useId, useMemo } from "react";
import { LoadingState } from "@/components/ui/loading-state";
import {
  useChartPriceSeries,
  type ChartPriceSeriesResult,
} from "@/hooks/useChartPriceSeries";
import { formatAssetPriceUsd } from "@/lib/leverx/format-asset-price";
import type { PricePoint } from "@/lib/predict/price-point";
import type { PredictOracleSummary } from "@/lib/predict/types";
import { pointsToSmoothPath } from "@/lib/charts/sparkline-path";
import { cn } from "@/lib/utils";

type OracleChartRow = Pick<
  PredictOracleSummary,
  "oracle_id" | "status" | "expiry" | "settled_at"
>;

interface Props {
  oracleId: string;
  asset: string;
  strikeUsd: number;
  oracleRow?: OracleChartRow | null;
  className?: string;
}

const FEATURED_CHART_MAX_POINTS = 10;

function chartSeriesToPricePoints(series: ChartPriceSeriesResult): PricePoint[] {
  let points: PricePoint[];
  if (series.mode === "candlestick" && series.candles.length > 0) {
    points = series.candles.map((bar) => ({
      t: (bar.time as number) * 1000,
      price: bar.close,
    }));
  } else {
    points = series.linePoints;
  }
  return points.length > FEATURED_CHART_MAX_POINTS
    ? points.slice(-FEATURED_CHART_MAX_POINTS)
    : points;
}

const VIEW_W = 320;
const VIEW_H = 140;
const PAD = { top: 10, right: 54, bottom: 22, left: 6 };

function chartDomain(points: PricePoint[], strikeUsd: number) {
  const prices = points.map((p) => p.price);
  if (strikeUsd > 0) prices.push(strikeUsd);
  if (prices.length === 0) return { min: 0, max: 1 };

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = Math.max(max - min, max * 0.0004, 1);
  const pad = span * 0.18;
  return { min: min - pad, max: max + pad };
}

function toPath(points: PricePoint[], domain: { min: number; max: number }) {
  const innerW = VIEW_W - PAD.left - PAD.right;
  const innerH = VIEW_H - PAD.top - PAD.bottom;
  const span = domain.max - domain.min || 1;

  const coords = points.map((point, index) => {
    const x =
      PAD.left +
      (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = PAD.top + (1 - (point.price - domain.min) / span) * innerH;
    return { x, y };
  });

  if (coords.length === 0) return { line: "", area: "" };

  const line = pointsToSmoothPath(coords);
  const first = coords[0]!;
  const last = coords[coords.length - 1]!;
  const area = `${line} L${last.x},${VIEW_H - PAD.bottom} L${first.x},${VIEW_H - PAD.bottom} Z`;
  return { line, area };
}

function yAxisLabels(domain: { min: number; max: number }) {
  const mid = (domain.min + domain.max) / 2;
  return [domain.max, mid, domain.min];
}

function formatAxisTime(t: number): string {
  return new Date(t).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function FeaturedMarketSpotChart({
  oracleId,
  asset,
  strikeUsd,
  oracleRow,
  className,
}: Props) {
  const rawGradientId = useId();
  const fillId = `featured-chart-fill-${rawGradientId.replace(/:/g, "")}`;
  const chartSeries = useChartPriceSeries(oracleId, asset, { oracleRow });
  const points = useMemo(() => chartSeriesToPricePoints(chartSeries), [chartSeries]);
  const isLoading = chartSeries.isLoading;

  const domain = useMemo(() => chartDomain(points, strikeUsd), [points, strikeUsd]);
  const paths = useMemo(() => toPath(points, domain), [points, domain]);
  const labels = useMemo(() => yAxisLabels(domain), [domain]);

  const strikeY = useMemo(() => {
    if (strikeUsd <= 0) return null;
    const innerH = VIEW_H - PAD.top - PAD.bottom;
    const span = domain.max - domain.min || 1;
    return PAD.top + (1 - (strikeUsd - domain.min) / span) * innerH;
  }, [strikeUsd, domain]);

  const startLabel = points[0] ? formatAxisTime(points[0].t) : null;
  const endLabel = points.length > 1 ? formatAxisTime(points[points.length - 1]!.t) : null;

  return (
    <div className={cn("featured-market-chart", className)}>
      {isLoading && points.length === 0 ? (
        <div className="featured-market-chart-loading">
          <LoadingState label="Loading chart…" compact />
        </div>
      ) : (
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="featured-market-chart-svg"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--markets-sparkline-stroke, #d4c5b0)"
                stopOpacity="0.35"
              />
              <stop
                offset="100%"
                stopColor="var(--markets-sparkline-stroke, #d4c5b0)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {labels.map((price) => {
            const innerH = VIEW_H - PAD.top - PAD.bottom;
            const span = domain.max - domain.min || 1;
            const y = PAD.top + (1 - (price - domain.min) / span) * innerH;
            return (
              <text
                key={price}
                x={VIEW_W - 4}
                y={y + 3}
                textAnchor="end"
                className="featured-market-chart-axis"
              >
                {formatAssetPriceUsd(price)}
              </text>
            );
          })}

          {strikeY != null ? (
            <>
              <line
                x1={PAD.left}
                x2={VIEW_W - PAD.right}
                y1={strikeY}
                y2={strikeY}
                className="featured-market-chart-target-line"
              />
              <text
                x={VIEW_W - PAD.right - 4}
                y={strikeY - 5}
                textAnchor="end"
                className="featured-market-chart-target-label"
              >
                Target
              </text>
            </>
          ) : null}

          {paths.area ? <path d={paths.area} fill={`url(#${fillId})`} /> : null}
          {paths.line ? <path d={paths.line} className="featured-market-chart-line" /> : null}

          {startLabel ? (
            <text x={PAD.left} y={VIEW_H - 6} className="featured-market-chart-time">
              {startLabel}
            </text>
          ) : null}
          {endLabel ? (
            <text x={VIEW_W - PAD.right} y={VIEW_H - 6} textAnchor="end" className="featured-market-chart-time">
              {endLabel}
            </text>
          ) : null}
        </svg>
      )}

      <div className="featured-market-chart-live" aria-hidden>
        <span className="featured-market-chart-live-dot" />
        LIVE
      </div>
    </div>
  );
}
