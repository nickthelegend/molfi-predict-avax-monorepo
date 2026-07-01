import { cn } from "@/lib/utils";

/** Uppercase field labels */
export const labelCaps =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground";

/** Small leverage multiplier pill */
export const leverageBadge =
  "inline-flex items-center rounded-sm border border-border bg-surface px-1.5 py-0.5 text-[0.5625rem] font-bold tracking-[0.06em] text-muted-foreground";

/** Bordered card surface (trade panels, charts) */
export const tradeSurface = cn(
  "overflow-hidden rounded-xl border border-border bg-card",
  "shadow-[0_1px_0_0_color-mix(in_oklab,white_4%,transparent)_inset,0_1px_2px_0_color-mix(in_oklab,black_16%,transparent)]",
  "light:shadow-[0_1px_0_0_white_inset,0_1px_2px_0_color-mix(in_oklab,black_6%,transparent),0_12px_28px_-20px_color-mix(in_oklab,black_18%,transparent)]",
);

/** Trade leverage panel — extends trade surface; height follows content only */
export const tradeLeveragePanel = cn(
  tradeSurface,
  "flex flex-col lg:h-auto lg:max-h-none lg:min-h-0",
);

/** Amount / limit price input wrapper */
export const tradeInputCard = cn(
  "rounded-lg border border-border bg-card px-3 py-3 sm:px-5 sm:py-4",
  "outline-none ring-0 focus-within:outline-none focus-within:ring-0 focus-within:shadow-none",
  "[&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none",
  "[&_input]:outline-none [&_input]:ring-0 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-0",
);

/** Input nested inside a bordered field shell — no inner border or focus ring */
export const inputInField = cn(
  "h-auto min-h-0 flex-1 border-0 bg-transparent p-0 font-mono tabular-nums shadow-none",
  "outline-none ring-0 focus-visible:outline-none focus-visible:ring-0",
);

/** Joined segmented control container */
export const segTabs = cn(
  "inline-flex max-w-full items-stretch gap-0 overflow-hidden rounded-sm border border-border bg-surface p-0",
  "[&>*+*]:border-l [&>*+*]:border-border",
);

export const segTabsStretch = cn(
  "flex w-full",
  "max-sm:max-w-full max-sm:overflow-x-auto max-sm:overscroll-x-contain",
  "max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden",
  "max-sm:[&>*]:shrink-0 max-sm:[&>*]:flex-none",
  "sm:[&>*]:min-w-0 sm:[&>*]:flex-1",
);

/** Equal-width tabs at every breakpoint (portfolio, outcomes). */
export const segTabsEqualStretch = cn(
  "flex w-full max-w-none",
  "[&>*]:min-w-0 [&>*]:flex-1 [&>*]:justify-center",
);

/** UP/DOWN (and RANGE) outcome row — equal-width tabs at every breakpoint */
export const segTabsOutcomesStretch = cn("flex w-full max-w-none", "[&>*]:min-w-0 [&>*]:flex-1");

export const segTabsScroll = cn(
  "overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
);

export const segTabsIcon =
  "[&>*]:min-h-11 [&>*]:min-w-11 [&>*]:p-2.5 sm:[&>*]:min-h-8 sm:[&>*]:min-w-8 sm:[&>*]:p-[0.4375rem]";

export const segTabsPlain =
  "inline-flex items-stretch gap-1 overflow-visible border-0 bg-transparent p-0 [&>*+*]:border-0";

/** Individual segmented tab */
export const segTab = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5",
  "rounded-none border-0 bg-transparent",
  "px-3.5 py-[0.4375rem] text-sm font-medium leading-[1.2] text-muted-foreground whitespace-nowrap",
  "transition-[background-color,color] duration-150",
  "hover:bg-hover/55 hover:text-foreground",
  "sm:px-4 sm:py-2 sm:text-sm",
);

export const segTabActive = "bg-hover font-semibold text-foreground";

export const segTabPlain = cn(
  segTab,
  "rounded-sm px-2.5 py-1.5",
  "data-[state=active]:rounded-none data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground",
  "data-[state=active]:shadow-[inset_0_-2px_0_var(--color-accent)]",
);

