import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { AssetBadge } from "@/components/AssetBadge";
import { AnimatedMarketPremium } from "@/components/ui/animated-numbers";
import { MarketTradeLink } from "@/components/leverx/MarketTradeLink";
import type { LeverxMarketRow } from "@/lib/leverx/indexer-markets";
import { MarketTitle } from "@/components/leverx/MarketTitle";
import { ui } from "@/lib/copy";
import { MarketLeverageBadge } from "@/components/leverx/MarketLeverageBadge";
import { useNow } from "@/hooks/useNow";
import {
  btnIcon,
  featuredCarouselRow,
  featuredCarouselRowEmpty,
  heroPanel,
  livePulse,
} from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  markets: LeverxMarketRow[];
  loading?: boolean;
}

export function FeaturedCarousel({ markets, loading }: Props) {
  const [page, setPage] = useState(0);
  const now = useNow(1000);
  const perPage = 3;
  const pages = Math.max(1, Math.ceil(markets.length / perPage));
  const slice = markets.slice(page * perPage, page * perPage + perPage);
  const slots = Array.from({ length: perPage }, (_, i) => slice[i]);

  return (
    <div className={heroPanel}>
      <div className="mb-3 flex items-center gap-2">
        <span className={livePulse} aria-hidden />
        <span className="text-sm font-semibold">Live</span>
      </div>

      {loading ? (
        <div className="flex flex-1 flex-col justify-center">
          <LoadingState label={ui.loadingMarkets} compact />
        </div>
      ) : (
        <div className="flex-1 space-y-1">
          {slots.map((m, i) =>
            m ? (
              <MarketTradeLink
                key={m.id}
                market={m}
                className={cn(featuredCarouselRow, "transition-colors hover:bg-hover")}
              >
                <AssetBadge asset={m.asset} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <MarketTitle />
                  </p>
                  <p className="text-[10px] text-muted-foreground">DeepBook Predict</p>
                </div>
                <div className="shrink-0 text-right">
                  <MarketLeverageBadge expiryMs={m.expiry} now={now} className="mt-0" />
                  <AnimatedMarketPremium
                    premium={m.lastAskPremium}
                    quotePaused={m.quotePaused}
                    className="mt-0.5 text-sm font-semibold"
                  />
                </div>
              </MarketTradeLink>
            ) : (
              <div key={`empty-${i}`} className={featuredCarouselRowEmpty} />
            ),
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className={cn(btnIcon, "disabled:opacity-30")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            disabled={page >= pages - 1 || loading}
            className={cn(btnIcon, "disabled:opacity-30")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span className="font-mono text-sm text-muted-foreground">
          {loading ? "—/—" : `${page + 1}/${pages}`}
        </span>
      </div>
    </div>
  );
}
