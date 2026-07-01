import { baseFromUnderlying } from "@/lib/markets";
import { appConfig } from "@/lib/config";
import type { MarketCatalogEntry } from "@/lib/leverx/indexer-client";
import {
  MARKET_TITLE_DOWN,
  MARKET_TITLE_RANGE,
  MARKET_TITLE_UP,
  catalogEntryToMarketRow,
  type LeverxMarketRow,
} from "@/lib/leverx/indexer-markets";
import { FLOAT_SCALING } from "@/lib/predict/constants";
import { isActiveOracleRow, isLiveOracleRow, isSettledOracleRow } from "@/lib/predict/oracles";
import type { PredictOracleSummary } from "@/lib/predict/types";
import { rangeBoundsFromPreset, atmStrikeRaw } from "@/lib/leverx/strike-selection";

export { atmStrikeRaw };

const SCALE = Number(FLOAT_SCALING);

export type MarketCategory = "All" | "Live" | "Closed";

function scaledRaw(value: number | undefined | null): number {
  if (value == null || value <= 0) return 0;
  return value;
}

function oracleAsset(oracle: PredictOracleSummary): string {
  return baseFromUnderlying(oracle.underlying_asset ?? "") || "MKT";
}

function toStrikeRaw(value: number | undefined | null): number {
  if (value == null || value <= 0) return 0;
  // List rows may be 1e9-scaled; detail rows are USD after scaledFromApi.
  return value < 1_000_000 ? Math.round(value * SCALE) : Math.round(value);
}

/** Resolve vertical range bounds for an oracle (catalog row, URL params, or spot ± 0.2%). */
export function resolveRangeBounds(args: {
  oracleId: string;
  catalogRows?: readonly LeverxMarketRow[];
  oracle?: PredictOracleSummary | null;
  oracleSpot?: number | null;
  strikeRaw?: number;
  lowerStrikeRaw?: number;
  upperStrikeRaw?: number;
}): { lower: number; upper: number } | null {
  const catalogRows = args.catalogRows ?? [];

  if (args.lowerStrikeRaw && args.upperStrikeRaw && args.upperStrikeRaw > args.lowerStrikeRaw) {
    return { lower: args.lowerStrikeRaw, upper: args.upperStrikeRaw };
  }

  if (args.lowerStrikeRaw) {
    const matched = catalogRows.find(
      (m) =>
        m.oracleId === args.oracleId &&
        m.isRange &&
        m.strikeRaw === args.lowerStrikeRaw &&
        m.higherStrikeRaw > m.strikeRaw,
    );
    if (matched) {
      return { lower: matched.strikeRaw, upper: matched.higherStrikeRaw };
    }
  }

  const minStrikeRaw = toStrikeRaw(args.oracle?.min_strike);
  const tickRaw = toStrikeRaw(args.oracle?.tick_size) || minStrikeRaw || SCALE;
  const spot =
    args.oracleSpot ??
    (args.oracle?.settlement_price
      ? args.oracle.settlement_price < 1_000_000
        ? args.oracle.settlement_price
        : args.oracle.settlement_price / SCALE
      : 0);

  if (spot > 0) {
    return rangeBoundsFromPreset("market", spot, minStrikeRaw, tickRaw);
  }

  const atm =
    args.strikeRaw && args.strikeRaw > 0
      ? args.strikeRaw
      : atmStrikeRaw(spot ?? 0, minStrikeRaw, tickRaw);

  if (atm <= 0) return null;

  const lower = Math.max(minStrikeRaw > 0 ? minStrikeRaw : tickRaw, atm - tickRaw);
  const upper = atm + tickRaw;
  if (upper <= lower) return null;

  return { lower, upper };
}

function buildSyntheticRangeRow(
  oracle: PredictOracleSummary,
  oracleId: string,
  lower: number,
  upper: number,
  spot?: number,
): LeverxMarketRow {
  const asset = oracleAsset(oracle);
  const expiry = oracle.expiry ?? 0;
  return {
    id: `${oracleId}:${expiry}:${lower}:${upper}:1:1`,
    oracleId,
    asset,
    strike: lower / SCALE,
    strikeRaw: lower,
    higherStrikeRaw: upper,
    expiry,
    isUp: true,
    isRange: true,
    lastAskPremium: null,
    volume: 0,
    status: oracle.status ?? "active",
    spotPrice: spot != null && spot > 0 ? spot : null,
    oracleStatus: oracle.status,
    underlyingAsset: oracle.underlying_asset,
  };
}