export const segTabRangeActive =
  "!bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-hover))] !font-semibold !text-accent";

/** Outcome tabs in trade terminal header */
export const segTabOutcome = cn(
  segTab,
  "text-sm font-bold tracking-[0.04em] no-underline sm:text-sm",
);

export const sideToggleLongActive = "bg-[var(--long-bg)] font-semibold text-[var(--long-text)]";
export const sideToggleShortActive = "bg-[var(--short-bg)] font-semibold text-[var(--short-text)]";

/** Filled chevron paired with UP / DOWN labels. */
export const predictSideChevron = "size-3 shrink-0 fill-current stroke-current stroke-[2.5]";

export function segTabsClass(
  ...variants: ("stretch" | "stretch-equal" | "scroll" | "icon" | "plain" | "outcomes")[]
) {
  const outcomes = variants.includes("outcomes");
  const equalStretch = variants.includes("stretch-equal");
  const stretch = variants.includes("stretch") || equalStretch;
  return cn(
    variants.includes("plain") ? segTabsPlain : segTabs,
    stretch &&
      (outcomes ? segTabsOutcomesStretch : equalStretch ? segTabsEqualStretch : segTabsStretch),
    variants.includes("scroll") && !equalStretch && segTabsScroll,
    variants.includes("icon") && segTabsIcon,
    outcomes && !stretch && "max-w-none w-full",
  );
}

/** Centered empty / loading state region */
export const pageState =
  "flex min-h-[min(var(--markets-catalog-h),70vh)] flex-1 items-center justify-center [&_.lx-empty]:w-full [&_.lx-empty]:max-w-md";

/** Simple page layout */
export const pageSimple = "flex w-full flex-1 flex-col gap-3 min-h-0 sm:gap-4";

/** Fills SiteShell main so short pages keep the footer at the bottom */
export const pageShellContent = "page-shell-content flex min-h-0 flex-1 flex-col w-full";

export const pageSimpleToolbar =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

export const pageSimpleTitle =
  "min-w-0 text-lg font-semibold tracking-tight sm:text-xl [overflow-wrap:anywhere]";

export const pageSimpleActions = "flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2";

export const vaultWorkspace = cn(
  "grid gap-[var(--trade-gap)]",
  "md:grid-cols-[minmax(0,1fr)_var(--trade-sidebar-w)] md:items-start",
);

export const vaultChart = "min-w-0";

export const vaultAction = "min-w-0 md:self-start";

/** Flat page section with optional top rule */
export const pageBlock = "flex flex-col gap-4";

export const pageBlockRuled = "border-t border-border pt-6";

export const statTile = "py-2";

export const statValue =
  "font-mono text-2xl font-bold tracking-tight tabular-nums text-foreground sm:text-3xl";

/** Soft pill toggle — secondary choices without bordered seg-tab chrome */
export const pillToggleGroup =
  "inline-flex shrink-0 items-center gap-0.5 rounded-md bg-surface p-0.5";

export const pillToggleBtn = "rounded px-2.5 py-1 text-sm font-medium capitalize transition-colors";

/** Pill action with leading/trailing icon — row layout */
export const pillIconBtn = cn(
  pillToggleBtn,
  "inline-flex items-center justify-center gap-1.5 normal-case",
);

export const pillToggleActive = "bg-card font-semibold text-foreground shadow-sm";

export const pillToggleIdle = "text-muted-foreground hover:text-foreground";

/** Text filter links — tertiary toggles beside underline tabs */
export const textFilterGroup = "flex shrink-0 flex-wrap items-center gap-2 sm:gap-3";

export const textFilterBtn =
  "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

export const textFilterActive =
  "font-semibold text-foreground underline decoration-accent decoration-2 underline-offset-4";

/** Count pill inside tabs */
export const pillCount = "rounded-full bg-background px-2 py-0.5 text-sm font-semibold text-accent";

/** Markets grid responsive columns */
export const marketsGrid =
  "grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4";

