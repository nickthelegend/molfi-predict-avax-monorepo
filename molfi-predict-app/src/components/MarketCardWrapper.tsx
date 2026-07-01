import { MarketGroupCard } from '@/components/MarketGroupCard';
import { MinimalMarketCard } from '@/components/MinimalMarketCard';
import type { MarketOutcome } from '@/components/MinimalMarketCard';
import type { MarketItem } from '@/types/market-group';

interface MarketCardWrapperProps {
  item: MarketItem;
  animationsEnabled?: boolean;
}

export function MarketCardWrapper({ item, animationsEnabled = true }: MarketCardWrapperProps) {
  if (item.type === 'group') {
    return <MarketGroupCard group={item.group} animationsEnabled={animationsEnabled} />;
  }

  const m = item.market;

  const isMulti = m.marketType === 'multi_outcome' && m.outcomes && m.outcomes.length >= 2;
  const outcomes: MarketOutcome[] | undefined = isMulti ? m.outcomes : undefined;

  return (
    <MinimalMarketCard
      id={m.id}
      title={m.title}
      description={m.description}
      yesPercentage={m.yesPercentage}
      noPercentage={m.noPercentage}
      totalVolume={m.totalVolume}
      venue={m.venue}
      imageUrl={m.imageUrl}
      endDate={m.endDate}
      animationsEnabled={animationsEnabled}
      marketType={isMulti ? "multi_outcome" : "binary"}
      outcomes={outcomes}
    />
  );
}
