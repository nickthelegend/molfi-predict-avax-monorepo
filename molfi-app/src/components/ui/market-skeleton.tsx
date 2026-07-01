import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AssetBadge } from "@/components/AssetBadge";
import { LabelWithInfo } from "@/components/leverx/InfoPopover";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import { MARKET_TITLE_UP } from "@/lib/leverx/indexer-markets";
import { UnderlineTabs } from "@/components/leverx/UnderlineTabs";
import { ui } from "@/lib/copy";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { DATA_PLACEHOLDER } from "@/lib/leverx/placeholders";
import { TRADE_PREDICT_SIDES } from "@/lib/predict/instruments";
import { cn } from "@/lib/utils";
import {
  labelCaps,
  marketCard,
  marketCardActions,
  marketCardBody,
  marketCardHeader,
  marketCardMeta,
  marketCardSparklineFooter,
  marketsGrid,
  marketsTableSparklineBand,
  marketsRow,
  marketsTable,
  marketsTableDesktop,
  marketsTableMobileCard,
  marketsTableMobileCardHeader,
  marketsTableMobileCardStats,
  marketsTableMobileStack,
  marketsTableScroll,
  marketsTableShell,
  marketsTd,
  marketsTdHideLg,
  marketsTdHideMd,
  marketsTdHideSm,
  marketsTdMarket,
  marketsTdTrade,
  marketsTh,
  marketsThHideLg,
  marketsThHideMd,
  marketsThHideSm,
  marketsThMarket,
  marketsThTrade,
  dataTableMobileCard,
  dataTableMobileCardFooter,
  dataTableMobileCardHeader,
  dataTableMobileCardStats,
  dataTableMobileStack,
  dataTableMobileStatLabel,
  orderbookSideHeader,
  pageBlock,
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
  segTab,
  segTabsClass,
  segTabActive,
  segTabOutcome,
  textFilterActive,
  textFilterBtn,
  textFilterGroup,
  tradeLeveragePanel,
  tradeOracleNav,
  tradeOracleNavBtn,
  tradeOracleNavBtnDisabled,
  tradeStatItem,
  tradeStatItemLabel,
  tradeStatItemValue,
  tradeStatRow,
  tradeSurface,
  tradeTerminal,
  tradeTerminalBack,
  tradeTerminalBody,
  tradeTerminalChart,
  tradeTerminalHeader,
  tradeTerminalHeaderMetrics,
  tradeTerminalHeaderMetricsRow,
  tradeTerminalHeaderTop,
  tradeTerminalOrderbook,
  tradeTerminalPositions,
  tradeTerminalPositionsBody,
  tradeTerminalSidebar,
  tradeTerminalTabsRow,
  tradeTerminalWorkspace,
  tradeTerminalTitle,
  vaultAction,
  vaultChart,
  vaultWorkspace,
  btnTradeSignin,
} from "@/lib/leverx/tw";

const TRADE_POSITION_TABS = ["Comments", "Positions", "Open Orders", "Market trades", "Summary"] as const;

function SkeletonBar({ className }: { className?: string; }) {
  return <div className={cn("lx-skeleton", className)} />;
}

function SkeletonIcon({ className }: { className?: string; }) {
  return <SkeletonBar className={cn("h-6 w-6 shrink-0 rounded-md", className)} />;
}

function SkeletonActionsRow({ plain = false }: { plain?: boolean; }) {
  return (
    <div
      className={cn(
        "grid grid-cols-3",
        plain ? "gap-0" : "gap-1 overflow-hidden rounded-md border border-border bg-surface p-0",
      )}
    >
      <SkeletonBar
        className={cn("min-h-11 sm:h-8", plain ? "rounded-none" : "rounded-md")}
      />
      <SkeletonBar
        className={cn(
          "min-h-11 sm:h-8",
          plain ? "rounded-none border-l border-border/50" : "rounded-md",
        )}
      />
      <SkeletonBar
        className={cn(
          "min-h-11 sm:h-8",
          plain ? "rounded-none border-l border-border/50" : "rounded-md",
        )}
      />
    </div>
  );
}