/** Market card shell */
export const marketCard = cn(
  "group relative flex w-full min-h-[11.5rem] cursor-pointer flex-col overflow-hidden",
  "rounded-xl border border-border",
  "bg-gradient-to-b from-[color-mix(in_oklab,var(--color-card)_92%,white_8%)] to-card",
  "shadow-[0_1px_0_0_color-mix(in_oklab,white_5%,transparent)_inset,0_2px_6px_-3px_color-mix(in_oklab,black_22%,transparent)]",
  "transition-[border-color,box-shadow,transform,background-color] duration-220",
  "hover:border-border-strong hover:bg-[color-mix(in_oklab,var(--color-hover)_35%,var(--color-card))]",
  "has-[a.market-card-overlay:hover]:bg-[color-mix(in_oklab,var(--color-hover)_35%,var(--color-card))]",
);

export const marketCardOverlay = cn(
  "market-card-overlay pointer-events-none absolute inset-0 z-[1] rounded-[inherit] no-underline",
  "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
);

export const marketCardBody =
  "pointer-events-none relative z-0 flex min-h-0 flex-1 flex-col gap-3 p-4";

export const marketCardInteractive = "pointer-events-auto relative z-[2]";

export const marketCardHeader = "flex items-start gap-2";

export const marketCardPrice = "ml-auto text-right";

export const marketCardPriceValue = "font-mono text-sm font-semibold tabular-nums sm:text-lg";

export const marketCardActions = cn(marketCardInteractive, "market-card-interactive w-full");

export const marketCardActionsFooter = cn(
  marketCardInteractive,
  "market-card-interactive mt-auto w-full -mx-4 -mb-4 border-t border-border/50 px-4 pb-4 pt-3",
);

export const marketCardAction = cn(
  "flex h-8 items-center justify-center rounded-md border border-border bg-surface",
  "text-sm font-bold tracking-[0.04em] text-muted-foreground",
  "transition-[border-color,color,background-color] duration-150",
  "hover:border-border-strong hover:bg-hover hover:text-foreground",
);

export const marketCardActionLong =
  "hover:border-[color-mix(in_oklab,var(--color-success)_40%,var(--color-border))] hover:text-success";

export const marketCardActionShort =
  "hover:border-[color-mix(in_oklab,var(--color-destructive)_40%,var(--color-border))] hover:text-destructive";

/** Joined UP / DOWN / RANGE action group — shared across grid and table */
export const marketSideActions = cn(
  "inline-flex overflow-hidden rounded-md border border-border bg-surface",
);

export const marketSideActionsPlain = cn(
  "flex w-full overflow-hidden rounded-none border-0 bg-transparent",
);

export const marketSideActionsStretch = "[&>*]:min-w-0 [&>*]:flex-1";

export const marketSideAction = cn(
  "relative z-[2] inline-flex min-h-11 cursor-pointer items-center justify-center px-3 no-underline sm:min-h-8 sm:h-8 sm:px-2.5",
  "pointer-events-auto border-l border-border first:border-l-0",
  "text-sm font-bold tracking-wide text-muted-foreground",
  "transition-[color,background-color] duration-150",
);

export const marketSideActionUp = "hover:bg-[var(--long-bg)] hover:text-[var(--long-text)]";

export const marketSideActionDown = "hover:bg-[var(--short-bg)] hover:text-[var(--short-text)]";

export const marketSideActionRange =
  "hover:bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-hover))] hover:text-accent";

export const marketCardMeta = "flex items-center justify-between text-sm text-muted-foreground";

export const marketCardSparkline =
  "pointer-events-none relative z-0 h-8 bg-[color-mix(in_oklab,var(--color-surface)_50%,transparent)]";

export const marketCardSparklineFooter =
  "pointer-events-none relative z-0 mt-auto flex h-8 w-full min-w-0 shrink-0 overflow-hidden bg-transparent [&_.markets-sparkline]:block [&_.markets-sparkline]:h-full [&_.markets-sparkline]:w-full";

