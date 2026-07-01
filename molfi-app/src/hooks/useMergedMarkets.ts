import { useMemo } from "react";
import { useMarketCatalog } from "@/hooks/useIndexer";
import { usePredictOracleRows } from "@/hooks/usePredictOracles";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import {
  mergeOracleMarkets,
  type MarketCategory,
} from "@/lib/leverx/predict-oracle-markets";

export function useMergedMarkets(args: {
  category: MarketCategory;
  search?: string;
}) {
  const {
    data: oracles = [],
    isLoading: oraclesLoading,
    isError: oraclesError,
    isFetched: oraclesFetched,
  } = usePredictOracleRows();

  const { data: catalog = [], isFetched: catalogFetched } = useMarketCatalog({
    limit: 1000,
  });

  const categoryCounts = useMemo(
    () => ({
      All: mergeOracleMarkets({ oracles, catalog, category: "All" }).length,
      Live: mergeOracleMarkets({ oracles, catalog, category: "Live" }).length,
      Closed: mergeOracleMarkets({ oracles, catalog, category: "Closed" }).length,
    }),
    [oracles, catalog],
  );

  const markets = useMemo(
    (): LeverxMarketRow[] =>
      mergeOracleMarkets({
        oracles,
        catalog,
        category: args.category,
        search: args.search,
      }),
    [oracles, catalog, args.category, args.search],
  );

  return {
    markets,
    categoryCounts,
    oracles,
    catalog,
    loading: !oraclesFetched || !catalogFetched,
    offline: oraclesError,
    catalogReady: catalogFetched,
    oraclesFetched,
    catalogFetched,
  };
}
