import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  LineSeries,
  LineType,
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type UTCTimestamp,
} from "lightweight-charts";
import { LineChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartToolbar } from "@/components/charts/ChartToolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ui } from "@/lib/copy";
import {
  buildStrikeChartLevels,
  type StrikeChartLevelInput,
} from "@/lib/charts/predict-chart-levels";
import type { PriceLevel } from "@/lib/charts/price-level";
import {
  applyCandlestickSeriesTheme,
  applyLightweightChartTheme,
  applyLineSeriesMarketsSparklineTheme,
  candlestickDownColor,
  candlestickUpColor,
  levelLineColor,
  levelLineStyle,
  lineSeriesMarketsSparklineColor,
  lightweightChartOptions,
} from "@/lib/charts/lightweight-shared";
import { buildStrikeAnchoredSpotLineData } from "@/lib/charts/line-data";
import { safeRemoveChart, safeResizeChart } from "@/lib/charts/chart-lifecycle";
import {
  createChartViewportGuard,
  followChartRightEdge,
  isChartNearRightEdge,
  resetChartViewport,
  zoomChartTimeScale,
  type SavedChartViewport,
} from "@/lib/charts/chart-viewport";
import {
  applyPredictChartViewport,
  buildCandleAutoscaleInfo,
  buildPredictAutoscaleInfo,
  PREDICT_CHART_SCALE_MARGINS,
} from "@/lib/charts/predict-chart-view";
import {
  CHART_OHLCV_INTERVAL,
  deepbookPairForAsset,
  ohlcvIntervalMs,
  type OhlcvInterval,
} from "@/lib/deepbook/ohlcv";
import {
  useChartPriceSeries,
  type ChartDisplayMode,
  type ChartPriceSeriesResult,
} from "@/hooks/useChartPriceSeries";
import type { PredictSide } from "@/lib/predict/instruments";
import { BtcTweetMarquee } from "@/components/leverx/BtcTweetMarquee";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { tradeSurface } from "@/lib/leverx/tw";

interface Props {
  asset: string;
  pair?: string;
  oracleId: string;
  /** When provided, skips internal chart data hook (share one series per page). */
  chartSeries?: ChartPriceSeriesResult;
  /** Scaled strike for UP/DOWN (fallback when `strikeLevels` omitted). */
  strikePrice?: number;
  activeSide?: PredictSide;
  /** Scaled range bounds for RANGE. */
  rangeLower?: number;
  rangeUpper?: number;
  /** When set (e.g. open positions), overrides market strike guides. */
  strikeLevels?: PriceLevel[];
  height?: number;
  /** When false (e.g. mobile tab hidden), skip resize until visible again */
  layoutActive?: boolean;
  className?: string;
  interval?: OhlcvInterval;
  onIntervalChange?: (interval: OhlcvInterval) => void;
  displayMode?: ChartDisplayMode;
  onDisplayModeChange?: (mode: ChartDisplayMode) => void;
}

const INITIAL_SIZE_RAF_ATTEMPTS = 60;