export const marketsTableSparklineBand =
  "pointer-events-none relative z-0 h-3 w-full min-w-0 shrink-0 overflow-hidden bg-[color-mix(in_oklab,var(--color-surface)_50%,transparent)] [&_.markets-sparkline]:block [&_.markets-sparkline]:h-full [&_.markets-sparkline]:w-full";

/** Trade terminal layout */
export const tradeTerminal = "trade-terminal flex w-full flex-1 flex-col min-h-0";

export const tradeTerminalHeader = "flex flex-col gap-2 pb-2 sm:gap-3 sm:pb-3";

export const tradeTerminalHeaderTop =
  "flex min-w-0 w-full items-start justify-between gap-2 sm:gap-3";

export const tradeTerminalHeaderMetrics = cn(
  "md:grid md:grid-cols-[minmax(0,1fr)_minmax(180px,var(--trade-orderbook-w))] md:gap-[var(--trade-gap)]",
  "lg:grid-cols-[minmax(0,1fr)_var(--trade-orderbook-w)_var(--trade-sidebar-w)]",
);

export const tradeTerminalTitle =
  "text-sm font-semibold leading-snug [overflow-wrap:anywhere] sm:text-sm md:text-lg";

export const tradeTerminalBack = cn(
  "mt-1 inline-block text-sm text-muted-foreground transition-colors duration-150",
  "hover:text-accent",
);

export const tradeOracleNav = "flex shrink-0 items-center gap-0.5";

export const tradeOracleNavBtn = cn(
  "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface sm:h-8 sm:w-8",
  "text-muted-foreground transition-colors duration-150",
  "hover:bg-hover hover:text-foreground",
);

export const tradeOracleNavBtnDisabled = cn(
  "pointer-events-none opacity-35 hover:bg-surface hover:text-muted-foreground",
);

export const tradeStatRow = cn(
  "trade-stat-row grid grid-cols-2 gap-x-3 gap-y-2",
  "sm:grid-cols-3 sm:gap-x-6",
  "md:grid-cols-5 md:gap-x-4",
  "lg:col-start-1 lg:grid-cols-3 lg:gap-x-4",
  "xl:grid-cols-5",
  "lg:min-w-0 lg:flex-1",
);

export const tradeStatItem = "trade-stat-item flex min-w-0 flex-col gap-0.5";

export const tradeStatItemLabel = "text-sm text-muted-foreground";

export const tradeStatItemValue =
  "font-mono text-sm font-medium tabular-nums text-foreground sm:text-sm";

export const leverageCountdown = cn(
  "flex w-full min-w-0 flex-col gap-1 rounded-lg border border-border bg-surface/80 px-3 py-2",
  "sm:min-w-[11rem] sm:px-4 sm:py-2.5",
  "lg:w-auto lg:shrink-0",
);

export const leverageCountdownTime =
  "font-mono text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-lg";

export const tradeTerminalHeaderMetricsRow = cn(
  "flex min-w-0 flex-col gap-3",
  "md:col-span-2",
  "lg:col-span-1 lg:flex-row lg:items-stretch lg:justify-between lg:gap-4",
);

export const tradeTerminalBody = "flex flex-col gap-[var(--trade-gap)]";

export const tradeTerminalWorkspace = cn(
  "trade-terminal-workspace flex min-w-0 flex-col gap-[var(--trade-gap)]",
  "md:grid md:grid-cols-2 md:items-start",
  "lg:grid-cols-[minmax(0,1fr)_var(--trade-orderbook-w)_var(--trade-sidebar-w)]",
  "lg:grid-rows-[var(--trade-chart-h)_auto]",
);

export const tradeTerminalChart = cn(
  "trade-terminal-chart order-0 flex min-h-0 min-w-0 flex-col",
  "min-h-[var(--trade-chart-h)] md:col-start-1 md:row-start-1",
  "lg:h-[var(--trade-chart-h)] lg:max-h-[var(--trade-chart-h)]",
);

