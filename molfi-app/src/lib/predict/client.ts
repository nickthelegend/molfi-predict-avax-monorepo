import { appConfig } from "@/lib/config";
import { fetchJson } from "@/lib/api/fetch-json";
import { formatPredictTimeRemaining } from "@/lib/predict/knowledge";
import { getPredictOracleRows, PREDICT_ORACLES_QUERY_KEY } from "@/lib/predict/oracle-cache";
import { parseOracleState } from "@/lib/predict/oracles";
import { scaleSpot } from "@/lib/predict/scaling";
import type {
  PredictLpSupplyEvent,
  PredictLpWithdrawalEvent,
  PredictManagerPnl,
  PredictManagerPositionSummary,
  PredictManagerSummary,
  PredictOracleDetail,
  PredictOraclePriceUpdate,
  PredictOracleSummary,
  PredictServerStatus,
  PredictState,
  PredictVaultPerformance,
  PredictVaultSummary,
} from "@/lib/predict/types";

export { getPredictOracleRows, PREDICT_ORACLES_QUERY_KEY };

function baseUrl(): string {
  return appConfig.predictServerUrl.replace(/\/$/, "");
}

function predictId(): string {
  return appConfig.predictId;
}

/** Bare array or `{ value: [] }` (some clients wrap arrays). */
export function parsePredictList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const value = (data as { value?: unknown }).value;
    if (Array.isArray(value)) return value as T[];
  }
  return [];
}

export async function fetchPredictServerStatus(): Promise<PredictServerStatus> {
  return fetchJson<PredictServerStatus>(`${baseUrl()}/status`);
}

export async function fetchPredictState(): Promise<PredictState> {
  return fetchJson<PredictState>(`${baseUrl()}/predicts/${predictId()}/state`);
}

export async function fetchPredictQuoteAssets(): Promise<string[]> {
  const data = await fetchJson<unknown>(`${baseUrl()}/predicts/${predictId()}/quote-assets`);
  return parsePredictList<string>(data);
}

export async function fetchPredictOracles(): Promise<PredictOracleSummary[]> {
  return getPredictOracleRows();
}

export async function fetchOracleState(oracleId: string): Promise<PredictOracleDetail> {
  const data = await fetchJson<unknown>(`${baseUrl()}/oracles/${oracleId}/state`, {
    timeoutMs: 60_000,
  });
  return parseOracleState(data);
}

export async function fetchOraclePriceLatest(
  oracleId: string,
): Promise<{ spot: number; timestampMs?: number } | null> {
  if (!oracleId) return null;
  try {
    const data = await fetchJson<PredictOraclePriceUpdate>(
      `${baseUrl()}/oracles/${oracleId}/prices/latest`,
    );
    const spot = scaleSpot(data.spot);
    if (spot <= 0) return null;
    return {
      spot,
      timestampMs: data.checkpoint_timestamp_ms ?? data.onchain_timestamp,
    };
  } catch {
    return null;
  }
}

const ORACLE_SPOT_FETCH_CONCURRENCY = 3;
const ORACLE_SPOT_CHUNK_DELAY_MS = 200;

/** Latest spot per oracle id (throttled batches, failures omitted). */
export async function fetchOracleSpotMap(
  oracleIds: readonly string[],
): Promise<Map<string, number>> {
  const unique = [...new Set(oracleIds.filter(Boolean))];
  if (unique.length === 0) return new Map();

  const entries: Array<readonly [string, number] | null> = [];

  for (let start = 0; start < unique.length; start += ORACLE_SPOT_FETCH_CONCURRENCY) {
    const chunk = unique.slice(start, start + ORACLE_SPOT_FETCH_CONCURRENCY);
    const chunkEntries = await Promise.all(
      chunk.map(async (id) => {
        const latest = await fetchOraclePriceLatest(id);
        return latest ? ([id, latest.spot] as const) : null;
      }),
    );
    entries.push(...chunkEntries);

    if (start + ORACLE_SPOT_FETCH_CONCURRENCY < unique.length) {
      await new Promise((resolve) => setTimeout(resolve, ORACLE_SPOT_CHUNK_DELAY_MS));
    }
  }

  return new Map(entries.filter((e): e is readonly [string, number] => e !== null));
}

export async function fetchVaultSummary(): Promise<PredictVaultSummary> {
  return fetchJson<PredictVaultSummary>(`${baseUrl()}/predicts/${predictId()}/vault/summary`);
}

export async function fetchVaultPerformance(
  range = "ALL",
): Promise<PredictVaultPerformance> {
  return fetchJson<PredictVaultPerformance>(
    `${baseUrl()}/predicts/${predictId()}/vault/performance?range=${encodeURIComponent(range)}`,
    { timeoutMs: 30_000 },
  );
}

export async function fetchLpSupplies(limit = 5): Promise<PredictLpSupplyEvent[]> {
  const data = await fetchJson<unknown>(
    `${baseUrl()}/lp/supplies?predict_id=${encodeURIComponent(predictId())}&limit=${limit}`,
  );
  return parsePredictList<PredictLpSupplyEvent>(data);
}

export async function fetchLpWithdrawals(limit = 5): Promise<PredictLpWithdrawalEvent[]> {
  const data = await fetchJson<unknown>(
    `${baseUrl()}/lp/withdrawals?predict_id=${encodeURIComponent(predictId())}&limit=${limit}`,
  );
  return parsePredictList<PredictLpWithdrawalEvent>(data);
}

export async function fetchManagerSummary(managerId: string): Promise<PredictManagerSummary> {
  return fetchJson<PredictManagerSummary>(`${baseUrl()}/managers/${managerId}/summary`);
}

export async function fetchManagerPositionsSummary(
  managerId: string,
): Promise<PredictManagerPositionSummary[]> {
  const data = await fetchJson<unknown>(
    `${baseUrl()}/managers/${managerId}/positions/summary`,
    { timeoutMs: 30_000 },
  );
  return parsePredictList<PredictManagerPositionSummary>(data);
}

export async function fetchManagerPnl(managerId: string, range = "ALL"): Promise<PredictManagerPnl> {
  return fetchJson<PredictManagerPnl>(
    `${baseUrl()}/managers/${managerId}/pnl?range=${encodeURIComponent(range)}`,
  );
}

export interface PredictTradeEvent {
  type: "mint" | "redeem";
  oracle_id: string;
  strike: number;
  is_up: boolean;
  quantity: number;
  cost?: number;
  payout?: number;
  ask_price?: number;
  bid_price?: number;
  checkpoint_timestamp_ms: number;
}

export async function fetchOracleTrades(oracleId: string): Promise<PredictTradeEvent[]> {
  const data = await fetchJson<unknown>(`${baseUrl()}/trades/${oracleId}`, {
    timeoutMs: 60_000,
  });
  return parsePredictList<PredictTradeEvent>(data);
}

/** Human-readable protection term label (testnet tenors are multi-day). */
export function formatOracleExpiry(expiryMs?: number): string {
  if (!expiryMs) return "Multi-day protection term";
  return `Protection term · ${formatPredictTimeRemaining(expiryMs)} left`;
}
