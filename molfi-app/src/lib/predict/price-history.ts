import type { PricePoint } from "@/lib/predict/price-point";
import { appConfig } from "@/lib/config";
import { fetchJson } from "@/lib/api/fetch-json";
import { scaleSpot } from "@/lib/predict/scaling";
import type { PredictOraclePriceUpdate } from "@/lib/predict/types";

const DEFAULT_PRICE_LIMIT = 120;

function parsePriceRows(data: unknown): PredictOraclePriceUpdate[] {
  if (Array.isArray(data)) return data as PredictOraclePriceUpdate[];
  if (data && typeof data === "object") {
    const value = (data as { value?: unknown }).value;
    if (Array.isArray(value)) return value as PredictOraclePriceUpdate[];
  }
  return [];
}

/** Oracle spot history from `GET /oracles/:id/prices` (newest first). */
export async function fetchPredictOraclePriceHistory(
  oracleId: string,
  limit = DEFAULT_PRICE_LIMIT,
): Promise<PricePoint[]> {
  if (!appConfig.usePredictServer || !oracleId) return [];

  const base = appConfig.predictServerUrl.replace(/\/$/, "");
  const data = await fetchJson<unknown>(
    `${base}/oracles/${oracleId}/prices?limit=${limit}`,
    { timeoutMs: 20_000 },
  );

  const rows = parsePriceRows(data);
  if (rows.length === 0) return [];

  return rows
    .map((row): PricePoint | null => {
      const ts = row.checkpoint_timestamp_ms ?? row.onchain_timestamp ?? 0;
      const price = scaleSpot(row.spot);
      if (ts <= 0 || price <= 0) return null;
      return {
        t: ts,
        price,
        label: new Date(ts).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .filter((p): p is PricePoint => p !== null)
    .reverse();
}
