import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, Calendar } from "lucide-react";
import type { NormalizedMarket } from "@/types/market-group";
import type { MarketGroup } from "@/types/market-group";
import { format } from "date-fns";
import { OutcomeRow } from "./OutcomeRow";
import { getVenueDisplayName } from "@/lib/venue-utils";

interface MarketComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binaryMarket?: NormalizedMarket;
  groupMarket?: MarketGroup;
}

export function MarketComparisonModal({
  open,
  onOpenChange,
  binaryMarket,
  groupMarket,
}: MarketComparisonModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Market Comparison</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Binary Market */}
          {binaryMarket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Binary Market</h3>
                <Badge variant="secondary">Single Outcome</Badge>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-4">
                <div className="flex gap-3">
                  {binaryMarket.imageUrl && (
                    <img
                      src={binaryMarket.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold line-clamp-2">{binaryMarket.title}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getVenueDisplayName(binaryMarket.venue)}
                      </Badge>
                      {binaryMarket.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(binaryMarket.endDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* YES/NO Outcomes */}
                <div className="space-y-2">
                  <div className="p-3 rounded-lg border bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">YES</span>
                      <span className="text-sm font-medium">
                        ${(binaryMarket.yesPrice / 100).toFixed(3)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success to-success/60"
                        style={{ width: `${binaryMarket.yesPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">NO</span>
                      <span className="text-sm font-medium">
                        ${(binaryMarket.noPrice / 100).toFixed(3)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-destructive to-destructive/60"
                        style={{ width: `${binaryMarket.noPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-semibold text-primary">
                    ${(binaryMarket.totalVolume / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Grouped Market */}
          {groupMarket && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Multi-Outcome Market</h3>
                <Badge>{groupMarket.outcomes.length} Outcomes</Badge>
              </div>

              <div className="p-4 rounded-lg border bg-card space-y-4">
                <div className="flex gap-3">
                  {groupMarket.imageUrl && (
                    <img
                      src={groupMarket.imageUrl}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold line-clamp-2">{groupMarket.question}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {getVenueDisplayName(groupMarket.outcomes[0]?.provider || 'MOLFI_NATIVE')}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(groupMarket.endDate), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Outcomes */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {groupMarket.outcomes.slice(0, 5).map((outcome, index) => (
                    <div key={outcome.outcomeId} className="p-3 rounded-lg border bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm truncate flex-1">
                          {outcome.label}
                        </span>
                        <span className="text-sm font-medium ml-2">
                          ${(outcome.yesPrice / 100).toFixed(3)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60"
                          style={{ width: `${outcome.impliedProbability}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {groupMarket.outcomes.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      +{groupMarket.outcomes.length - 5} more outcomes
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t text-sm">
                  <span className="text-muted-foreground">Total Volume</span>
                  <span className="font-semibold text-primary">
                    ${(groupMarket.totalVolume / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
