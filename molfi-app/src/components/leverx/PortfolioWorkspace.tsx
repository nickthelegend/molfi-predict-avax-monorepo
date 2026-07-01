import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox, Settings2, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PositionsTableSkeleton, LimitOrdersTableSkeleton } from "@/components/ui/market-skeleton";
import { UnderlineTabs } from "@/components/leverx/UnderlineTabs";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { LeverxLimitOrdersTable } from "@/components/leverx/LeverxLimitOrdersTable";
import { LeverxPositionsTable } from "@/components/leverx/LeverxPositionsTable";
import { PortfolioAccountPanel } from "@/components/leverx/PortfolioAccountPanel";
import type { LeveragedPosition, LimitMintOrder, UserProxy } from "@/lib/leverx/indexer-client";
import type { PositionMarkToMarket } from "@/lib/leverx/position-metrics";
import { PortfolioIndexSyncNotice } from "@/components/leverx/PortfolioIndexSyncNotice";
import { TradingPausedNotice } from "@/components/leverx/TradingPausedNotice";
import { useIndexerProtocol } from "@/hooks/useIndexer";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { ui } from "@/lib/copy";
import { cn } from "@/lib/utils";

const TABS = ["positions", "orders", "closed", "account"] as const;
type PortfolioTab = (typeof TABS)[number];

function tabLabel(
  tab: PortfolioTab,
  openCount: number,
  orderCount: number,
  closedCount: number,
) {
  if (tab === "positions") return `Positions (${openCount})`;
  if (tab === "orders") return `Orders (${orderCount})`;
  if (tab === "closed") return `Closed (${closedCount})`;
  return "Account";
}

function tabLabelMobile(
  tab: PortfolioTab,
  openCount: number,
  orderCount: number,
  closedCount: number,
) {
  if (tab === "positions") return `Pos (${openCount})`;
  if (tab === "orders") return `Ord (${orderCount})`;
  if (tab === "closed") return `Closed (${closedCount})`;
  return "Account";
}

interface Props {
  openPositions: readonly LeveragedPosition[];
  stalePositions?: readonly LeveragedPosition[];
  closedPositions: readonly LeveragedPosition[];
  limitOrders: readonly LimitMintOrder[];
  account: UserProxy | null;
  owner: string;
  loading?: boolean;
  markToMarket: Map<string, PositionMarkToMarket>;
  isRefreshing?: boolean;
  className?: string;
}

export function PortfolioWorkspace({
  openPositions,
  stalePositions = [],
  closedPositions,
  limitOrders,
  account,
  owner,
  loading,
  markToMarket,
  isRefreshing,
  className,
}: Props) {
  const [tab, setTab] = useState<PortfolioTab>("positions");
  const { data: protocol } = useIndexerProtocol();
  const byPositionId = markToMarket;
  const positionsTabCount = openPositions.length + stalePositions.length;

  const tabOptions = TABS.map((value) => ({
    value,
    label:
      value === "account" ? (
        <span className="inline-flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5" />
          Account
        </span>
      ) : (
        <>
          <span className="sm:hidden">
            {tabLabelMobile(
              value,
              positionsTabCount,
              limitOrders.length,
              closedPositions.length,
            )}
          </span>
          <span className="hidden sm:inline">
            {tabLabel(value, positionsTabCount, limitOrders.length, closedPositions.length)}
          </span>
        </>
      ),
  }));

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <UnderlineTabs
        value={tab}
        onValueChange={(v) => setTab(v as PortfolioTab)}
        options={tabOptions}
        listClassName="stretch-equal"
      />

      <div>
        {protocol?.trading_paused ? (
          <TradingPausedNotice className="mb-3" />
        ) : null}
        {tab === "positions" ? (
          loading && openPositions.length === 0 && stalePositions.length === 0 ? (
            <PositionsTableSkeleton rows={5} />
          ) : openPositions.length === 0 && stalePositions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={ui.emptyPositions}
              description={ui.emptyPositionsHint}
              compact
            />
          ) : (
            <div className="space-y-3">
              <PortfolioIndexSyncNotice
                stalePositions={stalePositions}
                onOpenAccount={() => setTab("account")}
              />
              {openPositions.length > 0 ? (
                <LeverxPositionsTable
                  positions={openPositions}
                  markToMarket={byPositionId}
                  isRefreshing={isRefreshing}
                  owner={owner}
                  showHeader={false}
                />
              ) : null}
            </div>
          )
        ) : null}

        {tab === "orders" ? (
          loading && limitOrders.length === 0 ? (
            <div className="space-y-3" aria-hidden>
              <div className="lx-skeleton h-4 w-36" />
              <LimitOrdersTableSkeleton rows={4} />
            </div>
          ) : limitOrders.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No open orders"
              description="Limit orders waiting for a match will appear here."
              compact
            />
          ) : (
            <div className="space-y-3">
              <LabelWithInfo
                label="Open limit orders"
                info={leverxInfo.openOrders}
                labelClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              />
              <LeverxLimitOrdersTable orders={limitOrders} />
            </div>
          )
        ) : null}

        {tab === "closed" ? (
          loading && closedPositions.length === 0 ? (
            <div className="space-y-3" aria-hidden>
              <div className="lx-skeleton h-4 w-36" />
              <PositionsTableSkeleton rows={4} />
            </div>
          ) : closedPositions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No closed trades"
              description="Closed and settled positions will appear here."
              compact
            />
          ) : (
            <div className="space-y-3">
              <LabelWithInfo
                label="Closed positions"
                info={leverxInfo.closedPositions}
                labelClassName="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
              />
              <LeverxPositionsTable
                positions={closedPositions}
                markToMarket={new Map()}
                showHeader={false}
                hideLiveMetrics
              />
            </div>
          )
        ) : null}

        {tab === "account" && account ? (
          <PortfolioAccountPanel
            account={account}
            owner={owner}
            positions={openPositions}
            allPositions={[...openPositions, ...closedPositions]}
          />
        ) : null}

        {tab === "account" && !account ? (
          <EmptyState
            icon={TrendingUp}
            title="No trading account yet"
            description="Your LeverX trading account and Predict manager are created automatically when you open your first trade."
            action={
              <Link
                to="/markets"
                className="inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
              >
                Browse markets
              </Link>
            }
            compact
          />
        ) : null}
      </div>
    </div>
  );
}
