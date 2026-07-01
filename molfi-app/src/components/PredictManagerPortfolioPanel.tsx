import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SurfaceSkeleton } from "@/components/ui/market-skeleton";
import { LeverxPositionsTable } from "@/components/leverx/LeverxPositionsTable";
import { PortfolioIndexSyncNotice } from "@/components/leverx/PortfolioIndexSyncNotice";
import { usePositionsMarkToMarket } from "@/hooks/usePositionsMarkToMarket";
import { useVerifiedOpenPositions } from "@/hooks/useVerifiedOpenPositions";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { pageState } from "@/lib/leverx/tw";
import { ui } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface Props {
  positions: readonly LeveragedPosition[];
  owner?: string;
  isLoading?: boolean;
  className?: string;
}

export function PredictManagerPortfolioPanel({
  positions,
  owner,
  isLoading,
  className,
}: Props) {
  const {
    activePositions,
    stalePositions,
    indexerOpenCount,
  } = useVerifiedOpenPositions(positions);
  const { byPositionId, isRefreshing } = usePositionsMarkToMarket(activePositions);

  if (isLoading && indexerOpenCount === 0) {
    return <SurfaceSkeleton className={className} />;
  }

  if (activePositions.length === 0 && stalePositions.length === 0) {
    return (
      <div className={cn(pageState, "py-6", className)}>
        <EmptyState
          icon={Inbox}
          title={ui.emptyPositions}
          description={ui.emptyPositionsHint}
          compact
        />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <PortfolioIndexSyncNotice stalePositions={stalePositions} />
      {activePositions.length > 0 ? (
        <LeverxPositionsTable
          positions={activePositions}
          markToMarket={byPositionId}
          isRefreshing={isRefreshing}
          owner={owner}
        />
      ) : null}
    </div>
  );
}