function groupCatalogByOracle(
  catalog: readonly MarketCatalogEntry[],
  oracles: readonly PredictOracleSummary[],
): Map<string, MarketCatalogEntry[]> {
  const oracleById = new Map(oracles.map((o) => [o.oracle_id, o]));
  const oracleByExpiry = new Map<number, PredictOracleSummary[]>();
  for (const oracle of oracles) {
    if (!oracle.expiry || oracle.expiry <= 0) continue;
    const list = oracleByExpiry.get(oracle.expiry) ?? [];
    list.push(oracle);
    oracleByExpiry.set(oracle.expiry, list);
  }

  const map = new Map<string, MarketCatalogEntry[]>();
  for (const entry of catalog) {
    const oracle = resolveOracleForCatalogEntry(entry, oracleById, oracleByExpiry);
    if (!oracle) continue;

    const normalized = catalogEntryWithOracle(entry, oracle.oracle_id);
    const list = map.get(oracle.oracle_id) ?? [];
    list.push(normalized);
    map.set(oracle.oracle_id, list);
  }
  return map;
}

function resolveOracleForCatalogEntry(
  entry: MarketCatalogEntry,
  oracleById: Map<string, PredictOracleSummary>,
  oracleByExpiry: Map<number, PredictOracleSummary[]>,
  now = Date.now(),
): PredictOracleSummary | undefined {
  const byExpiry = oracleByExpiry.get(entry.expiry_ms) ?? [];
  if (byExpiry.length > 0) {
    return (
      byExpiry.find((o) => isActiveOracleRow(o, now)) ??
      byExpiry.find((o) => isLiveOracleRow(o)) ??
      byExpiry[0]
    );
  }

  return oracleById.get(entry.oracle_id);
}

function catalogEntryWithOracle(entry: MarketCatalogEntry, oracleId: string): MarketCatalogEntry {
  if (entry.oracle_id === oracleId) return entry;

  return {
    ...entry,
    oracle_id: oracleId,
    market_key: `${oracleId}:${entry.expiry_ms}:${entry.strike}:${entry.higher_strike}:${entry.is_up ? 1 : 0}:${entry.is_range ? 1 : 0}`,
  };
}

export function enrichMarketRow(
  row: LeverxMarketRow,
  oracle: PredictOracleSummary | undefined,
  spot?: number,
): LeverxMarketRow {
  if (!oracle) return row;
  const asset = oracleAsset(oracle);
  const expiry = row.expiry > 0 ? row.expiry : (oracle.expiry ?? 0);
  const minStrikeRaw = scaledRaw(oracle.min_strike);
  const tickSizeRaw = scaledRaw(oracle.tick_size);
  return {
    ...row,
    asset,
    expiry,
    oracleStatus: oracle.status,
    underlyingAsset: oracle.underlying_asset,
    minStrikeRaw,
    tickSizeRaw,
    spotPrice: spot ?? row.spotPrice ?? null,
    status: row.status === "indexed" && oracle.status ? oracle.status : row.status,
  };
}

function defaultUpRow(
  oracle: PredictOracleSummary,
  strikeRaw: number,
  spot?: number,
): LeverxMarketRow {
  const asset = oracleAsset(oracle);
  const expiry = oracle.expiry ?? 0;
  const marketKey = `${oracle.oracle_id}:${expiry}:${strikeRaw}:0:1:0`;

  return {
    id: marketKey,
    oracleId: oracle.oracle_id,
    asset,
    strike: strikeRaw / SCALE,
    strikeRaw,
    higherStrikeRaw: 0,
    expiry,
    isUp: true,
    isRange: false,
    lastAskPremium: null,
    volume: 0,
    status: oracle.status ?? "active",
    spotPrice: spot ?? null,
    oracleStatus: oracle.status,
    underlyingAsset: oracle.underlying_asset,
    minStrikeRaw: scaledRaw(oracle.min_strike),
    tickSizeRaw: scaledRaw(oracle.tick_size),
  };
}

function upMarketKey(oracleId: string, expiry: number, strikeRaw: number): string {
  return `${oracleId}:${expiry}:${strikeRaw}:0:1:0`;
}

