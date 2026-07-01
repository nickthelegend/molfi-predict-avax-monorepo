import { appConfig } from "@/lib/config";
import { fetchJson } from "@/lib/api/fetch-json";
import { parsePredictOraclesList } from "@/lib/predict/oracles";
import type { PredictOracleSummary } from "@/lib/predict/types";

export function predictOraclesQueryKey(predictId: string) {
  return ["predict-oracles", predictId] as const;
}

/** @deprecated Prefer `predictOraclesQueryKey(resolvedPredictId)`. */
export const PREDICT_ORACLES_QUERY_KEY = predictOraclesQueryKey(appConfig.predictId);

const CACHE_TTL_MS = 300_000;

let cachedPredictId: string | null = null;
let cachedRows: PredictOracleSummary[] | null = null;
let cachedAt = 0;
let inflight: Promise<PredictOracleSummary[]> | null = null;
let inflightPredictId: string | null = null;

async function loadOracleRows(predictId: string): Promise<PredictOracleSummary[]> {
  const base = appConfig.predictServerUrl.replace(/\/$/, "");
  const data = await fetchJson<unknown>(`${base}/predicts/${predictId}/oracles`, {
    timeoutMs: 120_000,
  });
  return parsePredictOraclesList(data);
}

/** Shared oracle list (large payload) — deduped in-flight + short TTL cache. */
export async function getPredictOracleRows(
  predictId: string = appConfig.predictId,
): Promise<PredictOracleSummary[]> {
  const id = predictId.trim() || appConfig.predictId;
  const now = Date.now();
  if (cachedRows && cachedPredictId === id && now - cachedAt < CACHE_TTL_MS) {
    return cachedRows;
  }

  if (!inflight || inflightPredictId !== id) {
    inflightPredictId = id;
    inflight = loadOracleRows(id)
      .then((rows) => {
        cachedPredictId = id;
        cachedRows = rows;
        cachedAt = Date.now();
        return rows;
      })
      .finally(() => {
        inflight = null;
        inflightPredictId = null;
      });
  }

  return inflight;
}

export function invalidatePredictOracleCache(): void {
  cachedPredictId = null;
  cachedRows = null;
  cachedAt = 0;
}
