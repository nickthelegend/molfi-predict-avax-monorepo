import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { LeverageSlider } from "@/components/leverx/LeverageSlider";
import { InfoPopover, LabelWithInfo } from "@/components/leverx/InfoPopover";
import { TradingPausedNotice } from "@/components/leverx/TradingPausedNotice";
import { SlippagePopover, MarketSlippagePopover } from "@/components/leverx/SlippagePopover";
import { TradeQuoteSummary } from "@/components/leverx/TradeQuoteSummary";
import { QuoteAmount, QuoteIcon } from "@/components/leverx/QuoteAmount";
import { AnimatedPremiumCents } from "@/components/ui/animated-numbers";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { useIndexerProtocol, useIndexerAccounts } from "@/hooks/useIndexer";
import { useLeverxMarketAsk } from "@/hooks/useLeverxMarketAsk";
import { useLeverxMintQuote } from "@/hooks/useLeverxMintQuote";
import { useOraclePriceLatest } from "@/hooks/useOracleSpotPriceSeries";
import { useTradingAccountBalance } from "@/hooks/useTradingAccountBalance";
import { premiumToCents } from "@/lib/leverx/indexer-markets";
import {
  TradeAmountInput,
  TradeQuickAmounts,
} from "@/components/leverx/TradeFormControls";
import { PortfolioDepositDialog } from "@/components/leverx/PortfolioDepositDialog";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useWallet } from "@/context/WalletContext";
import { useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { resolveAccountId, resolvePredictManagerId } from "@/lib/leverx/account-resolution";
import { useNow } from "@/hooks/useNow";
import { showTxError, showTxSuccess } from "@/lib/toast";
import { PredictSideLabel } from "@/components/leverx/PredictSideLabel";
import { predictSideLabel, coercePredictSide, TRADE_PREDICT_SIDES, type PredictSide } from "@/lib/predict/instruments";
import {
  DEFAULT_SLIPPAGE_BPS,
  MAX_LIMIT_ORDER_SLIPPAGE_PCT,
} from "@/lib/leverx/constants";
import {
  centsToPremiumRaw,
  defaultTpSlPremiumsFromEntry,
  formatTriggerSlippageBps,
  isLimitCentsWithinPredictBounds,
  isPlacementPriceAligned,
  isPremiumWithinPredictBounds,
  percentToBps,
  premiumRawToCents,
  PREDICT_MAX_PREMIUM_CENTS,
  PREDICT_MIN_PREMIUM_CENTS,
  slPremiumCentsFromEntry,
  strikeUsdToRaw,
  TP_SL_OFFSET_PRESETS,
  tpPremiumCentsFromEntry,
} from "@/lib/leverx/trade-math";
import { marketKeyMatchesPosition, type MarketKeyArgs } from "@/lib/leverx/market-keys";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { isActiveOpenPosition } from "@/lib/leverx/position-metrics";
import {
  formatLiquidationThresholdPct,
  resolveFinalWindowMs,
  resolveLiquidationBps,
} from "@/lib/leverx/protocol";
import { buildQuickAmounts } from "@/lib/leverx/form-helpers";
import { tradeCtaLabel, tradeNeedsDeposit } from "@/lib/leverx/trade-cta";
import {
  DEFAULT_LEVERAGE,
  formatLeverage,
  formatLeverageBadge,
  leverageBadgeToneClass,
  LEVERAGE_MAX,
  LEVERAGE_MIN,
  maxLeverageForExpiry,
  maxLeveragedRestingOrderExpiryMs,
  MAX_MARGIN_USD,
  MIN_MARGIN_USD,
  DEFAULT_LIMIT_ORDER_EXPIRY_MS,
  pickDefaultLimitOrderExpiryMs,
  availableLimitOrderExpiryPresets,
} from "@/lib/leverx/trade-limits";
import { ui, formatAmount } from "@/lib/copy";
import { StrikePriceSelector } from "@/components/leverx/StrikePriceSelector";
import { RangeStrikeSelector } from "@/components/leverx/RangeStrikeSelector";
import { ChevronDown, CircleDollarSign, Loader2, Plus } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  formatStrikeUsdFromRaw,
  rangeBoundsFromPreset,
  snapStrikeRaw,
  strikeRawFromPreset,
  strikeUsdFromRaw,
  type RangePresetId,
  type StrikePresetId,
} from "@/lib/leverx/strike-selection";
import {
  tradeCtaClass,
  btnTradeSignin,
  labelCaps,
  leverageBadge,
  pillIconBtn,
  pillToggleActive,
  pillToggleBtn,
  pillToggleGroup,
  pillToggleIdle,
  segTabActive,
  segTabOutcome,
  segTabRangeActive,
  segTabsClass,
  sideToggleLongActive,
  sideToggleShortActive,
  tpSlBlock,
  tpSlFields,
  tpSlHeader,
  tradeLeveragePanel,
} from "@/lib/leverx/tw";

type OrderType = "market" | "limit";

const DEFAULT_MARKET_SLIPPAGE_PCT = DEFAULT_SLIPPAGE_BPS / 100;

interface Props {
  oracleId: string;
  side: PredictSide;
  onSideChange: (side: PredictSide) => void;
  expiryMs?: number;
  /** Live oracle spot (USD) for strike presets. */
  oracleSpotUsd?: number | null;
  minStrikeRaw?: number;
  tickSizeRaw?: number;
  lowerStrikeRaw?: number;
  upperStrikeRaw?: number;
  /** Notifies parent when the resolved binary strike changes (chart / order book). */
  onStrikeRawChange?: (strikeRaw: number) => void;
  /** Parent-resolved strike (catalog / chart) — keeps quotes in sync before spot loads. */
  binaryStrikeRaw?: number;
  /** Notifies parent when the resolved range bounds change (chart / order book). */
  onRangeBoundsChange?: (lowerRaw: number, upperRaw: number) => void;
  lastAskPremium?: number;
  /** Open positions on this oracle — used to block duplicate market keys. */
  openPositions?: readonly LeveragedPosition[];
  /** Set when oracle has settled — blocks new orders */
  disabled?: boolean;
  /** Called after a trade tx succeeds (e.g. switch to Open Orders on resting limit). */
  onTradeSuccess?: (meta: { orderType: OrderType; }) => void;
}