function SkeletonPremiumQuote({
  band = false,
  compact = false,
}: {
  band?: boolean;
  compact?: boolean;
}) {
  if (band) {
    return (
      <div
        className={cn(
          compact ? marketsTableSparklineBand : marketCardSparklineFooter,
          "lx-skeleton lx-skeleton--band bg-surface/40",
        )}
      />
    );
  }

  return (
    <div className={cn("flex items-center", compact ? "gap-1" : "gap-1.5")}>
      <SkeletonBar className={cn("shrink-0", compact ? "h-5 w-16" : "h-5 w-[3.25rem]")} />
      <SkeletonBar className={cn(compact ? "h-5 w-[4.5rem]" : "h-4 w-10")} />
    </div>
  );
}

/** Shimmer placeholder for inline / band contract price cells. */
export function MarketPremiumQuoteSkeleton({
  band = false,
  compact = false,
  className,
}: {
  band?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <SkeletonPremiumQuote band={band} compact={compact} />
    </div>
  );
}

export function MarketCardSkeleton() {
  return (
    <article className={cn(marketCard, "pointer-events-none")} aria-hidden>
      <div className={marketCardBody}>
        <div className={marketCardHeader}>
          <SkeletonIcon />
          <div className="min-w-0 flex-1">
            <div className="space-y-1">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-5/6" />
            </div>
            <SkeletonBar className="mt-1 h-5 w-20" />
          </div>
          <SkeletonBar className="h-5 w-12 shrink-0 sm:h-6" />
        </div>

        <div className={marketCardActions}>
          <SkeletonActionsRow />
        </div>

        <div className={marketCardMeta}>
          <SkeletonBar className="h-3.5 w-28" />
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-3.5 w-14" />
            <SkeletonBar className="h-7 w-7 shrink-0 rounded-md" />
          </div>
        </div>
      </div>

      <SkeletonPremiumQuote band />
    </article>
  );
}

function MarketTableMobileCardSkeleton() {
  return (
    <article className={cn(marketsTableMobileCard, "pointer-events-none")} aria-hidden>
      <div className={marketsTableMobileCardHeader}>
        <SkeletonIcon />
        <SkeletonIcon />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBar className="h-2.5 w-full" />
          <SkeletonBar className="h-4 w-8" />
        </div>
        <SkeletonPremiumQuote compact />
      </div>

      <dl className={marketsTableMobileCardStats}>
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonBar className="h-2 w-12" />
            <SkeletonBar className="h-3.5 w-16" />
          </div>
        ))}
      </dl>

      <SkeletonActionsRow />
    </article>
  );
}