export const tradeTerminalOrderbook = cn(
  "trade-terminal-orderbook order-1 min-w-0 min-h-[240px] sm:min-h-[280px]",
  "md:col-start-2 md:row-start-1 md:min-h-[var(--trade-chart-h)]",
  "lg:h-[var(--trade-chart-h)] lg:max-h-[var(--trade-chart-h)]",
);

export const tradeTerminalSidebar = cn(
  "trade-terminal-sidebar order-2 flex min-w-0 w-full flex-col gap-3",
  "md:col-span-2 md:row-start-2",
  "lg:order-none lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:w-[var(--trade-sidebar-w)] lg:self-start",
  "lg:sticky lg:top-[calc(var(--site-header-h)+var(--trade-gap))] lg:z-[1]",
);

export const tradeTerminalPositions = cn(
  "trade-terminal-positions order-3 flex min-w-0 flex-col gap-4",
  "md:col-span-2 md:row-start-3",
  "lg:col-span-2 lg:col-start-1 lg:row-start-2",
);

export const tradeTerminalTabsRow = cn(
  "trade-terminal-tabs-row flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-between sm:gap-3",
);

export const tradeTerminalPositionsBody = cn(
  "trade-terminal-positions-body min-h-[var(--trade-positions-body-min-h)] text-sm text-muted-foreground",
);

/** Mobile predictions workspace switcher (Trade vs Chart) — portaled to body; z-40 stays below modals (z-50+). */
export const tradeMobileDock = cn(
  "trade-mobile-dock fixed inset-x-0 z-40 flex justify-center md:hidden",
  "bottom-[calc(50px+0.625rem+env(safe-area-inset-bottom,0px))]",
  "pointer-events-none",
);

export const tradeMobileDockTabs = cn(
  "pointer-events-auto inline-flex items-center gap-0 rounded-full border border-border overflow-hidden",
  "bg-card/95 p-0.5 shadow-lg backdrop-blur-md",
);

export const tradeMobileDockTab = cn(
  "inline-flex min-w-[3.25rem] items-center justify-center rounded-full px-3 py-1.5",
  "text-sm font-medium text-muted-foreground transition-colors duration-150",
  "hover:text-foreground",
);

export const tradeMobileDockTabActive = "bg-hover font-semibold text-foreground";

export const tradeTerminalMobileBody =
  "max-md:pb-[calc(50px+3.25rem+env(safe-area-inset-bottom,0px))]";

export const tradeTerminalMobileChartPanel = "trade-terminal-mobile-chart flex flex-col";

export const tradeSummaryGrid = "grid w-full grid-cols-2 gap-3 sm:grid-cols-4";

/** Leverage picker */
export const leveragePickerHeader = "mb-2 flex items-center justify-between gap-2";

export const leveragePickerValue = "font-mono text-base font-bold tabular-nums text-accent";

export const leveragePickerTab = "px-1 py-1.5 font-mono text-sm tabular-nums";

/** TP/SL block */
export const tpSlBlock = "flex flex-col gap-2.5";

export const tpSlHeader = "flex items-center justify-between gap-3";

export const tpSlFields = "flex flex-col gap-2";

export const tpSlRow = cn(
  "flex items-center gap-2 rounded-sm border border-border bg-surface",
  "py-0.5 pl-2.5 pr-0.5",
  "[&_input]:border-0 [&_input]:bg-transparent [&_input]:shadow-none",
  "[&_input]:outline-none [&_input]:ring-0 [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-0",
);

export const tpSlLabel = "w-6 shrink-0 text-sm font-bold tracking-wide text-muted-foreground";

export const tpSlInput = cn(inputInField, "py-1.5 font-mono text-sm");

export const tpSlUnit = cn(
  "h-7 w-auto min-w-0 shrink-0 rounded-none rounded-r-sm border-0 border-l border-border bg-card px-2 text-sm shadow-none",
);

/** Trade sign-in CTA */
export const btnTradeSignin = cn(
  "!h-[var(--btn-action-h)] w-full rounded-lg text-[0.9375rem] font-bold",
  "bg-[var(--trade-signin)] text-white hover:bg-[var(--trade-signin-hover)] hover:brightness-100",
);

