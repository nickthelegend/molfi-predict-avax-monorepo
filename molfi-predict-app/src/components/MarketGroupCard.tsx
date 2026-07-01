import { useState } from 'react';
import { Calendar, Maximize2 } from 'lucide-react';
import { getCategoryIcon } from '@/lib/category-icons';
import botIcon from '@/assets/bot-icon.png';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { OutcomeRow } from '@/components/OutcomeRow';
import { TradingModal } from '@/components/TradingModal';
import { MarketGroupModal } from '@/components/MarketGroupModal';
import { MarketAnalysisChat } from '@/components/MarketAnalysisChat';
import { useMarketGroupRealtime } from '@/hooks/useMarketGroupRealtime';
import type { MarketGroup, OutcomeSortField } from '@/types/market-group';
import { format } from 'date-fns';
import { getVenueDisplayName } from '@/lib/venue-utils';
import { motion } from 'framer-motion';

interface MarketGroupCardProps {
  group: MarketGroup;
  animationsEnabled?: boolean;
}

export function MarketGroupCard({ group, animationsEnabled = true }: MarketGroupCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<OutcomeSortField>('probability');
  const [selectedOutcome, setSelectedOutcome] = useState<{ marketId: string; label: string; side: 'yes' | 'no' } | null>(null);
  const [analysisChatOpen, setAnalysisChatOpen] = useState(false);

  // Mock WebSocket price updates
  const { getOutcomeUpdate } = useMarketGroupRealtime(group.groupId, group.outcomes, true);

  // Show top 2 outcomes in card
  const topOutcomes = group.outcomes.slice(0, 2);
  const remainingCount = group.outcomes.length - 2;

  const handleBuyYes = (marketId: string, label: string) => {
    setSelectedOutcome({ marketId, label, side: 'yes' });
  };

  const handleBuyNo = (marketId: string, label: string) => {
    setSelectedOutcome({ marketId, label, side: 'no' });
  };

  // Calculate average yes/no percentages for AI analysis
  const avgYesPercentage = group.outcomes.reduce((sum, o) => sum + o.yesPrice, 0) / group.outcomes.length;
  const avgNoPercentage = group.outcomes.reduce((sum, o) => sum + o.noPrice, 0) / group.outcomes.length;
  const formattedVolume = group.totalVolume >= 1000 
    ? `${(group.totalVolume / 1000).toFixed(1)}K` 
    : group.totalVolume.toFixed(2);

  return (
    <TooltipProvider>
      <>
        <Card className="overflow-hidden hover:shadow-lg transition-shadow p-6 flex flex-col h-full rounded-3xl border-2 border-border relative">
          {/* AI Bot Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setAnalysisChatOpen(true);
                }}
                whileHover={{ scale: 1.1, rotate: 10 }}
                whileTap={{ scale: 0.95 }}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-10 border border-primary/30"
              >
                <img src={botIcon} alt="AI Analysis" className="w-6 h-6 dark:invert" />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Get AI market analysis</p>
            </TooltipContent>
          </Tooltip>

          {/* Image and Title */}
          <div className="flex gap-3 mb-4 pr-12">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-primary/10 shadow-md">
              {group.imageUrl ? (
                <img src={group.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (() => {
                const Icon = getCategoryIcon(group.category, group.question);
                return (
                  <div className="w-full h-full flex items-center justify-center text-primary">
                    <Icon className="w-8 h-8" />
                  </div>
                );
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground line-clamp-2 text-lg">{group.question}</h3>
            </div>
          </div>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="secondary" className="text-xs font-semibold rounded-full px-3 py-1 shadow-sm">
            {getVenueDisplayName(group.outcomes[0]?.provider || 'MOLFI_NATIVE')}
          </Badge>
          <span className="text-xs text-muted-foreground">{group.outcomes.length} outcomes</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(group.endDate), 'MMM d')}
          </span>
        </div>

        {/* Top 3 Outcomes */}
        <div className="space-y-2 mb-4" role="listbox" aria-label="Top market outcomes">
          {topOutcomes.map((outcome, index) => {
            const priceUpdate = getOutcomeUpdate(outcome.outcomeId);
            const updatedOutcome = priceUpdate
              ? { ...outcome, yesPrice: priceUpdate.yesPrice, noPrice: priceUpdate.noPrice, impliedProbability: priceUpdate.impliedProbability }
              : outcome;

            return (
              <OutcomeRow
                key={outcome.outcomeId}
                outcome={updatedOutcome}
                onBuyYes={() => handleBuyYes(outcome.marketId, outcome.label)}
                onBuyNo={() => handleBuyNo(outcome.marketId, outcome.label)}
                priceChanged={priceUpdate?.direction || null}
                index={index}
              />
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-auto pt-4 border-t">
          <div className="font-semibold text-primary">
            ${(group.totalVolume / 1000).toFixed(1)}K vol
          </div>
          {remainingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={() => setShowModal(true)}
            >
              <Maximize2 className="w-3 h-3 mr-1" />
              +{remainingCount} more
            </Button>
          )}
        </div>
        </Card>

        {/* View All Modal */}
        <MarketGroupModal
          open={showModal}
          onOpenChange={setShowModal}
          group={group}
          searchQuery={searchQuery}
          sortField={sortField}
          onSearchChange={setSearchQuery}
          onSortChange={setSortField}
          onBuyYes={handleBuyYes}
          onBuyNo={handleBuyNo}
          getOutcomeUpdate={getOutcomeUpdate}
        />

        {/* Trading Modal */}
        {selectedOutcome && (
          <TradingModal
            open={!!selectedOutcome}
            onOpenChange={(open) => !open && setSelectedOutcome(null)}
            market={{
              id: selectedOutcome.marketId,
              title: group.question,
              outcomeLabel: selectedOutcome.label,
              yesPercentage: group.outcomes.find(o => o.marketId === selectedOutcome.marketId)?.yesPrice || 50,
              noPercentage: group.outcomes.find(o => o.marketId === selectedOutcome.marketId)?.noPrice || 50,
            }}
            preselectedSide={selectedOutcome.side}
          />
        )}

        {/* AI Analysis Chat */}
        <MarketAnalysisChat
          open={analysisChatOpen}
          onClose={() => setAnalysisChatOpen(false)}
          marketId={group.groupId}
          marketTitle={group.question}
          yesPercentage={Math.round(avgYesPercentage * 100)}
          noPercentage={Math.round(avgNoPercentage * 100)}
          volume={formattedVolume}
          outcomes={group.outcomes.map(o => ({
            label: o.label,
            yesPrice: o.yesPrice,
            noPrice: o.noPrice,
            marketId: o.marketId,
          }))}
        />
      </>
    </TooltipProvider>
  );
}
