import { FLOAT_SCALING } from "@/lib/predict/constants";
import { baseFromUnderlying } from "@/lib/markets";
import type { PredictOracleDetail, PredictOracleSummary } from "@/lib/predict/types";

function scaledFromApi(value: unknown): number | undefined {
  if (typeof value !== "number" || value <= 0) return undefined;
  return value / Number(FLOAT_SCALING);
}

/** Predict-server returns a bare array; older docs used `{ oracles: [] }`. */
export function parsePredictOraclesList(data: unknown): PredictOracleSummary[] {
  if (Array.isArray(data)) return data as PredictOracleSummary[];
  if (data && typeof data === "object") {
    const oracles = (data as { oracles?: unknown }).oracles;
    if (Array.isArray(oracles)) return oracles as PredictOracleSummary[];
  }
  return [];
}

/** State endpoint wraps fields under `oracle` + `latest_price.spot`. */
export function parseOracleState(data: unknown): PredictOracleDetail {
  if (!data || typeof data !== "object") {
    return { oracle_id: "" };
  }

  const raw = data as Record<string, unknown>;
  const nested = raw.oracle;
  if (nested && typeof nested === "object") {
    const oracle = nested as Record<string, unknown>;
    const latest = raw.latest_price;
    let spot_price: number | undefined;
    let latest_price_at: number | undefined;
    if (latest && typeof latest === "object") {
      const latestRow = latest as Record<string, unknown>;
      const spot = latestRow.spot;
      if (typeof spot === "number" && spot > 0) {
        spot_price = spot / Number(FLOAT_SCALING);
      }
      if (typeof latestRow.timestamp === "number") {
        latest_price_at = latestRow.timestamp;
      }
    }

    const settlement_price = scaledFromApi(oracle.settlement_price);

    return {
      oracle_id: String(oracle.oracle_id ?? ""),
      predict_id: oracle.predict_id as string | undefined,
      oracle_cap_id: oracle.oracle_cap_id as string | undefined,
      underlying_asset: oracle.underlying_asset as string | undefined,
      expiry: oracle.expiry as number | undefined,
      status: oracle.status as string | undefined,
      spot_price: spot_price ?? settlement_price,
      min_strike: scaledFromApi(oracle.min_strike),
      tick_size: scaledFromApi(oracle.tick_size),
      activated_at: oracle.activated_at as number | null | undefined,
      settlement_price,
      settled_at: oracle.settled_at as number | null | undefined,
      created_checkpoint: oracle.created_checkpoint as number | undefined,
      latest_price_at,
    };
  }

  return data as PredictOracleDetail;
}

const BASE_ALIASES: Record<string, string[]> = {
  BTC: ["BTC", "DBTC", "BITCOIN"],
  ETH: ["ETH", "WETH"],
  SUI: ["SUI"],
  SOL: ["SOL"],
  DEEP: ["DEEP"],
  WAL: ["WAL"],
};

export function matchesProtectionBase(underlying: string, base: string): boolean {
  const u = underlying.toUpperCase();
  const aliases = BASE_ALIASES[base.toUpperCase()] ?? [base.toUpperCase()];
  return aliases.some((a) => u === a || u.includes(a));
}

export function isOracleActiveStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "active";
}

export function isOracleSettledStatus(status: string | undefined): boolean {
  return status?.toLowerCase() === "settled";
}

/** Oracle has completed settlement (markets catalog "Closed" tab). */
export function isSettledOracleRow(row: PredictOracleSummary): boolean {
  if (!row.oracle_id) return false;
  if (isOracleSettledStatus(row.status)) return true;
  return row.settled_at != null && row.settled_at > 0;
}

/** Oracle not yet settled (markets catalog "Live" tab). */
export function isLiveOracleRow(row: PredictOracleSummary): boolean {
  return Boolean(row.oracle_id) && !isSettledOracleRow(row);
}

/** Whether new orders should be blocked (list row and/or live state). */
export function isOracleSettledForTrade(
  row?: Pick<PredictOracleSummary, "oracle_id" | "status" | "settled_at"> | null,
  detail?: Pick<PredictOracleDetail, "status" | "settled_at"> | null,
): boolean {
  if (row?.oracle_id && isSettledOracleRow(row as PredictOracleSummary)) return true;
  if (detail?.settled_at != null && detail.settled_at > 0) return true;
  return isOracleSettledStatus(detail?.status ?? row?.status);
}

