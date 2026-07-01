import { useMemo, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import {
  appendOracleTailCandle,
  mergeOhlcvWithOracleTail,
  ohlcvToCandlestickData,
} from "@/lib/charts/candle-data";
import {
  CHART_OHLCV_INTERVAL,
  CHART_OHLCV_LOOKBACK_MS,
  deepbookPairForAsset,
  fetchDeepbookOhlcv,
  type OhlcvCandle,
  type OhlcvInterval,
} from "@/lib/deepbook/ohlcv";
import { usePredictOracleState } from "@/hooks/usePredictOracleState";
import { useOraclePriceLatest, useOracleSpotPriceSeries } from "@/hooks/useOracleSpotPriceSeries";
import { shouldPatchOhlcvWithOracleSpot } from "@/lib/predict/oracles";
import type { PricePoint } from "@/lib/predict/price-point";
import type { PredictOracleDetail, PredictOracleSummary } from "@/lib/predict/types";

const OHLCV_REFETCH_MS = 60_000;

export { CHART_OHLCV_INTERVAL_MS } from "@/lib/deepbook/ohlcv";
export type { OhlcvInterval } from "@/lib/deepbook/ohlcv";
export type ChartDisplayMode = ChartPriceSeriesMode;

export type ChartPriceSeriesMode = "candlestick" | "line";

export type ChartPriceSeriesResult = {
  mode: ChartPriceSeriesMode;
  candles: CandlestickData<UTCTimestamp>[];
  linePoints: PricePoint[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
};

type OracleChartRow = Pick<
  PredictOracleSummary,
  "oracle_id" | "status" | "expiry" | "settled_at"
>;
type OracleChartDetail = Pick<PredictOracleDetail, "status" | "expiry" | "settled_at">;

function useDeepbookChartSeries(
  pair: string,
  oracleId: string,
  enabled: boolean,
  interval: OhlcvInterval,
  options?: {
    oracleRow?: OracleChartRow | null;
    oracleDetail?: OracleChartDetail | null;
    patchWithOracleSpot?: boolean;
  },
): ChartPriceSeriesResult {
  const { data: latest } = useOraclePriceLatest(oracleId, { enabled });
  const [oracleTailCandles, setOracleTailCandles] = useState<OhlcvCandle[]>([]);
  const { data: fetchedOracleState } = usePredictOracleState(oracleId, {
    enabled: enabled && options?.oracleDetail === undefined,
  });
  const oracleDetail = options?.oracleDetail ?? fetchedOracleState;

  const patchWithOracle = useMemo(() => {
    if (options?.patchWithOracleSpot === false) return false;
    if (options?.patchWithOracleSpot === true) return true;
    return shouldPatchOhlcvWithOracleSpot(options?.oracleRow, oracleDetail);
  }, [options?.oracleRow, options?.oracleDetail, options?.patchWithOracleSpot, oracleDetail]);

  const {
    data: rawCandles,
    isLoading,
    isError,
    isFetched,
    refetch,
  } = useQuery({
    queryKey: ["deepbook-ohlcv", pair, interval],
    queryFn: async () => {
      const endTime = Date.now();
      const startTime = endTime - CHART_OHLCV_LOOKBACK_MS;
      return fetchDeepbookOhlcv(pair, interval, startTime, endTime);
    },
    enabled,
    staleTime: OHLCV_REFETCH_MS / 2,
    refetchInterval: enabled ? OHLCV_REFETCH_MS : false,
    refetchIntervalInBackground: false,
    retry: 1,
  });

  useEffect(() => {
    setOracleTailCandles([]);
  }, [pair, interval, oracleId]);

  useEffect(() => {
    if (!patchWithOracle || !latest?.spot) return;
    setOracleTailCandles((prev) =>
      appendOracleTailCandle(prev, latest.spot, latest.timestampMs),
    );
  }, [latest, patchWithOracle]);

  const candles = useMemo(() => {
    if (!rawCandles?.length) return [];
    const merged = mergeOhlcvWithOracleTail(rawCandles, oracleTailCandles);
    return ohlcvToCandlestickData(merged);
  }, [rawCandles, oracleTailCandles]);

  return {
    mode: "candlestick",
    candles,
    linePoints: [],
    isLoading: enabled && isLoading && !isFetched && candles.length === 0,
    isError: enabled && isError && candles.length === 0,
    refetch: () => {
      void refetch();
    },
  };
}

/**
 * Chart price feed: DeepBook OHLCV candlesticks when a pair exists (latest bar
 * patched to live oracle spot while the oracle is active), otherwise live oracle line polls.
 */
export function useChartPriceSeries(
  oracleId: string,
  asset: string,
  options?: {
    enabled?: boolean;
    interval?: OhlcvInterval;
    oracleRow?: OracleChartRow | null;
    oracleDetail?: OracleChartDetail | null;
    /** When set, overrides oracle lifecycle checks for terminal-bar patching. */
    patchWithOracleSpot?: boolean;
  },
): ChartPriceSeriesResult {
  const enabled = Boolean(oracleId) && (options?.enabled ?? true);
  const interval = options?.interval ?? CHART_OHLCV_INTERVAL;
  const pair = deepbookPairForAsset(asset);
  const useOhlcv = Boolean(pair);

  const ohlcv = useDeepbookChartSeries(pair ?? "", oracleId, enabled && useOhlcv, interval, options);
  const oracle = useOracleSpotPriceSeries(oracleId, { enabled: enabled && !useOhlcv });

  if (useOhlcv) return ohlcv;

  return {
    mode: "line",
    candles: [],
    linePoints: oracle.data,
    isLoading: oracle.isLoading,
    isError: oracle.isError,
    refetch: oracle.refetch,
  };
}
