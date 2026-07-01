const DAY_MS = 24 * 60 * 60 * 1000;

/** Downsample to at most `maxPoints` values, preserving endpoints. */
export function downsampleSeries(values: readonly number[], maxPoints = 32): number[] {
  if (values.length <= maxPoints) return [...values];
  if (maxPoints < 2) return [values[values.length - 1] ?? 0];

  const out: number[] = [];
  const lastIndex = values.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i / (maxPoints - 1)) * lastIndex);
    out.push(values[idx]!);
  }
  return out;
}

export function changePercentOverWindow(
  values: readonly number[],
  timestamps: readonly number[],
  nowMs = Date.now(),
): number {
  if (values.length < 2 || timestamps.length !== values.length) return 0;

  const latest = values[values.length - 1] ?? 0;
  const cutoff = nowMs - DAY_MS;
  let ref = values[0] ?? latest;

  for (let i = 0; i < values.length; i++) {
    if ((timestamps[i] ?? 0) <= cutoff) {
      ref = values[i] ?? ref;
    }
  }

  if (ref <= 0) return 0;
  return ((latest - ref) / ref) * 100;
}

export function changePercentEndpoints(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  if (first <= 0) return 0;
  return ((last - first) / first) * 100;
}

/** Map a numeric series into SVG point coordinates within a view box. */
function seriesToPoints(
  values: readonly number[],
  viewWidth: number,
  viewHeight: number,
  padding = 1,
): { x: number; y: number }[] {
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return [];

  const innerW = Math.max(1, viewWidth - padding * 2);
  const innerH = Math.max(1, viewHeight - padding * 2);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const range = max - min || 1;

  if (finite.length === 1) {
    const y = padding + innerH / 2;
    return [
      { x: padding, y },
      { x: padding + innerW, y },
    ];
  }

  return finite.map((value, index) => ({
    x: padding + (index / (finite.length - 1)) * innerW,
    y: padding + innerH - ((value - min) / range) * innerH,
  }));
}

/** Catmull-Rom spline converted to cubic Bézier SVG path commands. */
export function pointsToSmoothPath(points: readonly { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0]!.x},${points[0]!.y}`;
  if (points.length === 2) {
    return `M ${points[0]!.x},${points[0]!.y} L ${points[1]!.x},${points[1]!.y}`;
  }

  let path = `M ${points[0]!.x},${points[0]!.y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(i + 2, points.length - 1)]!;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

/** Map a numeric series into a smooth SVG path within a view box. */
export function seriesToSmoothPath(
  values: readonly number[],
  viewWidth: number,
  viewHeight: number,
  padding = 1,
): string {
  const points = seriesToPoints(values, viewWidth, viewHeight, padding);
  return pointsToSmoothPath(points);
}

/** Map a numeric series into SVG polyline points within a view box. */
export function seriesToPolylinePoints(
  values: readonly number[],
  viewWidth: number,
  viewHeight: number,
  padding = 1,
): string {
  const points = seriesToPoints(values, viewWidth, viewHeight, padding);
  if (points.length === 0) return "";
  return points.map(({ x, y }) => `${x},${y}`).join(" ");
}

/** Closed area path under the sparkline for gradient fills. */
export function seriesToAreaPath(
  values: readonly number[],
  viewWidth: number,
  viewHeight: number,
  padding = 1,
): string {
  const points = seriesToPoints(values, viewWidth, viewHeight, padding);
  if (points.length === 0) return "";

  const bottom = viewHeight - padding;
  const line = pointsToSmoothPath(points);
  const last = points[points.length - 1]!;
  const first = points[0]!;

  return `${line} L ${last.x},${bottom} L ${first.x},${bottom} Z`;
}
