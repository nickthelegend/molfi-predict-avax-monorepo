import { Landmark } from "lucide-react";
import type { ReactNode } from "react";
import { SurfaceSkeleton } from "@/components/ui/market-skeleton";
import { ui } from "@/lib/copy";
import { AnimatedNumber, AnimatedPercent } from "@/components/ui/animated-numbers";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import type { PredictVaultSummary } from "@/lib/predict/types";
import { scaleQuote } from "@/lib/predict/scaling";
import { labelCaps, pageBlock, pageBlockRuled, statValue } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

interface Props {
  vault?: PredictVaultSummary;
  isLoading?: boolean;
  className?: string;
}

export function PredictVaultSummaryCard({ vault, isLoading, className }: Props) {
  if (isLoading && !vault) {
    return <SurfaceSkeleton className={className} lines={4} />;
  }

  if (!vault) return null;

  const vaultValue = scaleQuote(vault.vault_value);
  const available = scaleQuote(vault.available_liquidity);
  const sharePrice = vault.plp_share_price ?? 0;

  return (
    <div className={cn(pageBlock, pageBlockRuled, className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="h-4 w-4 text-accent" aria-hidden />
          <div>
            <p className={labelCaps}>{ui.predictVaultTitle}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{ui.predictVaultHint}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">{ui.predictVaultValue}</div>
          <div className={cn(statValue, "text-lg")}>
            <QuoteAmount amount={vaultValue} hideZero={false} />
          </div>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <VaultStat
          label={ui.predictVaultUtilization}
          value={<AnimatedPercent value={vault.utilization} />}
        />
        <VaultStat
          label={ui.predictVaultMaxPayoutUtil}
          value={<AnimatedPercent value={vault.max_payout_utilization} />}
        />
        <VaultStat
          label={ui.predictVaultAvailable}
          value={<QuoteAmount amount={available} hideZero={false} />}
        />
        <VaultStat
          label={ui.predictPlpSharePrice}
          value={
            sharePrice > 0 ? (
              <AnimatedNumber value={sharePrice} decimals={4} format={(v) => v.toFixed(4)} />
            ) : (
              "—"
            )
          }
        />
      </dl>
    </div>
  );
}

function VaultStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}
