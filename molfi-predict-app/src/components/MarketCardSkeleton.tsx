import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MarketCardSkeleton() {
  return (
    <Card className="overflow-hidden p-6 flex flex-col h-full rounded-3xl border-2 border-border">
      {/* Image and Title */}
      <div className="flex gap-3 mb-4">
        <Skeleton className="w-16 h-16 rounded-2xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Outcomes */}
      <div className="space-y-2 mb-4">
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-2 flex-1 rounded-full" />
            <Skeleton className="h-8 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-24" />
      </div>
    </Card>
  );
}
