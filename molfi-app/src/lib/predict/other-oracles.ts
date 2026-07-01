import { baseFromUnderlying, makeTradeMarket } from "@/lib/markets";
import { formatOracleExpiry } from "@/lib/predict/client";
import { isActiveOracleRow } from "@/lib/predict/oracles";
import type { PredictOracleSummary } from "@/lib/predict/types";
import { FLOAT_SCALING } from "@/lib/predict/constants";

export { isActiveOracleRow };

export const OTHER_ORACLES_PAGE_SIZE = 20;

export interface OtherOracleRow {
  oracleId: string;
  id: string;
  underlying: string;
  status: string;
  spot: number;
  minStrike: number;
  tickSize: number;
  activatedAt: number | null;
  change24h: number;
  expiry: string;
}

function scaledPrice(value: number | null | undefined): number {
  if (value == null || value <= 0) return 0;
  return value / Number(FLOAT_SCALING);
}

function formatExpiryLabel(row: PredictOracleSummary): string {
  const expiryMs = row.expiry;
  if (!expiryMs) return "—";
  if (row.status === "settled" && row.settled_at) {
    return `Settled · expired ${new Date(expiryMs).toLocaleDateString()}`;
  }
  if (expiryMs <= Date.now()) {
    return `Expired ${new Date(expiryMs).toLocaleDateString()}`;
  }
  return formatOracleExpiry(expiryMs);
}

/** Full predict-server oracle list — same order as API, only drops rows without `oracle_id`. */
export function sortOracleRows(rows: readonly PredictOracleSummary[]): PredictOracleSummary[] {
  return rows.filter((row) => Boolean(row.oracle_id));
}

export function filterOracleRows(
  rows: readonly PredictOracleSummary[],
  activeOnly: boolean,
): PredictOracleSummary[] {
  const sorted = sortOracleRows(rows);
  if (!activeOnly) return sorted;
  return sorted.filter(isActiveOracleRow);
}

/** Case-insensitive match on oracle id, underlying, status, and normalized base. */
export function searchOracleRows(
  rows: readonly PredictOracleSummary[],
  query: string,
): PredictOracleSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...rows];

  return rows.filter((row) => {
    const underlying = row.underlying_asset ?? "";
    const base = baseFromUnderlying(underlying);
    const haystack = [row.oracle_id, row.predict_id, underlying, base, row.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function buildOtherOracleRowFromSummary(
  row: PredictOracleSummary,
  spotByOracleId?: ReadonlyMap<string, number>,
): OtherOracleRow | null {
  const oracleId = row.oracle_id;
  if (!oracleId) return null;

  const underlying = row.underlying_asset ?? "";
  const base = baseFromUnderlying(underlying) || underlying || "—";
  const market = makeTradeMarket(base === "—" ? "OTHER" : base);
  const status = row.status ?? "unknown";
  const liveSpot = spotByOracleId?.get(oracleId);
  const spot =
    liveSpot != null && liveSpot > 0 ? liveSpot : scaledPrice(row.settlement_price);
  const minStrike = scaledPrice(row.min_strike);
  const tickSize = scaledPrice(row.tick_size);
  const activatedAt =
    typeof row.activated_at === "number" && row.activated_at > 0 ? row.activated_at : null;

  return {
    oracleId,
    id: market.id,
    underlying: underlying || market.base,
    status,
    spot,
    minStrike,
    tickSize,
    activatedAt,
    change24h: 0,
    expiry: formatExpiryLabel(row),
  };
}

/** Map a page of raw API rows to table rows (optional live spot map for active oracles). */
export function buildOtherOracleRowsFromSummaries(
  rows: readonly PredictOracleSummary[],
  spotByOracleId?: ReadonlyMap<string, number>,
): OtherOracleRow[] {
  return rows.flatMap((row) => {
    const built = buildOtherOracleRowFromSummary(row, spotByOracleId);
    return built ? [built] : [];
  });
}
