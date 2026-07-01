import { useMemo } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/fetch-json";
import { fetchOraclePriceLatest } from "@/lib/predict/client";
import { oraclePriceLatestQueryKey } from "@/hooks/useOracleSpotPriceSeries";

const ORACLE_SPOT_MAP_STALE_MS = 120_000;
const ORACLE_SPOT_FETCH_CONCURRENCY = 3;
const ORACLE_SPOT_CHUNK_DELAY_MS = 200;

function shouldRetryOracleSpot(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 429) return false;
  return true;
}

async function fetchOracleSpotEntry(
  queryClient: QueryClient,
  id: string,
): Promise<readonly [string, number] | null> {
  try {
    const latest = await queryClient.fetchQuery({
      queryKey: oraclePriceLatestQueryKey(id),
      queryFn: () => fetchOraclePriceLatest(id),
      staleTime: ORACLE_SPOT_MAP_STALE_MS,
      retry: (failureCount, error) =>
        failureCount < 1 && shouldRetryOracleSpot(error),
    });
    return latest ? ([id, latest.spot] as const) : null;
  } catch {
    return null;
  }
}

async function fetchOracleSpotEntries(
  queryClient: QueryClient,
  oracleIds: readonly string[],
): Promise<Array<readonly [string, number] | null>> {
  const entries: Array<readonly [string, number] | null> = [];

  for (let start = 0; start < oracleIds.length; start += ORACLE_SPOT_FETCH_CONCURRENCY) {
    const chunk = oracleIds.slice(start, start + ORACLE_SPOT_FETCH_CONCURRENCY);
    const chunkEntries = await Promise.all(
      chunk.map((id) => fetchOracleSpotEntry(queryClient, id)),
    );
    entries.push(...chunkEntries);

    if (start + ORACLE_SPOT_FETCH_CONCURRENCY < oracleIds.length) {
      await new Promise((resolve) => setTimeout(resolve, ORACLE_SPOT_CHUNK_DELAY_MS));
    }
  }

  return entries;
}

export function useOracleSpotMap(oracleIds: readonly string[]) {
  const queryClient = useQueryClient();
  const uniqueIds = useMemo(
    () => [...new Set(oracleIds.filter(Boolean))].sort(),
    [oracleIds],
  );
  const key = uniqueIds.join(",");

  return useQuery({
    queryKey: ["predict-oracle-spots", key],
    queryFn: async () => {
      const entries = await fetchOracleSpotEntries(queryClient, uniqueIds);
      return new Map(
        entries.filter((entry): entry is readonly [string, number] => entry !== null),
      );
    },
    enabled: uniqueIds.length > 0,
    staleTime: ORACLE_SPOT_MAP_STALE_MS,
    refetchInterval: ORACLE_SPOT_MAP_STALE_MS,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => failureCount < 1 && shouldRetryOracleSpot(error),
  });
}