/** Trade submit CTA tinted by outcome (UP / DOWN / RANGE). */
export function tradeCtaClass(side: "up" | "down" | "range"): string {
  return cn(
    btnTradeSignin,
    side === "up" && "!bg-success !text-white hover:!bg-[#2dd4a8] hover:brightness-100",
    side === "down" &&
      "!bg-destructive !text-destructive-foreground hover:!bg-destructive/90 hover:brightness-100",
    side === "range" && "!bg-accent !text-white hover:opacity-90 hover:brightness-100",
  );
}

/** Secondary landing-style link button */
export const landingCtaSecondary = cn(
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong",
  "bg-transparent px-4 py-2 text-sm font-medium text-foreground",
  "transition-[border-color,background-color] duration-150",
  "hover:border-foreground hover:bg-hover",
);

/** Order book */
export const orderbookSideHeader = cn(
  "grid shrink-0 grid-cols-3 gap-1 px-2 pb-1.5",
  "text-sm font-medium uppercase tracking-wider text-muted-foreground",
);

export const orderbookRow = "relative grid grid-cols-3 gap-1 px-2 py-0.5";

export const orderbookRowDepth = "pointer-events-none absolute inset-y-0";

export const orderbookMid = cn("flex shrink-0 items-center justify-center gap-3 py-2.5 text-sm");

export const orderbookStack = "flex min-h-0 flex-1 flex-col";

export const orderbookStackSection = "flex min-h-0 flex-1 flex-col";

export const orderbookStackRows = "flex min-h-0 flex-1 flex-col overflow-y-auto";

export const orderbookSentiment = "flex h-1 overflow-hidden rounded-full";

export const orderbookSentimentLabels = "mt-1.5 flex justify-between text-sm text-muted-foreground";

/** Markets table */
export const marketsTableShell =
  "flex min-h-0 flex-col gap-3 overflow-hidden lg:min-h-[var(--markets-catalog-h)]";

export const marketsTableScroll = "min-h-0 flex-1 overflow-x-auto overscroll-x-contain";

export const marketsTable =
  "w-full min-w-[40rem] border-separate border-spacing-0 text-sm lg:min-w-[52rem]";

/** Connected mobile stack — one outer radius; rows share divider lines, no gaps. */
export const dataTableMobileStack = cn(
  tradeSurface,
  "flex flex-col divide-y divide-border lg:hidden",
);

export const marketsTableMobileStack = dataTableMobileStack;

/** @deprecated Use dataTableMobileStack — kept for imports that wrap the stack container. */
export const marketsTableMobileList = dataTableMobileStack;

export const marketsTableMobileCard = "flex flex-col gap-3 bg-card p-4";

export const marketsTableMobileCardHeader =
  "flex items-start justify-between gap-3 border-b border-border pb-3";

export const marketsTableMobileCardStats = "grid grid-cols-2 gap-x-3 gap-y-2.5";

export const marketsTableMobileStatLabel =
  "text-[10px] font-medium uppercase tracking-wider text-muted-foreground";

export const marketsTableMobileStatValue = "text-sm text-foreground";

/** Shared mobile list cards (DataTable, markets, portfolio). */
export const dataTableMobileList = dataTableMobileStack;

export const dataTableMobileCard = marketsTableMobileCard;

export const dataTableMobileCardHeader = marketsTableMobileCardHeader;

export const dataTableMobileCardStats = "flex flex-col gap-2";

export const dataTableMobileStatLabel = marketsTableMobileStatLabel;

export const dataTableMobileCardFooter = "flex flex-col gap-2 border-t border-border pt-3";

/** Nested list rows inside settings panels — cards on mobile, compact rows on desktop. */
export const settingsList = "space-y-3 lg:space-y-0 lg:divide-y lg:divide-border/60";

export const settingsListItem = cn(
  tradeSurface,
  "flex flex-col gap-3 p-4",
  "lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:py-2 lg:shadow-none lg:first:pt-0 lg:last:pb-0",
);

export const settingsListItemHeader = cn(dataTableMobileCardHeader, "lg:border-0 lg:pb-0");

