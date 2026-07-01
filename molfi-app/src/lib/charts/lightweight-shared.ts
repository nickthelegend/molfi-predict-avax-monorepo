import {
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
  type DeepPartial,
  type ChartOptions,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import type { PriceLevel } from "@/lib/charts/price-level";
import { formatAssetPriceUsd } from "@/lib/leverx/format-asset-price";

export function levelLineColor(tone: PriceLevel["tone"]): string {
  switch (tone) {
    case "liquidation":
      return "#ed6d58";
    case "entry-up":
      return readCssVar("--long-text", "#38ef7d");
    case "entry-down":
      return readCssVar("--short-text", "#ef5350");
    case "entry-range":
      return readCssVar("--accent", "#298dff");
    case "strike":
      return "#eab308";
    case "current":
      return "#71d886";
    case "settlement":
      return "#298dff";
  }
}

export function levelLineStyle(tone: PriceLevel["tone"]): LineStyle {
  return tone === "liquidation" ? LineStyle.Dashed : LineStyle.Solid;
}

/** lightweight-charts only accepts hex/rgb — theme tokens may be oklch(). */
function resolveColorForChart(color: string, fallback: string): string {
  const trimmed = color.trim();
  if (!trimmed) return fallback;
  if (typeof document === "undefined") return fallback;

  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return trimmed;
  if (/^rgba?\(/i.test(trimmed)) return trimmed;

  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return fallback;
    ctx.fillStyle = trimmed;
    const resolved = ctx.fillStyle;
    if (/^#([0-9a-f]{6})$/i.test(resolved) || /^rgba?\(/i.test(resolved)) {
      return resolved;
    }
  } catch {
    /* invalid color for canvas */
  }

  return fallback;
}

export function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;

  try {
    const probe = document.createElement("span");
    probe.style.display = "none";
    probe.style.color = `var(${name})`;
    document.documentElement.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();
    return resolveColorForChart(computed, fallback);
  } catch {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return resolveColorForChart(raw, fallback);
  }
}

export function lightweightChartOptions(
  width: number,
  height: number,
  scaleMargins: { top: number; bottom: number } = { top: 0.1, bottom: 0.1 },
  ui?: { transparentBackground?: boolean },
): DeepPartial<ChartOptions> {
  const colors = chartThemeColors(ui?.transparentBackground ?? false);

  return {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: colors.background },
      textColor: colors.text,
      fontFamily: "JetBrains Mono",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: colors.gridLineColor, visible: true },
      horzLines: { color: colors.gridLineColor, visible: true },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: colors.text, labelBackgroundColor: colors.solidBackground },
      horzLine: { color: colors.text, labelBackgroundColor: colors.solidBackground },
    },
    rightPriceScale: {
      borderColor: colors.gridLineColor,
      scaleMargins,
    },
    timeScale: {
      borderColor: colors.gridLineColor,
      timeVisible: true,
      secondsVisible: false,
    },
    localization: {
      priceFormatter: (price: number) => formatAssetPriceUsd(price),
    },
  };
}

export function chartThemeColors(transparentBackground = false) {
  const solidBackground = readCssVar("--card", "#1f1f1f");
  const background = transparentBackground ? "transparent" : solidBackground;
  const text = readCssVar("--muted-foreground", "#9a9a97");
  const grid = readCssVar("--surface", "#232323");
  const gridLineColor = transparentBackground ? "rgba(127, 127, 127, 0.14)" : grid;

  return { solidBackground, background, text, grid, gridLineColor };
}

export function applyLightweightChartTheme(
  chart: IChartApi,
  options?: { transparentBackground?: boolean },
) {
  const colors = chartThemeColors(options?.transparentBackground ?? false);

  chart.applyOptions({
    layout: {
      background: { type: ColorType.Solid, color: colors.background },
      textColor: colors.text,
    },
    grid: {
      vertLines: { color: colors.gridLineColor },
      horzLines: { color: colors.gridLineColor },
    },
    crosshair: {
      vertLine: { color: colors.text, labelBackgroundColor: colors.solidBackground },
      horzLine: { color: colors.text, labelBackgroundColor: colors.solidBackground },
    },
    rightPriceScale: { borderColor: colors.gridLineColor },
    timeScale: { borderColor: colors.gridLineColor },
  });
}

export function applyCandlestickSeriesTheme(series: ISeriesApi<"Candlestick">) {
  series.applyOptions({
    upColor: candlestickUpColor(),
    downColor: candlestickDownColor(),
    wickUpColor: candlestickUpColor(),
    wickDownColor: candlestickDownColor(),
  });
}

export function applyLineSeriesWinTheme(series: ISeriesApi<"Line">) {
  series.applyOptions({ color: lineSeriesWinColor(), lineType: LineType.Curved });
}

export function applyLineSeriesMarketsSparklineTheme(series: ISeriesApi<"Line">) {
  series.applyOptions({ color: lineSeriesMarketsSparklineColor(), lineType: LineType.Curved });
}

export function applyLineSeriesAccentTheme(series: ISeriesApi<"Line">) {
  series.applyOptions({ color: lineSeriesAccentColor(), lineType: LineType.Curved });
}

export function lineSeriesAccentColor(): string {
  return readCssVar("--accent", "#298dff");
}

export function lineSeriesWinColor(): string {
  return readCssVar("--long-text", "#38ef7d");
}

/** Matches `.markets-sparkline` stroke on the markets grid. */
export function lineSeriesMarketsSparklineColor(): string {
  return readCssVar("--markets-sparkline-stroke", "#d4c5b0");
}

export function lineSeriesLossColor(): string {
  return readCssVar("--short-text", "#ef5350");
}

export function candlestickUpColor(): string {
  return readCssVar("--long-text", "#38ef7d");
}

export function candlestickDownColor(): string {
  return readCssVar("--short-text", "#ef5350");
}