/**
 * Catalog cards always show the UP "above …" contract — same ATM strike logic as
 * the trade terminal so live quotes resolve instead of pausing at 0¢.
 * Preserves `row.id` so paginated catalog rows stay distinct (All vs Live tabs).
 */
export function gridUpDisplayRow(row: LeverxMarketRow): LeverxMarketRow {
  const spot = row.spotPrice;
  const minStrikeRaw = row.minStrikeRaw ?? 0;
  const tickSizeRaw = row.tickSizeRaw ?? 0;

  const atmStrike =
    spot != null && spot > 0
      ? atmStrikeRaw(spot, minStrikeRaw, tickSizeRaw)
      : 0;

  // Grid/list always quote UP ATM cents — never DOWN/RANGE catalog strike or premium.
  const quoteStrikeRaw =
    atmStrike > 0
      ? atmStrike
      : row.isUp && !row.isRange && row.strikeRaw > 0
        ? row.strikeRaw
        : 0;

  const catalogUpAtQuote =
    row.isUp &&
    !row.isRange &&
    quoteStrikeRaw > 0 &&
    row.strikeRaw === quoteStrikeRaw;

  return {
    ...row,
    strikeRaw: quoteStrikeRaw,
    strike: quoteStrikeRaw / SCALE,
    higherStrikeRaw: 0,
    isUp: true,
    isRange: false,
    lastAskPremium: catalogUpAtQuote ? row.lastAskPremium : null,
    quotePaused: catalogUpAtQuote ? row.quotePaused : undefined,
  };
}

function oraclesForCategory(
  oracles: readonly PredictOracleSummary[],
  category: MarketCategory,
): PredictOracleSummary[] {
  if (category === "Live") {
    return oracles.filter((o) => isActiveOracleRow(o));
  }

  if (category === "Closed") {
    return oracles.filter((o) => isSettledOracleRow(o));
  }

  return oracles.filter((o) => Boolean(o.oracle_id));
}

function catalogEntriesForCategory(
  entries: readonly MarketCatalogEntry[],
  _category: MarketCategory,
): MarketCatalogEntry[] {
  if (!appConfig.rangeEnabled) {
    return entries.filter((entry) => !entry.is_range);
  }
  return [...entries];
}

function primaryCatalogEntry(
  entries: readonly MarketCatalogEntry[],
): MarketCatalogEntry | undefined {
  if (entries.length === 0) return undefined;
  if (entries.length === 1) return entries[0];

  return [...entries].sort(
    (a, b) =>
      b.volume_24h - a.volume_24h ||
      b.trade_count_24h - a.trade_count_24h ||
      b.updated_at_ms - a.updated_at_ms,
  )[0];
}

function pushCatalogRow(
  rows: LeverxMarketRow[],
  seen: Set<string>,
  entry: MarketCatalogEntry,
  oracle: PredictOracleSummary,
  spotByOracle?: ReadonlyMap<string, number>,
) {
  const row = enrichMarketRow(
    catalogEntryToMarketRow(entry),
    oracle,
    spotByOracle?.get(oracle.oracle_id),
  );
  if (seen.has(row.id)) return;
  seen.add(row.id);
  rows.push(row);
}

function pushDefaultOracleRow(
  rows: LeverxMarketRow[],
  seen: Set<string>,
  oracle: PredictOracleSummary,
  spotByOracle?: ReadonlyMap<string, number>,
) {
  if (isSettledOracleRow(oracle)) return;

  const spot =
    spotByOracle?.get(oracle.oracle_id) ??
    (oracle.settlement_price ? oracle.settlement_price / SCALE : undefined);
  const strikeRaw = atmStrikeRaw(
    spot ?? 0,
    scaledRaw(oracle.min_strike),
    scaledRaw(oracle.tick_size),
  );
  if (strikeRaw <= 0) return;

  const row = defaultUpRow(oracle, strikeRaw, spot);
  if (seen.has(row.id)) return;
  seen.add(row.id);
  rows.push(row);
}