export const marketsTableDesktop = "hidden lg:block";

export const marketsTh = cn(
  "border-b border-border bg-[color-mix(in_oklab,var(--color-surface)_65%,var(--color-card))]",
  "px-4 py-3 text-left align-middle whitespace-nowrap",
);

export const marketsThBtn = cn(
  "inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0",
  "text-sm font-semibold uppercase tracking-wider text-muted-foreground",
  "transition-colors duration-150 hover:text-foreground",
);

export const marketsRow = cn(
  "border-b border-border transition-colors duration-150 last:border-b-0",
  "hover:bg-hover/70",
);

export const marketsTd = "px-4 py-3 align-middle";

export const marketsTdMarket = "max-w-md";

export const marketsTdMono = "font-mono tabular-nums text-foreground";

export const marketsTdMuted = "text-sm whitespace-nowrap text-muted-foreground";

/** Stopwatch + suffix in tables — time slot is fixed-width so column layout stays stable. */
export const tableCountdownCell =
  "inline-flex items-baseline justify-end gap-1 text-sm whitespace-nowrap text-muted-foreground";

export const tableCountdownTime =
  "inline-block min-w-[10ch] text-right font-mono tabular-nums";

export const marketsTdTrade = "pr-4";

export const marketsTdHideLg = "hidden xl:table-cell";

export const marketsTdHideMd = "hidden lg:table-cell";

export const marketsTdHideSm = "hidden sm:table-cell";

export const marketsThMarket = "min-w-64";

export const marketsThTrade = "w-[1%] pr-4";

export const marketsThHideLg = "hidden xl:table-cell";

export const marketsThHideMd = "hidden lg:table-cell";

export const marketsThHideSm = "hidden sm:table-cell";

export const marketsThBtnRight = "ml-auto";

export const marketsThSortActive = "text-accent";

export const ghostAccentHover =
  "hover:bg-[color-mix(in_oklab,var(--color-accent)_12%,var(--color-hover))] hover:text-accent";

export const marketsBookmark = cn(
  "h-8 w-8 min-w-8 shrink-0 text-muted-foreground transition-colors duration-150",
  ghostAccentHover,
);

export const marketsPriceCell = "flex items-center gap-1 font-mono tabular-nums";

export const marketsPriceValue = "font-semibold text-foreground";

export const marketsChange = "font-mono text-sm font-semibold tabular-nums";

export const marketsTradePillHideMobile = "hidden sm:inline-flex";

export const marketsMarketCell = "flex min-w-0 items-center gap-2.5";

export const marketsMarketLink = cn(
  "line-clamp-2 text-sm leading-snug text-foreground no-underline transition-colors duration-150 hover:text-accent",
);

export const marketsTradeActions = "flex items-center justify-end";

export const marketsTradePill = marketSideAction;

export const marketsTradePillUp = marketSideActionUp;

export const marketsTradePillDown = marketSideActionDown;

export const marketsTradePillRange = marketSideActionRange;

export const catalogPagination = cn(
  "flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 mt-2",
);

export const catalogPaginationInfo = "font-mono text-sm text-muted-foreground tabular-nums";

/** Featured carousel / hero */
export const heroPanel = "flex h-full min-h-[var(--markets-hero-h)] flex-col py-1";

export const featuredCarouselRow = cn(
  "flex h-[var(--featured-carousel-row-h)] items-center gap-3 rounded-md px-2",
);

export const featuredCarouselRowEmpty = cn(featuredCarouselRow, "pointer-events-none invisible");

export const btnIcon = cn(
  "inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-xl",
  "border border-border bg-transparent text-muted-foreground",
  "transition-colors duration-150 hover:bg-hover hover:text-foreground",
);

export const livePulse = cn(
  "h-2 w-2 shrink-0 rounded-full bg-success",
  "shadow-[0_0_0_0_color-mix(in_oklab,var(--color-success)_50%,transparent)]",
  "animate-[lx-pulse-ring_2.2s_ease-out_infinite]",
);

export const marketsCatalogRegion = "min-h-[var(--markets-catalog-h)]";
