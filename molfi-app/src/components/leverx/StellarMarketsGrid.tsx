import { BarChart3, ExternalLink, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketGridSkeleton } from "@/components/ui/market-skeleton";
import type { OnChainMarket } from "@/lib/stellar/soroban";
import {
  CONTRACTS,
  MARKET_STATUS,
  OUTCOME,
  contractUrl,
} from "@/lib/stellar/contracts";
import { marketCard, marketCardBody, marketsGrid, pageState } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  markets: OnChainMarket[];
  loading?: boolean;
  error?: string;
}

function statusBadge(m: OnChainMarket): { text: string; cls: string } {
  if (m.status === MARKET_STATUS.RESOLVED) {
    if (m.outcome === OUTCOME.YES)
      return { text: "Resolved · YES", cls: "bg-[var(--long-bg)] text-[var(--long-text)]" };
    if (m.outcome === OUTCOME.NO)
      return { text: "Resolved · NO", cls: "bg-[var(--short-bg)] text-[var(--short-text)]" };
    return { text: "Resolved · Invalid", cls: "bg-muted text-muted-foreground" };
  }
  if (m.status === MARKET_STATUS.RESOLVING)
    return { text: "Resolving", cls: "bg-warning/15 text-warning" };
  return { text: "Trading", cls: "bg-accent/15 text-accent" };
}

function formatClose(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StellarMarketsGrid({ markets, loading, error }: Props) {
  if (loading) return <MarketGridSkeleton />;

  if (error) {
    return (
      <div className={pageState}>
        <EmptyState
          icon={BarChart3}
          title="Couldn't reach Stellar"
          description={`On-chain read failed: ${error}`}
        />
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className={pageState}>
        <EmptyState
          icon={BarChart3}
          title="No markets on-chain yet"
          description="The market contract returned no markets on this network."
        />
      </div>
    );
  }

  return (
    <div className={marketsGrid}>
      {markets.map((m) => {
        const badge = statusBadge(m);
        return (
          <article key={m.id} className={marketCard}>
            <div className={cn(marketCardBody, "gap-3")}>
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    badge.cls,
                  )}
                >
                  {badge.text}
                </span>
                <span
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground"
                  title="Confidential positions via ZK privacy pool"
                >
                  <ShieldCheck className="h-3 w-3" />
                  Private
                </span>
              </div>

              <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground">
                {m.question}
              </p>

              <div className="mt-auto flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <span>Closes {formatClose(m.closeTs)}</span>
                <a
                  href={contractUrl(CONTRACTS.market)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-accent"
                >
                  Verify on-chain
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
