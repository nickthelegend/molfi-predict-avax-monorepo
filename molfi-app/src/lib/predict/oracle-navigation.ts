import { filterOracleRows } from "@/lib/predict/other-oracles";
import type { PredictOracleSummary } from "@/lib/predict/types";

export interface OracleNeighbors {
  index: number;
  prev: PredictOracleSummary | null;
  next: PredictOracleSummary | null;
}

export interface OracleNeighborOptions {
  /** When true, only tradeable (active) oracles are included in the walk order. */
  activeOnly?: boolean;
}

/** Prev/next oracle in predict-server list order. */
export function resolveOracleNeighbors(
  oracles: readonly PredictOracleSummary[],
  oracleId: string,
  options?: OracleNeighborOptions,
): OracleNeighbors {
  const sorted = options?.activeOnly
    ? filterOracleRows(oracles, true)
    : oracles.filter((row) => Boolean(row.oracle_id));
  const index = sorted.findIndex((row) => row.oracle_id === oracleId);
  if (index < 0) {
    return { index: -1, prev: null, next: null };
  }
  return {
    index,
    prev: index > 0 ? sorted[index - 1]! : null,
    next: index < sorted.length - 1 ? sorted[index + 1]! : null,
  };
}
