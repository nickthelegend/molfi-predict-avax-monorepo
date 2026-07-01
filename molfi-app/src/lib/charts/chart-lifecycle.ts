import type { IChartApi } from "lightweight-charts";

const DISPOSED_RE = /disposed/i;

export function isChartDisposedError(error: unknown): boolean {
  return error instanceof Error && DISPOSED_RE.test(error.message);
}

/** Resize only when the container has a real layout box; swallows disposed-chart errors. */
export function safeResizeChart(chart: IChartApi, el: HTMLElement): boolean {
  const width = el.clientWidth;
  const height = el.clientHeight;
  if (width < 2 || height < 2) return false;
  try {
    chart.resize(width, height);
    return true;
  } catch (error) {
    if (isChartDisposedError(error)) return false;
    throw error;
  }
}

/** Remove a chart without throwing if it was already disposed. */
export function safeRemoveChart(chart: IChartApi | null | undefined): void {
  if (!chart) return;
  try {
    chart.remove();
  } catch (error) {
    if (!isChartDisposedError(error)) throw error;
  }
}
