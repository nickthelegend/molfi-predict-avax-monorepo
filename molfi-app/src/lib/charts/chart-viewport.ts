import type { IChartApi, LogicalRange } from "lightweight-charts";
import { applyPredictChartViewport } from "@/lib/charts/predict-chart-view";

const TIME_SCALE_ZOOM_FACTOR = 0.75;

export type SavedChartViewport = {
  logicalRange: LogicalRange | null;
  autoScale: boolean;
};

/** Tracks user pan/zoom so live data updates can avoid fitContent(). */
export function createChartViewportGuard(chart: IChartApi) {
  let preserve = false;
  let applying = false;

  const onVisibleLogicalRangeChange = () => {
    if (applying) return;
    preserve = true;
  };

  chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);

  return {
    shouldPreserve: () => preserve,
    reset: () => {
      preserve = false;
    },
    save: (): SavedChartViewport => ({
      logicalRange: chart.timeScale().getVisibleLogicalRange() ?? null,
      autoScale: chart.priceScale("right").options().autoScale ?? true,
    }),
    restore: (saved: SavedChartViewport) => {
      if (!saved.logicalRange) return;
      applying = true;
      chart.timeScale().setVisibleLogicalRange(saved.logicalRange);
      chart.priceScale("right").applyOptions({ autoScale: saved.autoScale });
      applying = false;
    },
    applyProgrammatic: (fn: () => void) => {
      applying = true;
      try {
        fn();
      } finally {
        applying = false;
      }
    },
    destroy: () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
    },
  };
}

/** True when the viewport is pinned to the live edge (follow mode). */
export function isChartNearRightEdge(
  chart: IChartApi,
  dataLength: number,
  thresholdBars = 4,
): boolean {
  if (dataLength < 2) return true;
  const range = chart.timeScale().getVisibleLogicalRange();
  if (!range) return true;
  return range.to >= dataLength - thresholdBars;
}

/** Nudge the time scale so new bars stay visible without fitContent(). */
export function followChartRightEdge(chart: IChartApi, addedBars: number): void {
  if (addedBars <= 0) return;
  const range = chart.timeScale().getVisibleLogicalRange();
  if (!range) return;
  chart.timeScale().setVisibleLogicalRange({
    from: range.from + addedBars,
    to: range.to + addedBars,
  });
}

/** Zoom the visible time range in or out around its center. */
export function zoomChartTimeScale(chart: IChartApi, direction: "in" | "out"): void {
  const timeScale = chart.timeScale();
  const range = timeScale.getVisibleLogicalRange();
  if (!range) return;

  const center = (range.from + range.to) / 2;
  const halfSpan = (range.to - range.from) / 2;
  const factor = direction === "in" ? TIME_SCALE_ZOOM_FACTOR : 1 / TIME_SCALE_ZOOM_FACTOR;
  const nextHalfSpan = Math.max(halfSpan * factor, 0.5);

  timeScale.setVisibleLogicalRange({
    from: center - nextHalfSpan,
    to: center + nextHalfSpan,
  });
}

/** Fit the full series and re-enable vertical autoscale. */
export function resetChartViewport(
  chart: IChartApi,
  dataLength: number,
  mode: "line" | "candlestick",
  viewportGuard?: Pick<ReturnType<typeof createChartViewportGuard>, "reset" | "applyProgrammatic"> | null,
): void {
  viewportGuard?.reset();
  viewportGuard?.applyProgrammatic(() => {
    applyPredictChartViewport(chart, dataLength, mode);
    chart.priceScale("right").applyOptions({ autoScale: true });
  });
}