export function mergeOracleMarkets(args: {
  oracles: readonly PredictOracleSummary[];
  catalog: readonly MarketCatalogEntry[];
  spotByOracle?: ReadonlyMap<string, number>;
  category: MarketCategory;
  search?: string;
}): LeverxMarketRow[] {
  const { oracles, catalog, spotByOracle, category, search = "" } = args;
  const oracleById = new Map(oracles.map((o) => [o.oracle_id, o]));
  const catalogByOracle = groupCatalogByOracle(catalog, oracles);

  const selectedOracles = oraclesForCategory(oracles, category);
  const seen = new Set<string>();
  const rows: LeverxMarketRow[] = [];

  for (const oracle of selectedOracles) {
    const entries = catalogEntriesForCategory(
      catalogByOracle.get(oracle.oracle_id) ?? [],
      category,
    );

    if (category === "Live") {
      const primary = primaryCatalogEntry(entries);
      if (primary) {
        pushCatalogRow(rows, seen, primary, oracle, spotByOracle);
      } else {
        pushDefaultOracleRow(rows, seen, oracle, spotByOracle);
      }
      continue;
    }

    if (entries.length > 0) {
      for (const entry of entries) {
        pushCatalogRow(rows, seen, entry, oracle, spotByOracle);
      }
      continue;
    }

    pushDefaultOracleRow(rows, seen, oracle, spotByOracle);
  }

  rows.sort((a, b) => b.volume - a.volume || b.expiry - a.expiry);

  const q = search.trim().toLowerCase();
  if (!q) return rows;

  return rows.filter(
    (m) =>
      MARKET_TITLE_UP.toLowerCase().includes(q) ||
      MARKET_TITLE_DOWN.toLowerCase().includes(q) ||
      MARKET_TITLE_RANGE.toLowerCase().includes(q) ||
      m.asset.toLowerCase().includes(q) ||
      m.oracleId.toLowerCase().includes(q) ||
      (m.underlyingAsset?.toLowerCase().includes(q) ?? false),
  );
}

export function resolveTradeMarket(args: {
  oracleId: string;
  oracle?: PredictOracleSummary | null;
  oracleSpot?: number | null;
  catalogRows: readonly LeverxMarketRow[];
  strikeRaw?: number;
  lowerStrikeRaw?: number;
  upperStrikeRaw?: number;
  side?: "up" | "down" | "range";
}): LeverxMarketRow | undefined {
  const {
    oracleId,
    oracle,
    oracleSpot,
    catalogRows,
    strikeRaw,
    lowerStrikeRaw,
    upperStrikeRaw,
    side = "up",
  } = args;

  const fromCatalog = catalogRows.find((m) => {
    if (side === "range") {
      const bounds = resolveRangeBounds({
        oracleId,
        catalogRows,
        oracle,
        oracleSpot,
        strikeRaw,
        lowerStrikeRaw,
        upperStrikeRaw,
      });
      if (!bounds) return m.isRange && (!lowerStrikeRaw || m.strikeRaw === lowerStrikeRaw);
      return m.isRange && m.strikeRaw === bounds.lower && m.higherStrikeRaw === bounds.upper;
    }
    if (strikeRaw) {
      return !m.isRange && m.isUp === (side === "up") && m.strikeRaw === strikeRaw;
    }
    return !m.isRange && m.isUp === (side === "up");
  });

  if (fromCatalog) return fromCatalog;

  if (!oracle || !isActiveOracleRow(oracle)) return undefined;

  const spot = oracleSpot ?? (oracle.settlement_price ? oracle.settlement_price / SCALE : 0);
  const rawStrike =
    side === "range" && lowerStrikeRaw
      ? lowerStrikeRaw
      : (strikeRaw ??
        atmStrikeRaw(spot, scaledRaw(oracle.min_strike), scaledRaw(oracle.tick_size)));

  if (rawStrike <= 0) return undefined;

  if (side === "range") {
    const bounds = resolveRangeBounds({
      oracleId,
      catalogRows,
      oracle,
      oracleSpot,
      strikeRaw,
      lowerStrikeRaw,
      upperStrikeRaw,
    });
    if (!bounds || !oracle) return undefined;
    return buildSyntheticRangeRow(
      oracle,
      oracleId,
      bounds.lower,
      bounds.upper,
      spot > 0 ? spot : undefined,
    );
  }

  const row = defaultUpRow(oracle, rawStrike, spot > 0 ? spot : undefined);
  if (side === "down") {
    const asset = oracleAsset(oracle);
    const expiry = oracle.expiry ?? 0;
    return {
      ...row,
      id: `${oracleId}:${expiry}:${rawStrike}:0:0:0`,
      isUp: false,
    };
  }
  return row;
}
