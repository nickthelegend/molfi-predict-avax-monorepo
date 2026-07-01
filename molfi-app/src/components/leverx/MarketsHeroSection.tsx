import { useMemo } from "react";
import { MarketsHeroSidebar } from "@/components/leverx/MarketsHeroSidebar";
import { TopMarketsSwiper } from "@/components/leverx/TopMarketsSwiper";
import { useMolfiMarkets } from "@/hooks/useMolfiMarkets";
import { pickTopOracleMarkets } from "@/lib/leverx/top-oracle-markets";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function MarketsHeroSection({ className }: Props) {
  const { markets, loading } = useMolfiMarkets({ categoryId: "crypto" });
  const topMarkets = useMemo(() => pickTopOracleMarkets(markets), [markets]);

  return (
    <div className={cn("markets-hero-grid", className)}>
      <TopMarketsSwiper markets={topMarkets} loading={loading} />
      <MarketsHeroSidebar />
    </div>
  );
}
