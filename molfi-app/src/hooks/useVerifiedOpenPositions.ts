import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useOnChainPositionQuantities } from "@/hooks/useOnChainPositionQuantities";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import {
  isIndexerStaleOpenPosition,
} from "@/lib/leverx/position-action-availability";
import { positionIndexerStaleSuspect } from "@/lib/leverx/position-indexer-hints";
import { isActiveOpenPosition, positionRowId } from "@/lib/leverx/position-metrics";
import { invalidatePortfolioQueries } from "@/lib/leverx/invalidate-queries";

const INDEXER_CATCH_UP_DELAYS_MS = [2000, 6000, 12000] as const;

/** Open indexer rows cross-checked against on-chain manager contract counts. */
export function useVerifiedOpenPositions(positions: readonly LeveragedPosition[]) {
  const queryClient = useQueryClient();
  const indexerActive = useMemo(
    () => positions.filter(isActiveOpenPosition),
    [positions],
  );
  const { byPositionId, isVerifying } = useOnChainPositionQuantities(indexerActive);
  const scheduledCatchUp = useRef(false);

  const { activePositions, stalePositions, isAwaitingVerification } = useMemo(() => {
    const active: LeveragedPosition[] = [];
    const stale: LeveragedPosition[] = [];
    let awaitingVerification = false;

    for (const position of indexerActive) {
      const read = byPositionId.get(positionRowId(position));
      if (!read || read.isLoading || read.quantity === null) {
        if (positionIndexerStaleSuspect(position)) {
          stale.push(position);
          continue;
        }
        active.push(position);
        awaitingVerification = true;
        continue;
      }
      if (isIndexerStaleOpenPosition(position, read.quantity)) {
        stale.push(position);
        continue;
      }
      active.push(position);
    }

    return {
      activePositions: active,
      stalePositions: stale,
      isAwaitingVerification: awaitingVerification,
    };
  }, [indexerActive, byPositionId]);

  const positionIdsKey = useMemo(
    () => indexerActive.map((position) => positionRowId(position)).join("|"),
    [indexerActive],
  );

  useEffect(() => {
    scheduledCatchUp.current = false;
  }, [positionIdsKey]);

  useEffect(() => {
    if (stalePositions.length === 0 || scheduledCatchUp.current) return;
    scheduledCatchUp.current = true;
    for (const delayMs of INDEXER_CATCH_UP_DELAYS_MS) {
      globalThis.setTimeout(() => {
        void invalidatePortfolioQueries(queryClient);
      }, delayMs);
    }
  }, [stalePositions.length, queryClient]);

  return {
    activePositions,
    stalePositions,
    isVerifying,
    isAwaitingVerification,
    indexerOpenCount: indexerActive.length,
  };
}