export function PriceChart({
  asset,
  pair,
  oracleId,
  chartSeries: chartSeriesProp,
  strikePrice,
  activeSide = "up",
  rangeLower,
  rangeUpper,
  strikeLevels: strikeLevelsProp,
  height,
  layoutActive = true,
  className,
  interval: intervalProp,
  onIntervalChange,
  displayMode: displayModeProp,
  onDisplayModeChange,
}: Props) {
  const showBtcTweetMarquee = asset.toUpperCase() === "BTC";
  const theme = useTheme();
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [internalInterval, setInternalInterval] = useState<OhlcvInterval>(CHART_OHLCV_INTERVAL);
  const [internalDisplayMode, setInternalDisplayMode] = useState<ChartDisplayMode>("line");
  const interval = intervalProp ?? internalInterval;
  const setInterval = onIntervalChange ?? setInternalInterval;
  const displayMode = displayModeProp ?? internalDisplayMode;
  const setDisplayMode = onDisplayModeChange ?? setInternalDisplayMode;
  const hasOhlcv = Boolean(pair ?? deepbookPairForAsset(asset));
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceSeriesRef = useRef<ISeriesApi<"Line"> | ISeriesApi<"Candlestick"> | null>(null);
  const seriesModeRef = useRef<"line" | "candlestick" | null>(null);
  const dataLenRef = useRef(0);
  const seriesAnchorTimeRef = useRef<UTCTimestamp | null>(null);
  const intervalRef = useRef(interval);
  const strikeKeyRef = useRef("");
  const lineDataRef = useRef<LineData<UTCTimestamp>[]>([]);
  const candleDataRef = useRef<CandlestickData<UTCTimestamp>[]>([]);
  const strikeLevelsRef = useRef<ReturnType<typeof buildStrikeChartLevels>>([]);
  const viewportGuardRef = useRef<ReturnType<typeof createChartViewportGuard> | null>(null);

  const internalSeries = useChartPriceSeries(oracleId, asset, {
    enabled: chartSeriesProp === undefined,
    interval,
  });
  const chartSeries = chartSeriesProp ?? internalSeries;
  const { mode: sourceMode, candles, linePoints, isLoading, isError, refetch } = chartSeries;
  const effectiveMode: ChartDisplayMode = sourceMode === "line" ? "line" : displayMode;
  const intervalMs = ohlcvIntervalMs(interval);

  const marketStrikeInput = useMemo<StrikeChartLevelInput>(
    () => ({ activeSide, strikePrice, rangeLower, rangeUpper }),
    [activeSide, strikePrice, rangeLower, rangeUpper],
  );

  const strikeLevels = useMemo(
    () =>
      strikeLevelsProp && strikeLevelsProp.length > 0
        ? strikeLevelsProp
        : buildStrikeChartLevels(marketStrikeInput),
    [strikeLevelsProp, marketStrikeInput],
  );

  const lineData = useMemo(() => {
    if (sourceMode === "candlestick" && displayMode === "line") {
      return candles.map((bar) => ({ time: bar.time, value: bar.close }));
    }

    if (sourceMode !== "line" || !linePoints.length) return [];

    const positionAnchor =
      strikeLevelsProp && strikeLevelsProp.length > 0
        ? strikeLevelsProp[0]?.price
        : undefined;
    const anchorStrike =
      activeSide === "range" ? undefined : (positionAnchor ?? strikePrice);
    return buildStrikeAnchoredSpotLineData(
      linePoints,
      anchorStrike,
      intervalMs,
    );
  }, [
    sourceMode,
    displayMode,
    candles,
    linePoints,
    strikePrice,
    activeSide,
    strikeLevelsProp,
    intervalMs,
  ]);

  const candleData = sourceMode === "candlestick" ? candles : [];
  const hasData =
    effectiveMode === "candlestick" ? candleData.length > 0 : lineData.length > 0;
  const dataLength =
    effectiveMode === "candlestick" ? candleData.length : lineData.length;

  const strikeLevelsKey = useMemo(
    () =>
      strikeLevels
        .map((level) => `${level.label}:${level.price}:${level.tone}`)
        .join("|"),
    [strikeLevels],
  );

  lineDataRef.current = lineData;
  candleDataRef.current = candleData;
  strikeLevelsRef.current = strikeLevels;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !layoutActive || !containerRef.current) {
      setChartReady(false);
      return;
    }

    const el = containerRef.current;
    const chart = createChart(
      el,
      lightweightChartOptions(
        Math.max(el.clientWidth, 1),
        Math.max(el.clientHeight, 240),
        PREDICT_CHART_SCALE_MARGINS,
      ),
    );
    chartRef.current = chart;
    priceSeriesRef.current = null;
    seriesModeRef.current = null;
    viewportGuardRef.current?.destroy();
    viewportGuardRef.current = createChartViewportGuard(chart);
    setChartReady(true);

    const ro = new ResizeObserver(() => {
      const activeChart = chartRef.current;
      if (activeChart) safeResizeChart(activeChart, el);
    });
    ro.observe(el);

    let raf = 0;
    let sizeAttempts = 0;
    const ensureSize = () => {
      const activeChart = chartRef.current;
      if (!activeChart) return;
      if (safeResizeChart(activeChart, el)) return;
      if (++sizeAttempts < INITIAL_SIZE_RAF_ATTEMPTS) {
        raf = requestAnimationFrame(ensureSize);
      }
    };
    raf = requestAnimationFrame(ensureSize);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      viewportGuardRef.current?.destroy();
      viewportGuardRef.current = null;
      const activeChart = chartRef.current;
      chartRef.current = null;
      priceSeriesRef.current = null;
      seriesModeRef.current = null;
      dataLenRef.current = 0;
      seriesAnchorTimeRef.current = null;
      strikeKeyRef.current = "";
      setChartReady(false);
      safeRemoveChart(activeChart);
    };
  }, [mounted, layoutActive, oracleId]);

  useEffect(() => {
    if (!chartReady) return;
    const chart = chartRef.current;
    if (!chart) return;

    applyLightweightChartTheme(chart);

    const series = priceSeriesRef.current;
    const seriesMode = seriesModeRef.current;
    if (series && seriesMode === "candlestick") {
      applyCandlestickSeriesTheme(series as ISeriesApi<"Candlestick">);
    } else if (series && seriesMode === "line") {
      applyLineSeriesMarketsSparklineTheme(series as ISeriesApi<"Line">);
    }
  }, [theme, chartReady]);

  useEffect(() => {
    if (!layoutActive || !mounted) return;
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      const chart = chartRef.current;
      if (chart) safeResizeChart(chart, el);
    };
    resize();
    const raf = requestAnimationFrame(resize);
    const timer = window.setTimeout(resize, 120);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [layoutActive, mounted, dataLength]);

  useEffect(() => {
    if (!chartReady || !layoutActive) return;
    const chart = chartRef.current;
    if (!chart || !hasData) return;

    if (intervalRef.current !== interval) {
      intervalRef.current = interval;
      seriesAnchorTimeRef.current = null;
      dataLenRef.current = 0;
    }

    const viewport = viewportGuardRef.current;
    const strikeKey = `${activeSide}:${strikePrice ?? 0}:${rangeLower ?? 0}:${rangeUpper ?? 0}:${strikeLevelsKey}`;
    const strikeChanged = strikeKeyRef.current !== strikeKey;
    strikeKeyRef.current = strikeKey;

    const prevLen = dataLenRef.current;
    const grew = dataLength > prevLen;
    const sameMode = seriesModeRef.current === effectiveMode;
    const series = priceSeriesRef.current;
    const anchorTime =
      effectiveMode === "candlestick" ? candleData[0]?.time : lineData[0]?.time;
    const sameSeriesAnchor =
      anchorTime != null &&
      seriesAnchorTimeRef.current != null &&
      anchorTime === seriesAnchorTimeRef.current;

    const restoreIfNeeded = (saved: SavedChartViewport | null) => {
      if (saved && viewport?.shouldPreserve()) {
        viewport.restore(saved);
      }
    };

    const canLineStreamUpdate =
      sameSeriesAnchor &&
      sameMode &&
      !strikeChanged &&
      grew &&
      prevLen > 0 &&
      series &&
      effectiveMode === "line";

    if (canLineStreamUpdate) {
      const lineSeries = series as ISeriesApi<"Line">;
      const followLive = viewport ? isChartNearRightEdge(chart, prevLen) : true;
      const saved = viewport?.shouldPreserve() ? viewport.save() : null;
      for (const point of lineData.slice(prevLen)) {
        lineSeries.update(point);
      }
      dataLenRef.current = dataLength;
      if (followLive && !viewport?.shouldPreserve()) {
        followChartRightEdge(chart, dataLength - prevLen);
      } else {
        restoreIfNeeded(saved);
      }
      return;
    }

    const canCandleStreamUpdate =
      sameSeriesAnchor &&
      sameMode &&
      !strikeChanged &&
      grew &&
      prevLen > 0 &&
      series &&
      effectiveMode === "candlestick";

    if (canCandleStreamUpdate) {
      const candleSeries = series as ISeriesApi<"Candlestick">;
      const followLive = viewport ? isChartNearRightEdge(chart, prevLen) : true;
      const saved = viewport?.shouldPreserve() ? viewport.save() : null;
      for (const bar of candleData.slice(prevLen)) {
        candleSeries.update(bar);
      }
      dataLenRef.current = dataLength;
      if (followLive && !viewport?.shouldPreserve()) {
        followChartRightEdge(chart, dataLength - prevLen);
      } else {
        restoreIfNeeded(saved);
      }
      return;
    }

    if (series && sameMode && sameSeriesAnchor && dataLength > 0) {
      const saved = viewport?.shouldPreserve() ? viewport.save() : null;
      if (effectiveMode === "candlestick") {
        (series as ISeriesApi<"Candlestick">).setData(candleData);
      } else {
        (series as ISeriesApi<"Line">).setData(lineData);
      }
      dataLenRef.current = dataLength;
      if (strikeChanged) {
        if (!viewport?.shouldPreserve()) {
          viewport?.applyProgrammatic(() =>
            applyPredictChartViewport(chart, dataLength, effectiveMode),
          );
        } else {
          restoreIfNeeded(saved);
        }
      } else {
        restoreIfNeeded(saved);
      }
      return;
    }

    if (series) {
      chart.removeSeries(series);
      priceSeriesRef.current = null;
      seriesModeRef.current = null;
    }

    viewport?.reset();

    if (effectiveMode === "candlestick") {
      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: candlestickUpColor(),
        downColor: candlestickDownColor(),
        borderVisible: false,
        wickUpColor: candlestickUpColor(),
        wickDownColor: candlestickDownColor(),
        lastValueVisible: true,
        priceLineVisible: false,
        autoscaleInfoProvider: () =>
          buildCandleAutoscaleInfo(candleDataRef.current, strikeLevelsRef.current),
      });
      candleSeries.setData(candleData);
      priceSeriesRef.current = candleSeries;
      seriesModeRef.current = "candlestick";
    } else {
      const lineSeries = chart.addSeries(LineSeries, {
        color: lineSeriesMarketsSparklineColor(),
        lineWidth: 2,
        lineType: LineType.Curved,
        crosshairMarkerVisible: true,
        lastValueVisible: true,
        priceLineVisible: false,
        autoscaleInfoProvider: () =>
          buildPredictAutoscaleInfo(lineDataRef.current, strikeLevelsRef.current),
      });
      lineSeries.setData(lineData);
      priceSeriesRef.current = lineSeries;
      seriesModeRef.current = "line";
    }

    dataLenRef.current = dataLength;
    seriesAnchorTimeRef.current = anchorTime ?? null;
    viewport?.applyProgrammatic(() =>
      applyPredictChartViewport(chart, dataLength, effectiveMode),
    );
    chart.priceScale("right").applyOptions({ autoScale: true });
  }, [
    chartReady,
    effectiveMode,
    lineData,
    candleData,
    dataLength,
    hasData,
    activeSide,
    strikePrice,
    rangeLower,
    rangeUpper,
    strikeLevelsKey,
    interval,
    layoutActive,
  ]);

  useEffect(() => {
    if (!chartReady || !layoutActive) return;
    const series = priceSeriesRef.current;
    if (!series) return;

    const priceLines = strikeLevels.map((level) =>
      series.createPriceLine({
        price: level.price,
        color: levelLineColor(level.tone),
        lineWidth: 2,
        lineStyle: levelLineStyle(level.tone),
        axisLabelVisible: true,
        title: level.label,
      }),
    );

    return () => {
      for (const line of priceLines) {
        try {
          series.removePriceLine(line);
        } catch {
          /* chart may already be disposed */
        }
      }
    };
  }, [chartReady, layoutActive, effectiveMode, strikeLevelsKey, strikeLevels, theme]);

  const chartLabel = pair ?? `${asset}/USDC`;
  const showChart = mounted && !isLoading && !isError && hasData;

  const handleZoomIn = () => {
    const chart = chartRef.current;
    if (chart) zoomChartTimeScale(chart, "in");
  };

  const handleZoomOut = () => {
    const chart = chartRef.current;
    if (chart) zoomChartTimeScale(chart, "out");
  };

  const handleResetView = () => {
    const chart = chartRef.current;
    if (!chart || !hasData) return;
    resetChartViewport(chart, dataLength, effectiveMode, viewportGuardRef.current);
  };

  return (
    <div
      className={cn(
        tradeSurface,
        "relative flex flex-col",
        height == null && "h-full min-h-0",
        className,
      )}
      style={height != null ? { height } : undefined}
      aria-label={`${chartLabel} price chart`}
    >
      {showBtcTweetMarquee ? <BtcTweetMarquee /> : null}
      <ChartToolbar
        hasOhlcv={hasOhlcv}
        interval={interval}
        onIntervalChange={setInterval}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
      />
      <div className="relative min-h-0 flex-1">
        {(!mounted || isLoading) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/90 backdrop-blur-[2px]">
            <LoadingState label={ui.loadingChart} compact />
          </div>
        )}
        {mounted && isError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/90 p-4">
            <EmptyState
              icon={LineChart}
              title="Could not load chart"
              description="Price data may be temporarily unavailable. Try again in a moment."
              action={
                <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              }
              compact
            />
          </div>
        )}
        <div
          ref={containerRef}
          className={cn("h-full w-full", (isLoading || isError) && "opacity-0")}
        />
        {showChart && (
          <a
            href="https://www.tradingview.com"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-1 left-2 z-10 text-[9px] text-muted-foreground/70 hover:text-muted-foreground"
          >
            Chart by TradingView
          </a>
        )}
      </div>
    </div>
  );
}
