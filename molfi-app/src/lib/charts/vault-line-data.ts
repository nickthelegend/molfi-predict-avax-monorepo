import type { LineData, UTCTimestamp } from "lightweight-charts";
import type { VaultSnapshot } from "@/lib/leverx/indexer-client";
import { scaleQuote } from "@/lib/predict/scaling";

const DAY_SEC = 86_400;

function toChartTime(timestampMs: number): UTCTimestamp {
  return Math.floor(timestampMs / 1000) as UTCTimestamp;
}

/** Flat placeholder series when indexer history is empty or offline. */
export function flatChartLine(value = 0, days = 30): LineData<UTCTimestamp>[] {
  const end = Math.floor(Date.now() / 1000);
  const points: LineData<UTCTimestamp>[] = [];
  for (let i = days; i >= 0; i--) {
    points.push({ time: (end - i * DAY_SEC) as UTCTimestamp, value });
  }
  return points;
}

export function vaultSnapshotsToTvlLine(
  snapshots: readonly VaultSnapshot[],
): LineData<UTCTimestamp>[] {
  const byTime = new Map<number, number>();
  for (const s of snapshots) {
    if (s.nav == null || s.nav <= 0) continue;
    byTime.set(toChartTime(s.timestamp_ms), scaleQuote(s.nav));
  }
  return [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}

export function vaultSnapshotsToAprLine(
  snapshots: readonly VaultSnapshot[],
): LineData<UTCTimestamp>[] {
  const byTime = new Map<number, number>();
  for (const s of snapshots) {
    if (s.lp_apr_bps == null) continue;
    byTime.set(toChartTime(s.timestamp_ms), s.lp_apr_bps / 100);
  }
  return [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, value]) => ({ time: time as UTCTimestamp, value }));
}