const ORDER_TYPES: readonly OrderType[] = ["market", "limit"];

export function PredictLeveragePanel({
  oracleId,
  side,
  onSideChange,
  expiryMs,
  oracleSpotUsd,
  minStrikeRaw = 0,
  tickSizeRaw = 0,
  lowerStrikeRaw,
  upperStrikeRaw,
  lastAskPremium,
  openPositions = [],
  disabled = false,
  onStrikeRawChange,
  onTradeSuccess,
  binaryStrikeRaw: parentBinaryStrikeRaw,
  onRangeBoundsChange,
}: Props) {
  const { isWalletConnected, address, client } = useWallet();
  const { openTrade, createMarginAccount, isProtocolReady, cfg } = useLeverxTransactions();
  const [marginAccountReady, setMarginAccountReady] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState(DEFAULT_LEVERAGE);
  const [placementSlippagePct, setPlacementSlippagePct] = useState(5);
  const [marketSlippagePct, setMarketSlippagePct] = useState(DEFAULT_MARKET_SLIPPAGE_PCT);
  const [orderExpiresOffsetMs, setOrderExpiresOffsetMs] = useState(
    DEFAULT_LIMIT_ORDER_EXPIRY_MS,
  );
  const [remintAfterDeleverage, setRemintAfterDeleverage] = useState(false);
  const [tpSl, setTpSl] = useState(false);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [strikePreset, setStrikePreset] = useState<StrikePresetId>("market");
  const [customStrikeUsd, setCustomStrikeUsd] = useState("");
  const [rangePreset, setRangePreset] = useState<RangePresetId>("market");
  const [customLowerUsd, setCustomLowerUsd] = useState("");
  const [customUpperUsd, setCustomUpperUsd] = useState("");
  const [depositOpen, setDepositOpen] = useState(false);
  const { data: protocol } = useIndexerProtocol();
  const liquidationBps = resolveLiquidationBps(protocol);
  const finalWindowMs = resolveFinalWindowMs(protocol);
  const { data: leverxAccounts = [] } = useIndexerAccounts(address ?? undefined);
  const hasMarginAccount = leverxAccounts.length > 0 || marginAccountReady;
  const needsMarginAccountSetup = isWalletConnected && !hasMarginAccount;
  const formDisabled = disabled || needsMarginAccountSetup;
  const predictManagerId = useMemo(
    () => resolvePredictManagerId(leverxAccounts, openPositions),
    [leverxAccounts, openPositions],
  );
  const hasLinkedManager = Boolean(predictManagerId);
  const tradeContextKey = `${oracleId}:${side}`;

  useEffect(() => {
    setMarginAccountReady(false);
  }, [address]);

  const resetTradeInputs = useCallback(() => {
    setOrderType("market");
    setMargin("");
    setLimitPrice("");
    setTpSl(false);
    setTp("");
    setSl("");
    setLeverage(DEFAULT_LEVERAGE);
  }, []);

  // Reset only when the user changes market or outcome — not when catalog/oracle props refetch.
  useEffect(() => {
    setOrderType("market");
    setMargin("");
    setLimitPrice("");
    setTpSl(false);
    setTp("");
    setSl("");
    setStrikePreset("market");
    setCustomStrikeUsd("");
    setRangePreset("market");
    setCustomLowerUsd("");
    setCustomUpperUsd("");
    setLeverage(DEFAULT_LEVERAGE);
    setPlacementSlippagePct(5);
    setMarketSlippagePct(DEFAULT_MARKET_SLIPPAGE_PCT);
    setOrderExpiresOffsetMs(DEFAULT_LIMIT_ORDER_EXPIRY_MS);
    setRemintAfterDeleverage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- strike props intentionally omitted
  }, [tradeContextKey]);

  // Seed limit price when switching to limit or changing market — not on every ask refresh.
  useEffect(() => {
    if (orderType !== "limit") return;
    setLimitPrice((prev) => {
      if (prev) return prev;
      if (lastAskPremium && lastAskPremium > 0) {
        return premiumToCents(lastAskPremium).toFixed(1);
      }
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lastAskPremium omitted to avoid refetch clobbering input
  }, [orderType, tradeContextKey]);
  const accountId = useMemo(
    () => resolveAccountId(leverxAccounts, openPositions),
    [leverxAccounts, openPositions],
  );
  const {
    usd: tradingBalanceUsd,
    atoms: tradingBalanceAtoms,
    isLoading: tradingBalanceLoading,
  } = useTradingAccountBalance(accountId);

  // Margin comes from the trading account — deposit in Portfolio before trading.
  const availableQuoteBalance = !accountId
    ? 0
    : tradingBalanceLoading
      ? null
      : tradingBalanceUsd;
  const availableQuoteAtoms = tradingBalanceAtoms;

  const now = useNow(1000);

  const lev = leverage;
  const maxLeverageForMarket = expiryMs
    ? maxLeverageForExpiry(expiryMs, finalWindowMs, now)
    : LEVERAGE_MAX;
  const leverageSliderAllowed = maxLeverageForMarket > LEVERAGE_MIN + 1e-6;
  const restingLimitAllowed = Boolean(
    expiryMs &&
    expiryMs > now &&
    availableLimitOrderExpiryPresets(expiryMs, now).length > 0,
  );

  useEffect(() => {
    if (leverage > maxLeverageForMarket) {
      setLeverage(maxLeverageForMarket);
    }
  }, [leverage, maxLeverageForMarket]);

  useEffect(() => {
    if (!expiryMs || expiryMs <= 0) return;
    const presets = availableLimitOrderExpiryPresets(expiryMs);
    if (presets.length === 0) return;
    if (!presets.some((p) => p.ms === orderExpiresOffsetMs)) {
      setOrderExpiresOffsetMs(pickDefaultLimitOrderExpiryMs(expiryMs));
    }
  }, [expiryMs, orderExpiresOffsetMs]);
  const marginNum = parseFloat(margin) || 0;
  const isRange = side === "range";

  useEffect(() => {
    const coerced = coercePredictSide(side);
    if (coerced !== side) onSideChange(coerced);
  }, [side, onSideChange]);

  const ctaClass = tradeCtaClass(side);

  const resolvedBinaryStrikeRaw = useMemo(() => {
    if (isRange) return 0;
    if (strikePreset === "custom") {
      const usd = parseFloat(customStrikeUsd);
      if (Number.isFinite(usd) && usd > 0) {
        return snapStrikeRaw(usd, minStrikeRaw, tickSizeRaw);
      }
      return 0;
    }
    if (oracleSpotUsd != null && oracleSpotUsd > 0) {
      return strikeRawFromPreset(
        strikePreset,
        oracleSpotUsd,
        minStrikeRaw,
        tickSizeRaw,
      );
    }
    // Spot not loaded yet — fall back to parent strike for initial ATM display only.
    if (
      strikePreset === "market" &&
      parentBinaryStrikeRaw != null &&
      parentBinaryStrikeRaw > 0
    ) {
      return parentBinaryStrikeRaw;
    }
    return 0;
  }, [
    isRange,
    strikePreset,
    customStrikeUsd,
    parentBinaryStrikeRaw,
    oracleSpotUsd,
    minStrikeRaw,
    tickSizeRaw,
  ]);

  const resolvedRangeBounds = useMemo(() => {
    if (!isRange) return { lower: 0, upper: 0 };
    if (rangePreset === "custom") {
      const lowerUsd = parseFloat(customLowerUsd);
      const upperUsd = parseFloat(customUpperUsd);
      const lower =
        Number.isFinite(lowerUsd) && lowerUsd > 0
          ? snapStrikeRaw(lowerUsd, minStrikeRaw, tickSizeRaw)
          : 0;
      const upper =
        Number.isFinite(upperUsd) && upperUsd > 0
          ? snapStrikeRaw(upperUsd, minStrikeRaw, tickSizeRaw)
          : 0;
      return { lower, upper };
    }
    if (oracleSpotUsd != null && oracleSpotUsd > 0) {
      return rangeBoundsFromPreset(
        rangePreset,
        oracleSpotUsd,
        minStrikeRaw,
        tickSizeRaw,
      );
    }
    if (
      lowerStrikeRaw != null &&
      lowerStrikeRaw > 0 &&
      upperStrikeRaw != null &&
      upperStrikeRaw > lowerStrikeRaw
    ) {
      return { lower: lowerStrikeRaw, upper: upperStrikeRaw };
    }
    return { lower: 0, upper: 0 };
  }, [
    isRange,
    rangePreset,
    customLowerUsd,
    customUpperUsd,
    lowerStrikeRaw,
    upperStrikeRaw,
    oracleSpotUsd,
    minStrikeRaw,
    tickSizeRaw,
  ]);

  const resolvedRangeLowerRaw = resolvedRangeBounds.lower;
  const resolvedRangeUpperRaw = resolvedRangeBounds.upper;

  useEffect(() => {
    if (isRange || !onStrikeRawChange) return;
    if (resolvedBinaryStrikeRaw > 0) {
      onStrikeRawChange(resolvedBinaryStrikeRaw);
    }
  }, [isRange, resolvedBinaryStrikeRaw, onStrikeRawChange]);

  useEffect(() => {
    if (!isRange || !onRangeBoundsChange) return;
    if (resolvedRangeLowerRaw > 0 && resolvedRangeUpperRaw > resolvedRangeLowerRaw) {
      onRangeBoundsChange(resolvedRangeLowerRaw, resolvedRangeUpperRaw);
    }
  }, [isRange, resolvedRangeLowerRaw, resolvedRangeUpperRaw, onRangeBoundsChange]);

  const handleStrikePresetChange = useCallback(
    (preset: StrikePresetId) => {
      setStrikePreset(preset);
      if (preset === "custom" && !customStrikeUsd && resolvedBinaryStrikeRaw > 0) {
        setCustomStrikeUsd(String(strikeUsdFromRaw(resolvedBinaryStrikeRaw)));
      }
    },
    [customStrikeUsd, resolvedBinaryStrikeRaw],
  );

  const handleRangePresetChange = useCallback(
    (preset: RangePresetId) => {
      setRangePreset(preset);
      if (preset === "custom") {
        if (!customLowerUsd && resolvedRangeLowerRaw > 0) {
          setCustomLowerUsd(String(strikeUsdFromRaw(resolvedRangeLowerRaw)));
        }
        if (!customUpperUsd && resolvedRangeUpperRaw > 0) {
          setCustomUpperUsd(String(strikeUsdFromRaw(resolvedRangeUpperRaw)));
        }
      }
    },
    [customLowerUsd, customUpperUsd, resolvedRangeLowerRaw, resolvedRangeUpperRaw],
  );

  const outcomeStrike =
    resolvedBinaryStrikeRaw ||
    (resolvedRangeLowerRaw > 0 && resolvedRangeUpperRaw > resolvedRangeLowerRaw
      ? Math.round((resolvedRangeLowerRaw + resolvedRangeUpperRaw) / 2)
      : undefined);
  const canSwitchOutcome = !!(
    outcomeStrike ||
    (resolvedRangeLowerRaw > 0 && resolvedRangeUpperRaw > resolvedRangeLowerRaw)
  );
  const tradeKey: MarketKeyArgs | undefined = useMemo(() => {
    if (!expiryMs) return undefined;
    if (isRange) {
      if (
        resolvedRangeLowerRaw <= 0 ||
        resolvedRangeUpperRaw <= resolvedRangeLowerRaw
      ) {
        return undefined;
      }
      return {
        oracleId,
        expiryMs,
        strike: resolvedRangeLowerRaw,
        higherStrike: resolvedRangeUpperRaw,
        isUp: true,
        isRange: true,
      };
    }
    if (!resolvedBinaryStrikeRaw) return undefined;
    return {
      oracleId,
      expiryMs,
      strike: resolvedBinaryStrikeRaw,
      higherStrike: 0,
      isUp: side === "up",
      isRange: false,
    };
  }, [
    expiryMs,
    isRange,
    oracleId,
    side,
    resolvedBinaryStrikeRaw,
    resolvedRangeLowerRaw,
    resolvedRangeUpperRaw,
  ]);

  const needsDeposit = useMemo(
    () =>
      tradeNeedsDeposit({
        marginUsd: marginNum,
        availableQuoteBalance,
      }),
    [marginNum, availableQuoteBalance],
  );

  const quoteBalanceLabel = useMemo(() => {
    if (availableQuoteBalance == null) return "—";
    return availableQuoteBalance;
  }, [availableQuoteBalance]);

  const depositBalanceSourceLabel = ui.predictManagerBalance;

  const quickAmounts = useMemo(
    () =>
      buildQuickAmounts(availableQuoteBalance, availableQuoteAtoms, {
        capUsd: MAX_MARGIN_USD,
      }),
    [availableQuoteBalance, availableQuoteAtoms],
  );

  const { data: liveAskPremium, isLoading: liveAskLoading } = useLeverxMarketAsk(tradeKey);

  const quoteReferencePremium = useMemo(() => {
    if (orderType !== "limit" || !limitPrice) return undefined;
    const cents = parseFloat(limitPrice);
    if (!Number.isFinite(cents) || cents <= 0) return undefined;
    if (!isLimitCentsWithinPredictBounds(cents)) return undefined;
    return centsToPremiumRaw(cents);
  }, [orderType, limitPrice]);

  const {
    data: mintQuote,
    isLoading: quoteLoading,
    isFetching: quoteRefreshing,
  } = useLeverxMintQuote({
    key: tradeKey,
    marginUsd: marginNum,
    leverage: lev,
    owner: address ?? undefined,
    enabled:
      marginNum > 0 &&
      lev <= maxLeverageForMarket + 1e-6,
    referencePremiumOverride: quoteReferencePremium,
  });

  const awaitingOracleQuote =
    orderType === "market" &&
    marginNum > 0 &&
    Boolean(tradeKey) &&
    mintQuote == null &&
    !(expiryMs && expiryMs > 0 && expiryMs <= now);

  useOraclePriceLatest(oracleId, { hotPoll: awaitingOracleQuote });

  const isCalculatingQuote =
    quoteLoading || quoteRefreshing || awaitingOracleQuote;

  const tradeQuantity = mintQuote?.tradeQuantity ?? 1n;

  const liveAskCents = useMemo(() => {
    if (liveAskPremium != null && liveAskPremium > 0n) {
      return premiumRawToCents(liveAskPremium);
    }
    if (lastAskPremium != null && lastAskPremium > 0) {
      return premiumToCents(lastAskPremium);
    }
    return null;
  }, [liveAskPremium, lastAskPremium]);

  const submitLabel = useMemo(
    () =>
      tradeCtaLabel({
        side,
        orderType,
        needsDeposit,
        lastAskPremium:
          liveAskPremium != null && liveAskPremium > 0n
            ? liveAskPremium
            : lastAskPremium,
      }),
    [side, orderType, needsDeposit, liveAskPremium, lastAskPremium],
  );

  const entryPremiumRaw = useMemo(() => {
    if (orderType === "limit" && limitPrice) {
      const cents = parseFloat(limitPrice);
      if (Number.isFinite(cents) && cents > 0) {
        return centsToPremiumRaw(cents);
      }
    }
    if (mintQuote?.marketAskPerUnit && mintQuote.marketAskPerUnit > 0n) {
      return mintQuote.marketAskPerUnit;
    }
    if (liveAskPremium != null && liveAskPremium > 0n) {
      return liveAskPremium;
    }
    if (lastAskPremium && lastAskPremium > 0) {
      return BigInt(Math.round(lastAskPremium));
    }
    return 0n;
  }, [orderType, limitPrice, mintQuote?.marketAskPerUnit, liveAskPremium, lastAskPremium]);

  const entryCents = useMemo(() => {
    if (entryPremiumRaw <= 0n) return 0;
    return premiumRawToCents(entryPremiumRaw);
  }, [entryPremiumRaw]);

  const handleTpSlToggle = (checked: boolean) => {
    setTpSl(checked);
    if (!checked) {
      setTp("");
      setSl("");
      return;
    }
    if (entryCents > 0) {
      const defaults = defaultTpSlPremiumsFromEntry(entryCents);
      setTp(defaults.tp);
      setSl(defaults.sl);
    }
  };

  const tpPresets = useMemo(
    () =>
      entryCents > 0
        ? TP_SL_OFFSET_PRESETS.map((offset) => ({
          label: `+${offset}¢`,
          value: tpPremiumCentsFromEntry(entryCents, offset).toFixed(1),
        }))
        : [],
    [entryCents],
  );

  const slPresets = useMemo(
    () =>
      entryCents > 0
        ? TP_SL_OFFSET_PRESETS.map((offset) => ({
          label: `−${offset}¢`,
          value: slPremiumCentsFromEntry(entryCents, offset).toFixed(1),
        }))
        : [],
    [entryCents],
  );

  const triggerExitSlippagePct =
    orderType === "market" ? marketSlippagePct : placementSlippagePct;

  useEffect(() => {
    if (!tpSl || entryCents <= 0 || tp || sl) return;
    const defaults = defaultTpSlPremiumsFromEntry(entryCents);
    setTp(defaults.tp);
    setSl(defaults.sl);
  }, [tpSl, entryCents, tp, sl]);

  const pendingTradeKey = tradeKey ?? null;

  const duplicateOpenPosition = useMemo(() => {
    if (!pendingTradeKey) return null;
    return (
      openPositions.find(
        (position) =>
          isActiveOpenPosition(position) &&
          marketKeyMatchesPosition(pendingTradeKey, position),
      ) ?? null
    );
  }, [pendingTradeKey, openPositions]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (duplicateOpenPosition) {
      errors.push(
        "You already have an open position on this exact market (same strike and side). Manage it under Positions instead of opening again.",
      );
    }
    if (
      lev > maxLeverageForMarket + 1e-6 &&
      expiryMs
    ) {
      errors.push(
        `Leverage cannot exceed ${formatLeverage(maxLeverageForMarket)} this close to market expiry.`,
      );
    }
    if (marginNum > 0 && marginNum < MIN_MARGIN_USD) {
      errors.push(`Minimum deposit is ${MIN_MARGIN_USD} dUSDC.`);
    }
    if (marginNum > MAX_MARGIN_USD) {
      errors.push(`Maximum deposit is ${MAX_MARGIN_USD} dUSDC.`);
    }
    if (
      marginNum > 0 &&
      availableQuoteBalance != null &&
      marginNum > availableQuoteBalance + 1e-6
    ) {
      errors.push("Deposit exceeds your trading account balance. Add funds in Portfolio first.");
    }
    if (isWalletConnected && leverxAccounts.length > 0 && !hasLinkedManager) {
      errors.push(
        "Your trading account is still being set up. Refresh your portfolio in a moment before trading.",
      );
    }
    if (orderType === "limit" && marginNum > 0) {
      if (!restingLimitAllowed) {
        errors.push(
          "Resting limit orders are unavailable in the final hour or when the market closes too soon.",
        );
      }
      const cents = parseFloat(limitPrice);
      if (!Number.isFinite(cents) || cents <= 0) {
        errors.push("Enter a limit price above 0¢.");
      } else if (!isLimitCentsWithinPredictBounds(cents)) {
        errors.push(
          `Limit price must be between ${PREDICT_MIN_PREMIUM_CENTS}¢ and ${PREDICT_MAX_PREMIUM_CENTS}¢.`,
        );
      } else if (liveAskPremium != null && liveAskPremium > 0n) {
        const limitPremium = centsToPremiumRaw(cents);
        const slippageBps = percentToBps(placementSlippagePct);
        const liveLabel = `${premiumRawToCents(liveAskPremium).toFixed(1)}¢`;

        if (!isPlacementPriceAligned(liveAskPremium, limitPremium, slippageBps)) {
          errors.push(
            `Your limit (${cents.toFixed(1)}¢) is too far from the live price (${liveLabel}). Resting limits must be placed within ±${placementSlippagePct}% of the current price. Set a limit closer to market, widen price tolerance (up to ${MAX_LIMIT_ORDER_SLIPPAGE_PCT}%), switch to Market to open now, or wait for the price to move.`,
          );
        }
      }
      if (placementSlippagePct < 0.1) {
        errors.push("Price tolerance must be at least 0.1%.");
      } else if (placementSlippagePct > MAX_LIMIT_ORDER_SLIPPAGE_PCT) {
        errors.push(`Price tolerance cannot exceed ${MAX_LIMIT_ORDER_SLIPPAGE_PCT}%.`);
      }
      if (expiryMs && expiryMs > 0) {
        const restingExpiresMs = now + orderExpiresOffsetMs;
        const maxLeveragedExpiryMs = maxLeveragedRestingOrderExpiryMs(
          expiryMs,
          finalWindowMs,
        );
        if (restingExpiresMs <= now) {
          errors.push("Order expiry must be in the future.");
        } else if (restingExpiresMs > expiryMs) {
          errors.push("Order expiry cannot be after this market closes. Pick a shorter duration.");
        } else if (
          lev > LEVERAGE_MIN + 1e-6 &&
          maxLeveragedExpiryMs != null &&
          restingExpiresMs > maxLeveragedExpiryMs
        ) {
          errors.push(
            "Leveraged resting orders must expire before the final window before market close.",
          );
        } else if (expiryMs <= now + 60_000) {
          errors.push("Market closes too soon for a resting limit order.");
        }
      }
    }
    if (orderType === "market") {
      if (marketSlippagePct < 0.1) {
        errors.push("Slippage must be at least 0.1%.");
      } else if (marketSlippagePct > MAX_LIMIT_ORDER_SLIPPAGE_PCT) {
        errors.push(`Slippage cannot exceed ${MAX_LIMIT_ORDER_SLIPPAGE_PCT}%.`);
      }
    }
    if (orderType === "market" && marginNum > 0 && tradeKey) {
      if (expiryMs && expiryMs > 0 && expiryMs <= now) {
        errors.push("This market has expired. Pick a live expiry or another strike.");
      } else if (!isCalculatingQuote) {
        if (mintQuote == null) {
          errors.push(
            "Try another strike or wait for oracle updates.",
          );
        } else if (!isPremiumWithinPredictBounds(mintQuote.marketAskPerUnit)) {
          errors.push(
            `Live contract price must be between ${PREDICT_MIN_PREMIUM_CENTS}¢ and ${PREDICT_MAX_PREMIUM_CENTS}¢.`,
          );
        }
      }
    }
    if (isRange) {
      if (resolvedRangeLowerRaw <= 0 || resolvedRangeUpperRaw <= 0) {
        errors.push("Set a price range to trade this market.");
      } else if (resolvedRangeUpperRaw <= resolvedRangeLowerRaw) {
        errors.push("Range low must be below high end.");
      } else if (rangePreset === "custom") {
        const lowerUsd = parseFloat(customLowerUsd);
        const upperUsd = parseFloat(customUpperUsd);
        if (!Number.isFinite(lowerUsd) || lowerUsd <= 0) {
          errors.push("Enter a valid low-end strike.");
        }
        if (!Number.isFinite(upperUsd) || upperUsd <= 0) {
          errors.push("Enter a valid high-end strike.");
        }
      }
    }
    if (!isRange && strikePreset === "custom") {
      const usd = parseFloat(customStrikeUsd);
      if (!Number.isFinite(usd) || usd <= 0) {
        errors.push("Enter a valid custom strike price.");
      } else if (minStrikeRaw > 0) {
        const snapped = snapStrikeRaw(usd, minStrikeRaw, tickSizeRaw);
        if (snapped <= 0) {
          errors.push(
            `Strike must be at least ${formatStrikeUsdFromRaw(minStrikeRaw)}.`,
          );
        }
      }
    }
    if (!isRange && resolvedBinaryStrikeRaw <= 0) {
      errors.push("Set a strike price to trade this market.");
    }
    if (tpSl) {
      if (entryCents <= 0) {
        errors.push("Set your deposit to load an entry premium before using TP/SL.");
      }
      const tpVal = parseFloat(tp);
      const slVal = parseFloat(sl);
      if (!tp && !sl) {
        errors.push("Set a take-profit or stop-loss premium, or turn TP/SL off.");
      }
      if (tp) {
        if (!Number.isFinite(tpVal) || !isLimitCentsWithinPredictBounds(tpVal)) {
          errors.push(
            `Take profit must be between ${PREDICT_MIN_PREMIUM_CENTS}¢ and ${PREDICT_MAX_PREMIUM_CENTS}¢.`,
          );
        } else if (entryCents > 0 && tpVal <= entryCents) {
          errors.push("Take profit must be above your entry premium.");
        }
      }
      if (sl) {
        if (!Number.isFinite(slVal) || !isLimitCentsWithinPredictBounds(slVal)) {
          errors.push(
            `Stop loss must be between ${PREDICT_MIN_PREMIUM_CENTS}¢ and ${PREDICT_MAX_PREMIUM_CENTS}¢.`,
          );
        } else if (entryCents > 0 && slVal >= entryCents) {
          errors.push("Stop loss must be below your entry premium.");
        }
      }
    }
    return errors;
  }, [
    marginNum,
    availableQuoteBalance,
    orderType,
    limitPrice,
    placementSlippagePct,
    marketSlippagePct,
    liveAskPremium,
    isRange,
    rangePreset,
    customLowerUsd,
    customUpperUsd,
    resolvedRangeLowerRaw,
    resolvedRangeUpperRaw,
    strikePreset,
    customStrikeUsd,
    minStrikeRaw,
    tickSizeRaw,
    resolvedBinaryStrikeRaw,
    tradeKey,
    address,
    isCalculatingQuote,
    mintQuote,
    orderExpiresOffsetMs,
    expiryMs,
    restingLimitAllowed,
    tpSl,
    tp,
    sl,
    entryCents,
    isWalletConnected,
    leverxAccounts.length,
    hasLinkedManager,
    duplicateOpenPosition,
    lev,
    maxLeverageForMarket,
    now,
    finalWindowMs,
  ]);

  const visibleValidationErrors = useMemo(() => {
    if (!margin.trim() || marginNum <= 0) return [];
    return validationErrors;
  }, [margin, marginNum, validationErrors]);

  const canSubmit =
    !disabled &&
    isWalletConnected &&
    isProtocolReady &&
    !protocol?.trading_paused &&
    marginNum > 0 &&
    expiryMs &&
    expiryMs > 0 &&
    expiryMs > now &&
    validationErrors.length === 0 &&
    !(orderType === "market" && marginNum > 0 && tradeKey && isCalculatingQuote) &&
    (isRange
      ? resolvedRangeLowerRaw > 0 && resolvedRangeUpperRaw > resolvedRangeLowerRaw
      : resolvedBinaryStrikeRaw > 0);

  const handleCreateMarginAccount = () => {
    createMarginAccount.mutate(undefined, {
      onError: showTxError,
      onSuccess: () => {
        setMarginAccountReady(true);
        showTxSuccess("Margin account created");
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit || !expiryMs || !tradeKey) return;

    const tpPremium =
      tpSl && tp && Number.isFinite(parseFloat(tp))
        ? centsToPremiumRaw(parseFloat(tp))
        : 0n;
    const slPremium =
      tpSl && sl && Number.isFinite(parseFloat(sl))
        ? centsToPremiumRaw(parseFloat(sl))
        : 0n;

    openTrade.mutate(
      {
        key: tradeKey,
        marginUsd: marginNum,
        leverage: lev,
        orderType,
        limitExecution: orderType === "limit" ? "resting" : undefined,
        limitCents: orderType === "limit" ? parseFloat(limitPrice) || undefined : undefined,
        quantity: tradeQuantity,
        placementSlippageBps:
          orderType === "limit" ? percentToBps(placementSlippagePct) : undefined,
        marketSlippageBps:
          orderType === "market" ? percentToBps(marketSlippagePct) : undefined,
        orderExpiresMs:
          orderType === "limit"
            ? Math.min(Date.now() + orderExpiresOffsetMs, expiryMs)
            : undefined,
        remintAfterDeleverage: lev > 1 ? remintAfterDeleverage : false,
        tpPremium: tpPremium > 0n ? tpPremium : undefined,
        slPremium: slPremium > 0n ? slPremium : undefined,
      },
      {
        onError: showTxError,
        onSuccess: () => {
          showTxSuccess(orderType === "limit" ? "Limit order placed" : "Trade submitted");
          resetTradeInputs();
          onTradeSuccess?.({ orderType });
        },
      },
    );
  };

  return (
    <div
      className={cn(
        tradeLeveragePanel,
        "trade-leverage-panel",
        disabled && "relative",
      )}
    >
      {disabled ? (
        <div
          className="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm text-muted-foreground"
          role="status"
        >
          {expiryMs && expiryMs > 0 && expiryMs <= now
            ? "This market has expired. New orders are not accepted."
            : "This market has settled. New orders are not accepted."}
        </div>
      ) : needsMarginAccountSetup ? (
        <div
          className="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm text-muted-foreground"
          role="status"
        >
          Create a trading account to configure deposits, leverage, and orders.
        </div>
      ) : null}
      <div
        className={cn(
          formDisabled && "pointer-events-none select-none opacity-50",
        )}
      >
        <div className="border-b border-border p-3">
          <div className={segTabsClass("stretch", "outcomes")} role="group" aria-label="Outcome">
            {canSwitchOutcome ? (
              TRADE_PREDICT_SIDES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  disabled={formDisabled}
                  onClick={() => onSideChange(outcome)}
                  className={cn(
                    segTabOutcome,
                    side === outcome && segTabActive,
                    side === outcome && outcome === "up" && sideToggleLongActive,
                    side === outcome && outcome === "down" && sideToggleShortActive,
                    side === outcome && outcome === "range" && segTabRangeActive,
                  )}
                >
                  <PredictSideLabel side={outcome} />
                </button>
              ))
            ) : (
              TRADE_PREDICT_SIDES.map((outcome) => (
                <span key={outcome} className={cn(segTabOutcome, "opacity-50")}>
                  <PredictSideLabel side={outcome} />
                </span>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border px-4 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <LabelWithInfo
            label="Order type"
            labelClassName={labelCaps}
            info={leverxInfo.orderType}
          />
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className={pillToggleGroup} role="group" aria-label="Order type">
              {ORDER_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={formDisabled}
                  className={cn(
                    pillToggleBtn,
                    orderType === type ? pillToggleActive : pillToggleIdle,
                  )}
                  onClick={() => setOrderType(type)}
                  aria-pressed={orderType === type}
                >
                  {type}
                </button>
              ))}
            </div>
            {orderType === "limit" ? (
              <SlippagePopover
                placementSlippagePct={placementSlippagePct}
                orderExpiresOffsetMs={orderExpiresOffsetMs}
                marketExpiryMs={expiryMs}
                restingAllowed={restingLimitAllowed}
                onPlacementSlippageChange={setPlacementSlippagePct}
                onOrderExpiresOffsetMsChange={setOrderExpiresOffsetMs}
              />
            ) : (
              <MarketSlippagePopover
                slippagePct={marketSlippagePct}
                onSlippageChange={setMarketSlippagePct}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col space-y-5 p-4">
          {orderType === "limit" ? (
            <div>
              <div className="mb-2">
                <LabelWithInfo
                  label={`Limit price (${predictSideLabel[side]})`}
                  labelClassName={labelCaps}
                  info={leverxInfo.limitPrice}
                />
              </div>
              <TradeAmountInput
                large
                type="number"
                inputMode="decimal"
                min={0.1}
                step={0.1}
                disabled={formDisabled}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                suffix={<span className="text-sm text-muted-foreground">¢</span>}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Live contract price:{" "}
                <span className="font-mono text-foreground">
                  {liveAskLoading ? (
                    "…"
                  ) : liveAskCents != null && liveAskCents > 0 ? (
                    <AnimatedPremiumCents value={liveAskCents} placeholder="—" />
                  ) : (
                    "—"
                  )}
                </span>
              </p>
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <LabelWithInfo
                label="Your deposit"
                labelClassName={labelCaps}
                info={leverxInfo.margin}
              />
              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                <CircleDollarSign className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {depositBalanceSourceLabel}{" "}
                {typeof quoteBalanceLabel === "number" ? (
                  <span className="font-mono tabular-nums text-foreground">
                    {formatAmount(quoteBalanceLabel)}
                  </span>
                ) : (
                  <span className="font-mono text-foreground">{quoteBalanceLabel}</span>
                )}
                <QuoteIcon className="h-3.5 w-3.5 shrink-0" />
                {accountId ? (
                  <button
                    type="button"
                    className={cn(
                      pillIconBtn,
                      pillToggleIdle,
                      "ml-0.5 h-6 w-6 shrink-0 rounded-md p-0",
                    )}
                    aria-label="Deposit to trading account"
                    onClick={() => setDepositOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>
                ) : null}
              </span>
            </div>
            <TradeAmountInput
              prefix={<span className="font-mono text-sm">$</span>}
              large
              type="number"
              inputMode="decimal"
              disabled={formDisabled}
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              placeholder="0.00"
              suffix={
                leverageSliderAllowed ? (
                  <span className={cn(leverageBadge, leverageBadgeToneClass(lev))}>
                    {formatLeverageBadge(lev)}
                  </span>
                ) : null
              }
            />
            <div className="mt-2">
              <TradeQuickAmounts amounts={quickAmounts} onPick={setMargin} />
            </div>
            {marginNum > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Position size:{" "}
                <span className="font-mono text-foreground">
                  <QuoteAmount amount={marginNum * lev} />
                </span>
                {lev > LEVERAGE_MIN + 1e-6 ? (
                  <>
                    {" · "}
                    Liquidation below{" "}
                    {formatLiquidationThresholdPct(liquidationBps)}
                  </>
                ) : null}
              </p>
            ) : null}
          </div>

          {leverageSliderAllowed ? (
            <LeverageSlider
              value={leverage}
              onChange={setLeverage}
              maxLeverage={maxLeverageForMarket}
              info={leverxInfo.leverage}
              disabled={formDisabled}
            />
          ) : null}

          <Collapsible defaultOpen={false} className={tpSlBlock}>
            <CollapsibleTrigger
              className={cn(
                tpSlHeader,
                "w-full cursor-pointer rounded-md text-left transition-colors hover:text-foreground",
                "[&[data-state=open]_svg]:rotate-180",
              )}
            >
              <span className={cn(labelCaps, "text-warning")}>More settings</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-5 pt-1 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              {!isRange ? (
                <StrikePriceSelector
                  preset={strikePreset}
                  onPresetChange={handleStrikePresetChange}
                  customStrikeUsd={customStrikeUsd}
                  onCustomStrikeChange={setCustomStrikeUsd}
                  resolvedStrikeRaw={resolvedBinaryStrikeRaw}
                  oracleSpotUsd={oracleSpotUsd}
                  minStrikeRaw={minStrikeRaw}
                  disabled={formDisabled}
                />
              ) : (
                <RangeStrikeSelector
                  preset={rangePreset}
                  onPresetChange={handleRangePresetChange}
                  customLowerUsd={customLowerUsd}
                  customUpperUsd={customUpperUsd}
                  onCustomLowerChange={setCustomLowerUsd}
                  onCustomUpperChange={setCustomUpperUsd}
                  lowerStrikeRaw={resolvedRangeLowerRaw}
                  upperStrikeRaw={resolvedRangeUpperRaw}
                  oracleSpotUsd={oracleSpotUsd}
                  minStrikeRaw={minStrikeRaw}
                  disabled={formDisabled}
                />
              )}

              {lev > 1 ? (
                <div className={tpSlHeader}>
                  <LabelWithInfo
                    label="Continue prediction with 1× leverage after deleverage"
                    info={leverxInfo.remintAfterDeleverage}
                  />
                  <Switch
                    checked={remintAfterDeleverage}
                    onCheckedChange={setRemintAfterDeleverage}
                    disabled={formDisabled}
                  />
                </div>
              ) : null}
            </CollapsibleContent>
          </Collapsible>

          <TradeQuoteSummary
            quote={marginNum > 0 ? mintQuote : null}
            isLoading={marginNum > 0 && isCalculatingQuote && !mintQuote}
            isRefreshing={marginNum > 0 && quoteRefreshing && Boolean(mintQuote)}
          />

          <div className={tpSlBlock}>
            <div className={tpSlHeader}>
              <LabelWithInfo
                label="Take profit / Stop loss"
                labelClassName={labelCaps}
                info={leverxInfo.tpSl}
              />
              <Switch checked={tpSl} onCheckedChange={handleTpSlToggle} disabled={formDisabled} />
            </div>
            {tpSl ? (
              <div className={tpSlFields}>
                <p className="text-sm text-muted-foreground">
                  <LabelWithInfo
                    label="Entry premium"
                    labelClassName="inline text-sm text-muted-foreground"
                    info={leverxInfo.tpSlEntry}
                  />
                  {": "}
                  <span className="font-mono text-foreground">
                    {entryCents > 0 ? (
                      <AnimatedPremiumCents value={entryCents} />
                    ) : isCalculatingQuote ? (
                      "…"
                    ) : (
                      "—"
                    )}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  <LabelWithInfo
                    label="Exit slippage"
                    labelClassName="inline text-sm text-muted-foreground"
                    info={leverxInfo.tpSlExitSlippage}
                  />
                  {": "}
                  <span className="font-mono text-foreground">
                    {formatTriggerSlippageBps(percentToBps(triggerExitSlippagePct))}
                  </span>
                  <span className="text-muted-foreground">
                    {orderType === "market" ? " · market" : " · placement"}
                  </span>
                </p>
                <div>
                  <LabelWithInfo
                    className="mb-2"
                    label="Take profit"
                    labelClassName={labelCaps}
                    info={leverxInfo.tpSlTakeProfit}
                  />
                  <TradeAmountInput
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={0.1}
                    disabled={formDisabled}
                    value={tp}
                    onChange={(e) => setTp(e.target.value)}
                    placeholder={entryCents > 0 ? defaultTpSlPremiumsFromEntry(entryCents).tp : "0.0"}
                    suffix={<span className="text-sm text-muted-foreground">¢</span>}
                  />
                  {tpPresets.length > 0 ? (
                    <div className="mt-2">
                      <TradeQuickAmounts amounts={tpPresets} onPick={setTp} />
                    </div>
                  ) : null}
                </div>
                <div>
                  <LabelWithInfo
                    className="mb-2"
                    label="Stop loss"
                    labelClassName={labelCaps}
                    info={leverxInfo.tpSlStopLoss}
                  />
                  <TradeAmountInput
                    type="number"
                    inputMode="decimal"
                    min={0.1}
                    step={0.1}
                    disabled={formDisabled}
                    value={sl}
                    onChange={(e) => setSl(e.target.value)}
                    placeholder={entryCents > 0 ? defaultTpSlPremiumsFromEntry(entryCents).sl : "0.0"}
                    suffix={<span className="text-sm text-muted-foreground">¢</span>}
                  />
                  {slPresets.length > 0 ? (
                    <div className="mt-2">
                      <TradeQuickAmounts amounts={slPresets} onPick={setSl} />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "space-y-2 border-t border-border p-4",
          disabled && "pointer-events-none select-none opacity-50",
        )}
      >
        {protocol?.trading_paused ? <TradingPausedNotice compact /> : null}
        {!isProtocolReady && isWalletConnected ? (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Trading is not available yet. Check back soon.
            <InfoPopover title="Setup">{leverxInfo.protocolNotConfigured}</InfoPopover>
          </p>
        ) : null}
        {visibleValidationErrors.map((err) => (
          <p key={err} className="text-sm text-destructive">
            {err}
          </p>
        ))}
        {isWalletConnected ? (
          needsMarginAccountSetup ? (
            <div className="flex gap-2">
              <button
                type="button"
                className={cn(
                  btnTradeSignin,
                  "!bg-accent !text-white hover:!bg-accent/90 hover:brightness-100",
                  "w-[60%] min-w-0 shrink-0",
                )}
                disabled={!isProtocolReady || createMarginAccount.isPending}
                onClick={handleCreateMarginAccount}
              >
                {createMarginAccount.isPending ? (
                  <>
                    <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </button>
              <button
                type="button"
                className={cn(ctaClass, "min-w-0 flex-1")}
                disabled
              >
                {submitLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={ctaClass}
              disabled={!canSubmit || openTrade.isPending}
              onClick={handleSubmit}
            >
              {openTrade.isPending ? (
                <>
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                submitLabel
              )}
            </button>
          )
        ) : (
          <WalletConnectButton fullWidth large className={ctaClass} />
        )}
      </div>
      {accountId ? (
        <PortfolioDepositDialog
          open={depositOpen}
          onOpenChange={setDepositOpen}
          accountId={accountId}
        />
      ) : null}
    </div>
  );
}
