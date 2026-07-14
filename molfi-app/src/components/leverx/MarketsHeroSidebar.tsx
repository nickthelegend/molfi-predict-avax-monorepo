import overflowBg from "@/assets/overflow.png";
import aiBannerBg from "@/assets/ai-banner.png";
import { MarketsHeroPromoCard } from "@/components/leverx/MarketsHeroPromoCard";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function MarketsHeroSidebar({ className }: Props) {
  return (
    <aside className={cn("markets-hero-sidebar", className)}>
      <MarketsHeroPromoCard
        badge="Live"
        imageSrc={overflowBg}
        title="Private predictions on Avalanche"
        description="Trade YES/NO outcomes on real-world events, settled on-chain by Solidity contracts."
        ctaLabel="Explore markets"
        to="/markets"
      />
      <MarketsHeroPromoCard
        badge="ZK"
        imageSrc={aiBannerBg}
        title="Your position stays private"
        description="Commitments and nullifiers keep your bets confidential, proven with zero-knowledge."
        ctaLabel="Learn how"
        to="/guide"
        layout="compact"
      />
    </aside>
  );
}