export function MarketGridSkeleton({ count = 8 }: { count?: number; }) {
  return (
    <div className={marketsGrid}>
      {Array.from({ length: count }, (_, i) => (
        <MarketCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function MarketsCatalogSkeleton({
  view = "grid",
  gridCount = 12,
  tableRows = 10,
}: {
  view?: "grid" | "list";
  gridCount?: number;
  tableRows?: number;
}) {
  return view === "list" ? (
    <MarketTableSkeleton rows={tableRows} />
  ) : (
    <MarketGridSkeleton count={gridCount} />
  );
}

type DataTableSkeletonColumn = {
  header: string;
  align?: "left" | "right";
  width?: string;
  mobileEmphasis?: boolean;
  mobileTrailing?: boolean;
  hideOnMobile?: boolean;
};

function DataTableMobileRowSkeleton({
  columns,
}: {
  columns: readonly DataTableSkeletonColumn[];
}) {
  const emphasis = columns.filter((c) => c.mobileEmphasis);
  const trailing = columns.filter((c) => c.mobileTrailing);
  const stats = columns.filter(
    (c) => !c.mobileEmphasis && !c.mobileTrailing && !c.hideOnMobile,
  );

  return (
    <article className={cn(dataTableMobileCard, "pointer-events-none")} aria-hidden>
      {(emphasis.length > 0 || trailing.length > 0) && (
        <div className={dataTableMobileCardHeader}>
          <div className="min-w-0 flex-1 space-y-1">
            {emphasis.length > 0 ? (
              <>
                <SkeletonBar className="h-4 w-32" />
                <SkeletonBar className="h-3 w-16" />
              </>
            ) : (
              <SkeletonBar className="h-4 w-24" />
            )}
          </div>
          {trailing.length > 0 ? (
            <SkeletonBar className="h-5 w-14 shrink-0" />
          ) : null}
        </div>
      )}
      {stats.length > 0 ? (
        <dl className={dataTableMobileCardStats}>
          {stats.map((col) => (
            <div
              key={col.header}
              className="flex min-w-0 items-baseline justify-between gap-3"
            >
              <span className={cn(dataTableMobileStatLabel, "shrink-0")}>
                <SkeletonBar className="h-3 w-12" />
              </span>
              <SkeletonBar className={cn("h-4 shrink-0", col.width ?? "w-14")} />
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}

export function DataTableSkeleton({
  columns,
  rows = 8,
}: {
  columns: readonly DataTableSkeletonColumn[];
  rows?: number;
}) {
  return (
    <>
      <div className="data-table-wrap hidden overflow-x-auto overscroll-x-contain lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    col.align === "right" && "text-right",
                  )}
                >
                  <SkeletonBar className="h-3 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col.header}
                    className={cn(
                      "px-4 py-3 align-middle",
                      col.align === "right" && "text-right",
                    )}
                  >
                    <SkeletonBar
                      className={cn(
                        "h-4",
                        col.align === "right" ? "ml-auto" : undefined,
                        col.width ?? "w-16",
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={dataTableMobileStack}>
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <DataTableMobileRowSkeleton key={i} columns={columns} />
        ))}
      </div>
    </>
  );
}

const POINTS_LEADERBOARD_COLUMNS: DataTableSkeletonColumn[] = [
  { header: "Rank", width: "w-10" },
  { header: "Trader", width: "w-28", mobileEmphasis: true },
  { header: "Volume", width: "w-16", align: "right" },
  { header: "Trades", width: "w-10", align: "right" },
  { header: "Points", width: "w-14", align: "right", mobileTrailing: true },
];

export function PointsLeaderboardSkeleton({ rows = 10 }: { rows?: number; }) {
  return <DataTableSkeleton columns={POINTS_LEADERBOARD_COLUMNS} rows={rows} />;
}

const LIMIT_ORDERS_COLUMNS: DataTableSkeletonColumn[] = [
  { header: "Market", width: "w-20", mobileEmphasis: true },
  { header: "Limit", width: "w-14", align: "right", mobileTrailing: true },
  { header: "Qty", width: "w-10", align: "right" },
  { header: "Margin", width: "w-14", align: "right" },
  { header: "Lev", width: "w-10", align: "right" },
  { header: "Expires", width: "w-20", align: "right" },
  { header: "Status", width: "w-12", align: "right" },
  { header: "Actions", width: "w-14", align: "right", hideOnMobile: true },
];

export function LimitOrdersTableSkeleton({ rows = 5 }: { rows?: number; }) {
  return <DataTableSkeleton columns={LIMIT_ORDERS_COLUMNS} rows={rows} />;
}

export function PortfolioSummaryBarSkeleton({ className }: { className?: string; }) {
  return (
    <div className={cn(tradeSurface, className)} aria-hidden>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-32" />
          <SkeletonBar className="h-4 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 divide-x divide-y divide-border lg:grid-cols-4 lg:divide-y-0">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="min-w-0 px-4 py-3.5">
            <SkeletonBar className="h-3 w-20" />
            <SkeletonBar className="mt-1 h-7 w-24 sm:h-8" />
            <SkeletonBar className="mt-1.5 h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PortfolioTabsSkeleton() {
  const tabs = ["Positions", "Orders", "Closed", "Account"] as const;
  return (
    <div
      className={cn(segTabsClass("stretch"), "pointer-events-none border-b border-border")}
      aria-hidden
    >
      {tabs.map((tab) => (
        <div key={tab} className={cn(segTab, "flex min-h-10 flex-1 items-center justify-center")}>
          <SkeletonBar className="h-4 w-16 sm:w-20" />
        </div>
      ))}
    </div>
  );
}

function PositionTableMobileCardSkeleton() {
  return (
    <article className={cn(dataTableMobileCard, "pointer-events-none")} aria-hidden>
      <div className={dataTableMobileCardHeader}>
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <SkeletonIcon />
          <div className="min-w-0 flex-1 space-y-1">
            <SkeletonBar className="h-4 w-16" />
            <SkeletonBar className="h-3 w-10" />
          </div>
        </div>
        <SkeletonBar className="h-5 w-14 shrink-0" />
      </div>
      <dl className={dataTableMobileCardStats}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex min-w-0 items-baseline justify-between gap-3">
            <SkeletonBar className="h-3 w-10" />
            <SkeletonBar className="h-4 w-14" />
          </div>
        ))}
      </dl>
      <div className={dataTableMobileCardFooter}>
        <SkeletonBar className="ml-auto h-8 w-20 rounded-md" />
      </div>
    </article>
  );
}

export function PositionsTableSkeleton({ rows = 5 }: { rows?: number; }) {
  const desktopCols = [
    { width: "w-28" },
    { width: "w-12" },
    { width: "w-16" },
    { width: "w-10", align: "right" as const },
    { width: "w-12", align: "right" as const },
    { width: "w-12", align: "right" as const },
    { width: "w-14", align: "right" as const },
    { width: "w-20", align: "right" as const },
    { width: "w-14", align: "right" as const },
    { width: "w-14", align: "right" as const },
    { width: "w-14", align: "right" as const },
  ];

  return (
    <>
      <div className="data-table-wrap hidden overflow-x-auto overscroll-x-contain lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground">
              {Array.from({ length: desktopCols.length }, (_, i) => (
                <th
                  key={i}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    desktopCols[i]?.align === "right" && "text-right",
                  )}
                >
                  <SkeletonBar className="h-3 w-12" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }, (_, rowIndex) => (
              <tr key={rowIndex}>
                {desktopCols.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={cn(
                      "px-4 py-3 align-middle",
                      col.align === "right" && "text-right",
                    )}
                  >
                    {colIndex === 0 ? (
                      <div className="flex items-center gap-2">
                        <SkeletonIcon className="h-5 w-5" />
                        <div className="space-y-1">
                          <SkeletonBar className="h-4 w-16" />
                          <SkeletonBar className="h-3 w-10" />
                        </div>
                      </div>
                    ) : (
                      <SkeletonBar
                        className={cn(
                          "h-4",
                          col.align === "right" ? "ml-auto" : undefined,
                          col.width,
                        )}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={dataTableMobileStack}>
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <PositionTableMobileCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

export function PortfolioWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <PortfolioTabsSkeleton />
      <PositionsTableSkeleton rows={5} />
    </div>
  );
}

export function PortfolioPageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <PortfolioSummaryBarSkeleton />
      <PortfolioWorkspaceSkeleton />
    </div>
  );
}

function VaultStatsSkeleton() {
  const stats = [
    { label: "TVL", info: leverxInfo.vaultTvl },
    { label: ui.vaultApr, info: leverxInfo.vaultApr },
    { label: "Util.", info: leverxInfo.vaultUtil },
  ] as const;

  return (
    <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm" aria-hidden>
      {stats.map(({ label, info }) => (
        <div key={label} className="flex gap-2">
          <dt className="text-muted-foreground">
            <LabelWithInfo label={label} info={info} />
          </dt>
          <dd>
            <SkeletonBar className="h-4 w-16" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function VaultChartSkeleton({ className }: { className?: string; }) {
  return (
    <div className={cn(tradeSurface, "flex flex-col overflow-hidden", className)} aria-hidden>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <span className={labelCaps}>{ui.vaultChartTitle}</span>
        <div className={pillToggleGroup} role="group" aria-label="Vault chart metric">
          <span className={cn(pillToggleBtn, pillToggleActive)}>{ui.vaultChartTvl}</span>
          <span className={cn(pillToggleBtn, pillToggleIdle)}>{ui.vaultChartApr}</span>
        </div>
      </div>
      <div
        className={cn(
          "lx-skeleton lx-skeleton--block h-[280px] min-h-[280px] w-full sm:h-[320px]",
        )}
      />
    </div>
  );
}

function VaultLiquidityPanelSkeleton({ className }: { className?: string; }) {
  return (
    <div className={cn(tradeLeveragePanel, className, "pointer-events-none")} aria-hidden>
      <div className="border-b border-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className={pillToggleGroup} role="group" aria-label="Vault action">
            <span className={cn(pillToggleBtn, pillToggleActive)}>Supply</span>
            <span className={cn(pillToggleBtn, pillToggleIdle)}>Withdraw</span>
          </div>
          <SkeletonBar className="h-4 w-4 rounded-sm" />
        </div>
      </div>

      <div className="space-y-4 p-3">
        <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-sm">
          <span className="text-muted-foreground">Pool size</span>
          <SkeletonBar className="h-4 w-24" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <LabelWithInfo label="Amount" labelClassName={labelCaps} info={leverxInfo.vaultAmount} />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              Bal.
              <SkeletonBar className="h-4 w-16" />
            </span>
          </div>
          <SkeletonBar className="h-12 w-full rounded-lg" />
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <SkeletonBar key={i} className="h-7 w-12 rounded-md" />
            ))}
          </div>
        </div>

        <SkeletonBar className={cn(btnTradeSignin, "h-11 w-full rounded-md border-0")} />
      </div>
    </div>
  );
}

/** Mirrors `/vault` (Pool) layout for route pending / loading. */
export function VaultPageSkeleton() {
  return (
    <div className="space-y-[var(--trade-gap)]" aria-hidden>
      <VaultStatsSkeleton />
      <div className={vaultWorkspace}>
        <VaultChartSkeleton className={vaultChart} />
        <VaultLiquidityPanelSkeleton className={vaultAction} />
      </div>
    </div>
  );
}

export function MarketTableSkeleton({ rows = 8 }: { rows?: number; }) {
  return (
    <div className={marketsTableShell}>
      <div className={marketsTableMobileStack}>
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <MarketTableMobileCardSkeleton key={i} />
        ))}
      </div>

      <div className={cn(marketsTableScroll, marketsTableDesktop)}>
        <table className={marketsTable} aria-hidden>
          <thead>
            <tr>
              <th className={cn(marketsTh, marketsThMarket)}>Market</th>
              <th className={marketsTh}>Asset price</th>
              <th className={cn(marketsTh, marketsThHideMd)}>Volume</th>
              <th className={cn(marketsTh, marketsThHideLg)}>Liquidity</th>
              <th className={cn(marketsTh, marketsThHideSm)}>Auto close</th>
              <th className={cn(marketsTh, marketsThTrade)} aria-label="Trade actions" />
            </tr>
          </thead>
          <tbody aria-hidden>
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i} className={marketsRow}>
                <td className={cn(marketsTd, marketsTdMarket)}>
                  <div className="flex items-start gap-2.5">
                    <SkeletonIcon />
                    <SkeletonIcon />
                    <div className="min-w-0 flex-1 space-y-2">
                      <SkeletonBar className="h-2.5 w-full max-w-xs" />
                      <SkeletonBar className="h-4 w-8" />
                    </div>
                  </div>
                </td>
                <td className={marketsTd}>
                  <SkeletonPremiumQuote compact />
                </td>
                <td className={cn(marketsTd, marketsTdHideMd)}>
                  <SkeletonBar className="h-3.5 w-14" />
                </td>
                <td className={cn(marketsTd, marketsTdHideLg)}>
                  <SkeletonBar className="h-3.5 w-14" />
                </td>
                <td className={cn(marketsTd, marketsTdHideSm)}>
                  <SkeletonBar className="h-3.5 w-20" />
                </td>
                <td className={cn(marketsTd, marketsTdTrade)}>
                  <SkeletonActionsRow />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SurfaceSkeleton({
  className,
  lines = 3,
  variant = "card",
  hideHeader = false,
}: {
  className?: string;
  lines?: number;
  /** `plain` when already inside a trade surface panel */
  variant?: "card" | "plain";
  /** Skip the top shimmer row when the parent already renders a real header. */
  hideHeader?: boolean;
}) {
  return (
    <div
      className={cn(
        pageBlock,
        "space-y-3",
        variant === "card" ? cn(tradeSurface, "p-4 sm:p-5") : "py-2",
        className,
      )}
      aria-hidden
    >
      {hideHeader ? null : (
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBar className="h-2.5 w-24" />
            <SkeletonBar className="h-2.5 w-40" />
          </div>
          <SkeletonBar className="h-2.5 w-20" />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBar className="h-2.5 w-16" />
            <SkeletonBar className="h-2.5 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TradeChartSkeleton() {
  return (
    <div className={tradeTerminalChart}>
      <div
        className={cn(
          tradeSurface,
          "lx-skeleton lx-skeleton--block h-[var(--trade-chart-h)] w-full",
        )}
      />
    </div>
  );
}

function TradeStatItem({
  label,
  value,
  info,
}: {
  label: string;
  value: string;
  info?: string;
}) {
  return (
    <div className={tradeStatItem}>
      {info ? (
        <LabelWithInfo label={label} labelClassName={tradeStatItemLabel} info={info} />
      ) : (
        <span className={tradeStatItemLabel}>{label}</span>
      )}
      <span className={tradeStatItemValue}>{value}</span>
    </div>
  );
}

function TradeTerminalHeaderShell({ oracleId }: { oracleId?: string; }) {
  const asset = oracleId?.slice(2, 6).toUpperCase() ?? "—";

  return (
    <header className={cn(tradeTerminalHeader, "trade-terminal-header")}>
      <div className={tradeTerminalHeaderTop}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AssetBadge asset={asset} size="md" />
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className={tradeTerminalTitle}>{MARKET_TITLE_UP}</h1>
            <Link to="/markets" className={tradeTerminalBack}>
              {ui.backToMarkets}
            </Link>
          </div>
        </div>
        <div className={tradeOracleNav} aria-label="Market navigation">
          <span className={cn(tradeOracleNavBtn, tradeOracleNavBtnDisabled)} aria-hidden>
            <ChevronLeft className="h-4 w-4" />
          </span>
          <span className={cn(tradeOracleNavBtn, tradeOracleNavBtnDisabled)} aria-hidden>
            <ChevronRight className="h-4 w-4" />
          </span>
        </div>
      </div>

      <div className={tradeTerminalHeaderMetrics}>
        <div className={tradeTerminalHeaderMetricsRow}>
          <div className={tradeStatRow}>
            <TradeStatItem
              label={ui.markPrice}
              info={leverxInfo.markPrice}
              value={DATA_PLACEHOLDER}
            />
            <TradeStatItem
              label="Contract price"
              info={leverxInfo.premium}
              value={DATA_PLACEHOLDER}
            />
            <TradeStatItem
              label="Volume (24h)"
              info={leverxInfo.volume24h}
              value={DATA_PLACEHOLDER}
            />
            <TradeStatItem label="Pool size" info={leverxInfo.vaultNav} value={DATA_PLACEHOLDER} />
            <TradeStatItem
              label="Closes"
              info={leverxInfo.autoClose}
              value={DATA_PLACEHOLDER}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function TradeOrderBookSkeleton() {
  return (
    <div className={tradeTerminalOrderbook}>
      <div className={cn(tradeSurface, "flex h-full min-h-[280px] flex-col pointer-events-none")}>
        <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
          <LabelWithInfo
            label="Order book"
            labelClassName={labelCaps}
            info={leverxInfo.orderBook}
          />
          <div className={pillToggleGroup} role="group" aria-label="Outcome">
            {TRADE_PREDICT_SIDES.map((option, index) => (
              <span
                key={option}
                className={cn(
                  pillToggleBtn,
                  index === 0 ? pillToggleActive : pillToggleIdle,
                )}
              >
                <PredictSideLabel side={option} noIcon />
              </span>
            ))}
          </div>
        </div>

        <div className={cn(orderbookSideHeader, "border-b border-border px-3 py-1.5")}>
          <span>Price</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Notional</span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <SkeletonBar className="h-3 w-12" />
              <SkeletonBar className="h-3 w-10" />
              <SkeletonBar className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TradeLeveragePanelSkeleton() {
  return (
    <div className={cn(tradeLeveragePanel, "trade-leverage-panel pointer-events-none")}>
      <div className="border-b border-border p-3">
        <div className={segTabsClass("stretch", "outcomes")} role="group" aria-label="Outcome">
          {TRADE_PREDICT_SIDES.map((outcome, index) => (
            <span
              key={outcome}
              className={cn(segTabOutcome, index === 0 && segTabActive)}
            >
              <PredictSideLabel side={outcome} />
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 border-b border-border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <LabelWithInfo
          label="Order type"
          labelClassName={labelCaps}
          info={leverxInfo.orderType}
        />
        <div className={pillToggleGroup} role="group" aria-label="Order type">
          <span className={cn(pillToggleBtn, pillToggleActive)}>market</span>
          <span className={cn(pillToggleBtn, pillToggleIdle)}>limit</span>
        </div>
      </div>
      <div className="space-y-5 p-4" aria-hidden>
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-14" />
          <SkeletonBar className="h-12 w-full rounded-lg" />
        </div>
        <div className="space-y-2">
          <SkeletonBar className="h-3 w-16" />
          <SkeletonBar className="h-2 w-full rounded-full" />
          <div className="flex justify-between gap-2">
            <SkeletonBar className="h-3 w-8" />
            <SkeletonBar className="h-3 w-8" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBar className="h-3 w-16" />
            <SkeletonBar className="h-4 w-4 rounded-sm" />
          </div>
        </div>
        <SkeletonBar className="h-20 w-full rounded-md" />
        <SkeletonBar className="h-11 w-full rounded-md" />
      </div>
    </div>
  );
}

function tradePositionTabLabel(tab: (typeof TRADE_POSITION_TABS)[number]) {
  if (tab === "Comments") {
    return <>Comments (…)</>;
  }
  if (tab === "Market trades") {
    return (
      <>
        <span className="sm:hidden">Trades (…)</span>
        <span className="hidden sm:inline">Market trades (…)</span>
      </>
    );
  }
  if (tab === "Open Orders") {
    return (
      <>
        <span className="sm:hidden">Orders (…)</span>
        <span className="hidden sm:inline">Open Orders (…)</span>
      </>
    );
  }
  if (tab === "Positions") {
    return (
      <>
        <span className="max-[380px]:hidden">Positions (…)</span>
        <span className="hidden max-[380px]:inline">Pos (…)</span>
      </>
    );
  }
  if (tab === "Summary") {
    return (
      <>
        <span className="max-[380px]:hidden">Summary</span>
        <span className="hidden max-[380px]:inline">Stats</span>
      </>
    );
  }
  return tab;
}

function TradePositionsSkeleton() {
  return (
    <div className={tradeTerminalPositions}>
      <div className={tradeTerminalTabsRow}>
        <UnderlineTabs
          variant="plain"
          className="min-w-0 flex-1 pointer-events-none"
          value="Positions"
          onValueChange={() => { }}
          options={TRADE_POSITION_TABS.map((tab) => ({
            value: tab,
            label: tradePositionTabLabel(tab),
          }))}
        />
        <div className={cn(textFilterGroup, "hidden sm:flex pointer-events-none")} role="group" aria-label="Position filter">
          <span className={cn(textFilterBtn, textFilterActive)}>Open</span>
          <span className={textFilterBtn}>Closed</span>
        </div>
      </div>
      <div className={tradeTerminalPositionsBody} aria-hidden>
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.6fr))] items-center gap-3"
            >
              <div className="flex items-center gap-2">
                <SkeletonIcon className="h-5 w-5" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBar className="h-2.5 w-full max-w-[10rem]" />
                  <SkeletonBar className="h-2 w-12" />
                </div>
              </div>
              <SkeletonBar className="h-3 w-full" />
              <SkeletonBar className="h-3 w-full" />
              <SkeletonBar className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors `PredictTradeTerminal` layout for route pending / loading. */
export function TradeTerminalSkeleton({ oracleId }: { oracleId?: string; } = {}) {
  return (
    <section className={cn(tradeTerminal, "trade-terminal")}>
      <TradeTerminalHeaderShell oracleId={oracleId} />

      <div className={cn(tradeTerminalBody, "pointer-events-none")} aria-hidden>
        <div className={cn(tradeTerminalWorkspace, "trade-terminal-workspace-desktop")}>
          <TradeChartSkeleton />
          <TradeOrderBookSkeleton />
          <div className={tradeTerminalSidebar}>
            <TradeLeveragePanelSkeleton />
          </div>
          <TradePositionsSkeleton />
        </div>
      </div>
    </section>
  );
}
