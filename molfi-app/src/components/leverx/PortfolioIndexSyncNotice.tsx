import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { invalidatePortfolioQueries } from "@/lib/leverx/invalidate-queries";
import { cn } from "@/lib/utils";

interface Props {
  stalePositions: readonly LeveragedPosition[];
  className?: string;
  onOpenAccount?: () => void;
}

export function PortfolioIndexSyncNotice({
  stalePositions,
  className,
  onOpenAccount,
}: Props) {
  const queryClient = useQueryClient();

  if (stalePositions.length === 0) return null;

  const count = stalePositions.length;
  const title =
    count === 1
      ? "One portfolio row is out of sync with the chain"
      : `${count} portfolio rows are out of sync with the chain`;

  const refresh = () => {
    void invalidatePortfolioQueries(queryClient);
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
      role="status"
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 leading-relaxed">{leverxInfo.portfolioIndexStaleDetail}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={refresh}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Refresh portfolio
        </button>
        {onOpenAccount ? (
          <button
            type="button"
            onClick={onOpenAccount}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            Open Account tab
          </button>
        ) : null}
      </div>
    </div>
  );
}
