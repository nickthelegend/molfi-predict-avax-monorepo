import { PositionActionsTrigger } from "@/components/leverx/PositionActionsModal";
import { CancelOrderTrigger } from "@/components/leverx/CancelOrderModal";
import type { LimitMintOrder, LeveragedPosition } from "@/lib/leverx/indexer-client";
import { positionShowsManageAction } from "@/lib/leverx/position-quantity";

interface CloseProps {
  position: LeveragedPosition;
  owner?: string;
  className?: string;
}

export function LeverxClosePositionButton({ position, className }: CloseProps) {
  if (!positionShowsManageAction(position)) return null;
  return <PositionActionsTrigger position={position} className={className} />;
}

interface CancelProps {
  order: LimitMintOrder;
  owner?: string;
  className?: string;
}

export function LeverxCancelOrderButton({ order, className }: CancelProps) {
  return <CancelOrderTrigger order={order} className={className} />;
}