/** Sync DeepBook OHLCV terminal bar to live oracle spot only while the oracle is active. */
export function shouldPatchOhlcvWithOracleSpot(
  row?: Pick<PredictOracleSummary, "oracle_id" | "status" | "expiry" | "settled_at"> | null,
  detail?: Pick<PredictOracleDetail, "status" | "expiry" | "settled_at"> | null,
  now = Date.now(),
): boolean {
  if (isOracleSettledForTrade(row, detail)) return false;

  const expiries = [row?.expiry, detail?.expiry].filter(
    (expiry): expiry is number => expiry != null && expiry > 0,
  );
  if (expiries.some((expiry) => expiry <= now)) return false;

  if (row?.oracle_id && isActiveOracleRow(row as PredictOracleSummary, now)) return true;

  if (
    detail &&
    isOracleActiveStatus(detail.status) &&
    (detail.expiry == null || detail.expiry <= 0 || detail.expiry > now)
  ) {
    return true;
  }

  return false;
}

/** Predict list row is active, non-expired, and has an oracle id. */
export function isActiveOracleRow(row: PredictOracleSummary, now = Date.now()): boolean {
  if (!row.oracle_id) return false;
  if (!isOracleActiveStatus(row.status)) return false;
  const expiryMs = row.expiry ?? 0;
  return expiryMs > now;
}

/** @deprecated Use isSettledOracleRow for catalog tabs. */
export function isClosedOracleRow(row: PredictOracleSummary): boolean {
  return isSettledOracleRow(row);
}

/** Active Predict oracle that settles protection for a margin base asset. */
export function isProtectionOracleForBase(
  row: PredictOracleSummary,
  base: string,
  now = Date.now(),
): boolean {
  if (!isActiveOracleRow(row, now)) return false;
  const underlying = row.underlying_asset ?? "";
  if (!underlying || !matchesProtectionBase(underlying, base)) return false;
  return true;
}

function pickNearestOracleForBase(
  rows: readonly PredictOracleSummary[],
  base: string,
  now = Date.now(),
): PredictOracleSummary | null {
  let best: PredictOracleSummary | null = null;
  let bestExpiry = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    if (!isProtectionOracleForBase(row, base, now)) continue;

    const expiryMs = row.expiry ?? 0;
    if (expiryMs < bestExpiry) {
      bestExpiry = expiryMs;
      best = row;
    }
  }

  return best;
}

/** Nearest non-expired active oracle for a margin base (no per-row state fetch). */
export function pickNearestActiveOracle(
  rows: readonly PredictOracleSummary[],
  base: string,
  now = Date.now(),
): PredictOracleSummary | null {
  return pickNearestOracleForBase(rows, base, now);
}

/** One nearest active oracle per normalized base asset. */
export function groupNearestActiveOraclesByBase(
  rows: readonly PredictOracleSummary[],
  now = Date.now(),
): Map<string, PredictOracleSummary> {
  const byBase = new Map<string, PredictOracleSummary>();

  for (const row of rows) {
    if (!isActiveOracleRow(row, now)) continue;

    const base = baseFromUnderlying(row.underlying_asset ?? "");
    if (!base) continue;

    const expiryMs = row.expiry ?? 0;
    const prev = byBase.get(base);
    if (!prev || expiryMs < (prev.expiry ?? Number.POSITIVE_INFINITY)) {
      byBase.set(base, row);
    }
  }

  return byBase;
}

/** Human-readable base asset (e.g. BTC) for a predict oracle id. */
export function assetLabelForOracleId(
  oracleId: string,
  oracles?: readonly PredictOracleSummary[],
): string {
  const oracle = oracles?.find((row) => row.oracle_id === oracleId);
  if (oracle) {
    const label = baseFromUnderlying(oracle.underlying_asset ?? "");
    if (label) return label;
  }
  return oracleId.slice(2, 6).toUpperCase() || "MKT";
}
