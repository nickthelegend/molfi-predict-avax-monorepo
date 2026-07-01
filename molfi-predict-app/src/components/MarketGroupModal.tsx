import { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, Calendar } from 'lucide-react';
import { OutcomeRow } from '@/components/OutcomeRow';
import type { MarketGroup, OutcomeSortField } from '@/types/market-group';
import { format } from 'date-fns';

interface MarketGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: MarketGroup;
  searchQuery: string;
  sortField: OutcomeSortField;
  onSearchChange: (value: string) => void;
  onSortChange: (value: OutcomeSortField) => void;
  onBuyYes: (marketId: string, label: string) => void;
  onBuyNo: (marketId: string, label: string) => void;
  getOutcomeUpdate: (outcomeId: string) => any;
}

export function MarketGroupModal({
  open,
  onOpenChange,
  group,
  searchQuery,
  sortField,
  onSearchChange,
  onSortChange,
  onBuyYes,
  onBuyNo,
  getOutcomeUpdate,
}: MarketGroupModalProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const filteredAndSortedOutcomes = useMemo(() => {
    let filtered = group.outcomes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o => o.label.toLowerCase().includes(query));
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case 'alphabetical':
          return a.label.localeCompare(b.label);
        case 'liquidity':
          return (b.liquidity || 0) - (a.liquidity || 0);
        case 'volume':
          return (b.volume24h || 0) - (a.volume24h || 0);
        case 'probability':
        default:
          return b.impliedProbability - a.impliedProbability;
      }
    });

    return sorted;
  }, [group.outcomes, searchQuery, sortField]);

  const virtualizer = useVirtualizer({
    count: filteredAndSortedOutcomes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{group.question}</DialogTitle>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              ${(group.totalVolume / 1000).toFixed(1)}K vol
            </span>
            <span>•</span>
            <span>{group.outcomes.length} outcomes</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(group.endDate), 'MMM d, yyyy')}
            </span>
          </div>
        </DialogHeader>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search outcomes..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={sortField} onValueChange={(v) => onSortChange(v as OutcomeSortField)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="probability">Probability</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
              <SelectItem value="liquidity">Liquidity</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Virtualized Outcomes List */}
        <div
          ref={parentRef}
          className="flex-1 overflow-y-auto mt-4"
          role="listbox"
          aria-label="Market outcomes"
        >
          {filteredAndSortedOutcomes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No outcomes match your search</p>
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const outcome = filteredAndSortedOutcomes[virtualItem.index];
                const priceUpdate = getOutcomeUpdate(outcome.outcomeId);
                const updatedOutcome = priceUpdate
                  ? { ...outcome, yesPrice: priceUpdate.yesPrice, noPrice: priceUpdate.noPrice, impliedProbability: priceUpdate.impliedProbability }
                  : outcome;

                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div className="pb-2">
                      <OutcomeRow
                        outcome={updatedOutcome}
                        onBuyYes={() => onBuyYes(outcome.marketId, outcome.label)}
                        onBuyNo={() => onBuyNo(outcome.marketId, outcome.label)}
                        priceChanged={priceUpdate?.direction || null}
                        index={virtualItem.index}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
