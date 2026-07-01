import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Loader2, RefreshCw } from "lucide-react";
import { ConfirmDialog } from "@/components/leverx/ConfirmDialog";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { InfoPopover, LabelWithInfo } from "@/components/leverx/InfoPopover";
import { TradeAmountInput, TradeQuickAmounts } from "@/components/leverx/TradeFormControls";
import { QuoteAmount } from "@/components/leverx/QuoteAmount";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/WalletContext";
import { usePositionCustody } from "@/hooks/usePositionCustody";
import { useLeverxProtocolConfig, useLeverxTransactions } from "@/hooks/useLeverxTransactions";
import { useIndexerTriggers } from "@/hooks/useIndexer";
import { leverxInfo } from "@/lib/leverx/info-copy";
import { invalidatePortfolioQueries } from "@/lib/leverx/invalidate-queries";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { positionKeyFromArgs, type MarketKeyArgs } from "@/lib/leverx/market-keys";
import { formatQuantity } from "@/lib/leverx/format-quantity";
import { fetchManagerOpenQuantity } from "@/lib/leverx/quotes";
import { DEV_INSPECT_QUOTE_STALE_MS, DEFAULT_SLIPPAGE_BPS } from "@/lib/leverx/constants";
import {
  type OnChainQuantityRead,
} from "@/lib/leverx/position-quantity";
import {
  getPositionActionAvailability,
  type PositionEmptyStateKind,
} from "@/lib/leverx/position-action-availability";
import { positionCloseSource } from "@/lib/leverx/position-indexer-hints";
import { entryPremiumPerUnitRaw } from "@/lib/leverx/position-metrics";
import { showTxError, showTxSuccess } from "@/lib/toast";
import { usePredictOracleRows } from "@/hooks/usePredictOracles";
import { MARKET_TITLES } from "@/lib/leverx/indexer-markets";
import { predictSideFromBinary } from "@/lib/predict/instruments";
import { isOracleSettledForTrade } from "@/lib/predict/oracles";
import {
  centsToPremiumRaw,
  defaultTpSlPremiumsFromEntry,
  formatTriggerSlippageBps,
  marginUsdToQuoteAtoms,
  isLimitCentsWithinPredictBounds,
  premiumRawToCents,
  PREDICT_MAX_PREMIUM_CENTS,
  PREDICT_MIN_PREMIUM_CENTS,
  slPremiumCentsFromEntry,
  TP_SL_OFFSET_PRESETS,
  tpPremiumCentsFromEntry,
} from "@/lib/leverx/trade-math";
import {
  formatPositionTriggerSummary,
  positionTriggerForPosition,
} from "@/lib/leverx/position-triggers";
import { scaleQuote, scaleQuoteAtoms } from "@/lib/predict/scaling";
import { cn } from "@/lib/utils";
import { labelCaps, pillToggleBtn, pillToggleIdle, tpSlBlock, tpSlFields } from "@/lib/leverx/tw";

type ActionView = "menu" | "auto_exit" | "repay_debt";
type ConfirmAction = "market_close" | "settle" | "recover_custody" | "clear_triggers" | null;

interface Props {
  position: LeveragedPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function positionToKey(position: LeveragedPosition): MarketKeyArgs {
  return {
    oracleId: position.oracle_id,
    expiryMs: position.expiry_ms,
    strike: position.strike,
    higherStrike: position.higher_strike,
    isUp: position.is_up,
    isRange: position.is_range,
  };
}

function positionEmptyStateMessage(kind: PositionEmptyStateKind): string {
  switch (kind) {
    case "index_stale":
      return leverxInfo.positionIndexStaleDetail;
    case "stranded_custody":
      return leverxInfo.recoverStrandedCustody;
    case "fully_redeemed":
      return leverxInfo.positionFullyRedeemed;
    case "awaiting_oracle_settlement":
      return leverxInfo.positionAwaitingOracleSettlement;
    case "no_actions":
      return "No actions available for this position.";
  }
}

function PositionEmptyStatePanel({
  kind,
  onRefresh,
}: {
  kind: PositionEmptyStateKind;
  onRefresh?: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
      <p className="leading-relaxed">{positionEmptyStateMessage(kind)}</p>
      {kind === "index_stale" && onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 font-medium text-foreground underline-offset-4 hover:underline"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Refresh portfolio
        </button>
      ) : null}
    </div>
  );
}

function formatCloseSource(source: string | null): string | null {
  switch (source) {
    case "leverx_redeem":
      return "Closed via LeverX";
    case "leverx_settle":
      return "Settled via LeverX";
    case "predict_external":
      return "External Predict redeem";
    case "stranded_recovery":
      return "Key custody recovered";
    case "manager_surplus_recovery":
      return "Manager surplus recovered";
    case "liquidation":
      return "Liquidated";
    case "bad_debt_writeoff":
      return "Bad debt written off";
    default:
      return null;
  }
}

function PositionDetailGrid({
  position,
  contractQuantity,
  quantityLoading,
  keyQuoteBalance,
  managerQuoteBalance,
  custodyLoading,
}: {
  position: LeveragedPosition;
  contractQuantity?: OnChainQuantityRead;
  quantityLoading?: boolean;
  keyQuoteBalance?: bigint | null;
  managerQuoteBalance?: bigint | null;
  custodyLoading?: boolean;
}) {
  const indexerQty = position.open_quantity;
  const onChainQty = contractQuantity != null ? Number(contractQuantity) : null;
  const displayQty = onChainQty ?? indexerQty;
  const qtyStaleHigh =
    position.status === "open" &&
    onChainQty != null &&
    onChainQty > 0 &&
    onChainQty !== indexerQty;
  const qtyStaleLow =
    position.status === "open" && onChainQty === 0 && indexerQty > 0;
  const keyQuoteUsd =
    keyQuoteBalance != null ? scaleQuoteAtoms(keyQuoteBalance) : null;
  const managerQuoteUsd =
    managerQuoteBalance != null ? scaleQuoteAtoms(managerQuoteBalance) : null;
  const closeSourceLabel = formatCloseSource(positionCloseSource(position));

  return (
    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
      {closeSourceLabel ? (
        <>
          <dt className="text-muted-foreground">Close path</dt>
          <dd className="text-right text-xs text-muted-foreground">{closeSourceLabel}</dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">Quantity</dt>
      <dd
        className="text-right font-mono tabular-nums"
        title={displayQty >= 1_000 ? displayQty.toLocaleString("en-US") : undefined}
      >
        {quantityLoading ? (
          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />
        ) : (
          formatQuantity(displayQty)
        )}
      </dd>
      {qtyStaleHigh ? (
        <dt className="col-span-2 text-xs text-muted-foreground">
          On-chain quantity differs from the portfolio index.
        </dt>
      ) : null}
      {qtyStaleLow ? (
        <dt className="col-span-2 text-xs text-muted-foreground">
          On-chain contracts are zero — portfolio index still lists this row.
        </dt>
      ) : null}
      <dt className="text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          Locked on key
          <InfoPopover iconClassName="h-3 w-3">{leverxInfo.lockedKeyQuote}</InfoPopover>
        </span>
      </dt>
      <dd className="text-right">
        {custodyLoading ? (
          <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />
        ) : (
          <QuoteAmount amount={keyQuoteUsd ?? 0} digits={2} align="end" />
        )}
      </dd>
      {managerQuoteUsd != null && managerQuoteUsd > 0 ? (
        <>
          <dt className="text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              In manager
              <InfoPopover iconClassName="h-3 w-3">{leverxInfo.managerQuoteBalance}</InfoPopover>
            </span>
          </dt>
          <dd className="text-right">
            {custodyLoading ? (
              <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />
            ) : (
              <QuoteAmount amount={managerQuoteUsd} digits={2} align="end" />
            )}
          </dd>
        </>
      ) : null}
      <dt className="text-muted-foreground">Margin</dt>
      <dd className="text-right">
        <QuoteAmount amount={scaleQuote(position.margin_quote)} digits={2} align="end" />
      </dd>
      <dt className="text-muted-foreground">Borrowed</dt>
      <dd className="text-right">
        <QuoteAmount amount={scaleQuote(position.borrow_quote)} digits={2} align="end" />
      </dd>
      <dt className="text-muted-foreground">Leverage</dt>
      <dd className="text-right font-mono tabular-nums">
        {(position.leverage_bps / 10_000).toFixed(1)}×
      </dd>
    </dl>
  );
}

export function PositionActionsModal({ position, open, onOpenChange }: Props) {
  const { client } = useWallet();
  const queryClient = useQueryClient();
  const { cfg } = useLeverxProtocolConfig();
  const { data: oracles = [] } = usePredictOracleRows();
  const {
    closePosition,
    settleExpired,
    recoverStrandedCustody,
    repayDebt,
    setTriggers,
    clearTriggers,
    isProtocolReady,
  } = useLeverxTransactions();

  const { data: triggers = [], isLoading: triggersLoading } = useIndexerTriggers(
    open ? position.account_id : undefined,
  );
  const positionTrigger = positionTriggerForPosition(triggers, position);
  const triggerSummary = positionTrigger
    ? formatPositionTriggerSummary(positionTrigger)
    : null;

  const positionKey = positionToKey(position);
  const marketKey = positionKeyFromArgs(positionKey);
  const { data: onChainQuantity, isLoading: quantityLoading } = useQuery({
    queryKey: [
      "manager-open-qty",
      position.predict_manager_id,
      marketKey,
      cfg?.packageId,
      cfg?.predictPackageId,
    ],
    queryFn: () =>
      fetchManagerOpenQuantity({
        client,
        packageId: cfg!.packageId,
        predictPackageId: cfg!.predictPackageId,
        predictManagerId: position.predict_manager_id!,
        key: positionKey,
      }),
    enabled: Boolean(open && cfg && position.predict_manager_id),
    staleTime: DEV_INSPECT_QUOTE_STALE_MS,
    retry: 1,
  });

  const onChainQtyRead: OnChainQuantityRead =
    quantityLoading ? null : (onChainQuantity ?? null);

  const {
    keyQuoteBalance,
    managerQuoteBalance,
    isLoading: custodyLoading,
  } = usePositionCustody(position, open);

  const oracleRow = oracles.find((o) => o.oracle_id === position.oracle_id);
  const oracleSettled = isOracleSettledForTrade(oracleRow);

  const [view, setView] = useState<ActionView>("menu");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [repayUsd, setRepayUsd] = useState("");

  const pending =
    closePosition.isPending ||
    settleExpired.isPending ||
    recoverStrandedCustody.isPending ||
    repayDebt.isPending ||
    setTriggers.isPending ||
    clearTriggers.isPending;
  const {
    canCloseRedeem,
    canSettle,
    canRepayDebt,
    canRecoverCustody,
    recoverKeyQuote,
    recoverManagerQuote,
    emptyState,
  } = getPositionActionAvailability({
    position,
    onChainQuantity: onChainQtyRead,
    quantityLoading,
    oracleSettled,
    custody: {
      keyQuoteBalance,
      managerQuoteBalance,
      custodyLoading,
    },
  });

  const refreshPortfolio = () => {
    void invalidatePortfolioQueries(queryClient);
  };
  const borrowedUsd = scaleQuote(position.borrow_quote);
  const repayNum = parseFloat(repayUsd) || 0;
  const repayExceedsDebt = repayNum > borrowedUsd + 1e-6;
  const repayInvalid = !Number.isFinite(repayNum) || repayNum <= 0;

  const entryPremiumRaw = entryPremiumPerUnitRaw(position);
  const entryCents = entryPremiumRaw != null ? premiumRawToCents(entryPremiumRaw) : 0;

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

  const autoExitErrors = useMemo(() => {
    const errors: string[] = [];
    if (entryCents <= 0) {
      errors.push("Entry premium is unavailable for this position.");
    }
    const tpVal = parseFloat(tp);
    const slVal = parseFloat(sl);
    if (!tp && !sl) {
      errors.push("Set a take-profit or stop-loss premium.");
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
    return errors;
  }, [entryCents, tp, sl]);

  const canConfirmAutoExit = autoExitErrors.length === 0 && (tp || sl);

  const reset = () => {
    setView("menu");
    setConfirmAction(null);
    setTp("");
    setSl("");
  };

  const openAutoExitView = () => {
    if (entryCents > 0) {
      const defaults = defaultTpSlPremiumsFromEntry(entryCents);
      setTp(defaults.tp);
      setSl(defaults.sl);
    } else {
      setTp("");
      setSl("");
    }
    setView("auto_exit");
  };

  const closeModal = () => {
    onOpenChange(false);
    window.setTimeout(reset, 200);
  };

  const onError = showTxError;
  const onSuccess = (message: string) => {
    showTxSuccess(message);
    closeModal();
  };

  const marketTitle = MARKET_TITLES[
    predictSideFromBinary({ isUp: position.is_up, isRange: position.is_range })
  ];

  const title =
    view === "menu"
      ? marketTitle
      : view === "auto_exit"
        ? "Add auto-exit"
        : "Repay debt";

  const description =
    view === "menu"
      ? "Choose how to manage this position."
      : view === "auto_exit"
        ? leverxInfo.tpSl
        : leverxInfo.repayDebt;

  return (
    <>
      <ResponsiveModal
        open={open && confirmAction == null}
        onOpenChange={(next) => {
          if (!next) closeModal();
          else onOpenChange(true);
        }}
        title={title}
        description={description}
      >
        {view !== "menu" ? (
          <button
            type="button"
            className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setView("menu")}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>
        ) : null}

        {view === "menu" ? (
          <div className="space-y-3">
            <PositionDetailGrid
              position={position}
              contractQuantity={onChainQtyRead}
              quantityLoading={quantityLoading}
              keyQuoteBalance={keyQuoteBalance}
              managerQuoteBalance={managerQuoteBalance}
              custodyLoading={custodyLoading}
            />
            <div className="space-y-2">
              {canCloseRedeem ? (
                <>
                  <ActionButton
                    label="Close at market"
                    hint="Redeem now at the best available bid"
                    info={leverxInfo.closeMarket}
                    disabled={!isProtocolReady || pending}
                    onClick={() => setConfirmAction("market_close")}
                  />
                  {!triggersLoading && !positionTrigger ? (
                    <ActionButton
                      label="Add auto-exit"
                      hint="Set take-profit and stop-loss exit prices"
                      info={leverxInfo.tpSl}
                      disabled={!isProtocolReady || pending}
                      onClick={openAutoExitView}
                    />
                  ) : null}
                </>
              ) : null}
              {canRepayDebt ? (
                <ActionButton
                  label="Repay debt"
                  hint={
                    <span className="inline-flex items-center gap-1">
                      <QuoteAmount amount={borrowedUsd} digits={2} /> borrowed
                    </span>
                  }
                  info={leverxInfo.repayDebt}
                  disabled={!isProtocolReady || pending}
                  onClick={() => setView("repay_debt")}
                />
              ) : null}
              {canSettle ? (
                <ActionButton
                  label="Settle expired"
                  hint="Redeem after oracle settlement"
                  info={leverxInfo.settleExpired}
                  disabled={!isProtocolReady || pending}
                  onClick={() => setConfirmAction("settle")}
                />
              ) : null}
              {canRecoverCustody ? (
                <ActionButton
                  label="Recover funds"
                  hint="Move stranded quote into your trading account"
                  info={leverxInfo.recoverStrandedCustody}
                  disabled={!isProtocolReady || pending}
                  onClick={() => setConfirmAction("recover_custody")}
                />
              ) : null}
              {triggersLoading ? (
                <p className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                  Loading auto-exit rules…
                </p>
              ) : positionTrigger && triggerSummary ? (
                <ActionButton
                  label="Clear auto-exit"
                  hint={
                    <span className="block font-mono text-[11px]">
                      TP {triggerSummary.tpCents}¢ · SL {triggerSummary.slCents}¢
                      <span className="mt-0.5 block font-sans text-muted-foreground">
                        Exit slippage TP {triggerSummary.tpSlippage} · SL {triggerSummary.slSlippage}
                      </span>
                    </span>
                  }
                  info={leverxInfo.triggers}
                  disabled={!isProtocolReady || pending}
                  onClick={() => setConfirmAction("clear_triggers")}
                />
              ) : null}
              {emptyState ? (
                <PositionEmptyStatePanel
                  kind={emptyState}
                  onRefresh={emptyState === "index_stale" ? refreshPortfolio : undefined}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        {view === "auto_exit" ? (
          <div className={cn(tpSlBlock, "space-y-3")}>
            <div className={tpSlFields}>
              <p className="text-sm text-muted-foreground">
                <LabelWithInfo
                  label="Entry premium"
                  labelClassName="inline text-sm text-muted-foreground"
                  info={leverxInfo.tpSlEntry}
                />
                {": "}
                <span className="font-mono text-foreground">
                  {entryCents > 0 ? `${entryCents.toFixed(1)}¢` : "—"}
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
                  {formatTriggerSlippageBps(DEFAULT_SLIPPAGE_BPS)}
                </span>
                <span className="text-muted-foreground"> · market</span>
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
            {autoExitErrors.map((err) => (
              <p key={err} className="text-sm text-destructive">
                {err}
              </p>
            ))}
            <button
              type="button"
              className={cn(pillToggleBtn, pillToggleIdle, "w-full")}
              disabled={pending || !canConfirmAutoExit}
              onClick={() => {
                const tpPremium =
                  tp && Number.isFinite(parseFloat(tp)) ? centsToPremiumRaw(parseFloat(tp)) : 0n;
                const slPremium =
                  sl && Number.isFinite(parseFloat(sl)) ? centsToPremiumRaw(parseFloat(sl)) : 0n;
                if (tpPremium <= 0n && slPremium <= 0n) return;
                setTriggers.mutate(
                  {
                    accountId: position.account_id,
                    key: positionKey,
                    takeProfitPremium: tpPremium,
                    stopLossPremium: slPremium,
                    marketSlippageBps: DEFAULT_SLIPPAGE_BPS,
                  },
                  {
                    onError,
                    onSuccess: () => onSuccess("Auto-exit rules saved"),
                  },
                );
              }}
            >
              {setTriggers.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Save auto-exit"
              )}
            </button>
          </div>
        ) : null}

        {view === "repay_debt" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Outstanding borrow:{" "}
              <QuoteAmount
                amount={borrowedUsd}
                digits={2}
                className="text-foreground"
                amountClassName="text-foreground"
              />
            </p>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="Repay amount"
              value={repayUsd}
              onChange={(e) => setRepayUsd(e.target.value)}
              className="font-mono"
            />
            {repayExceedsDebt ? (
              <p className="text-sm text-destructive">Amount exceeds borrowed balance.</p>
            ) : null}
            <button
              type="button"
              className={cn(pillToggleBtn, pillToggleIdle, "w-full")}
              disabled={pending || repayExceedsDebt || repayInvalid}
              onClick={() => {
                const usd = parseFloat(repayUsd);
                if (!Number.isFinite(usd) || usd <= 0 || usd > borrowedUsd + 1e-6) return;
                repayDebt.mutate(
                  { position, amountAtoms: marginUsdToQuoteAtoms(usd) },
                  {
                    onError,
                    onSuccess: () => onSuccess("Debt repaid"),
                  },
                );
              }}
            >
              {repayDebt.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "Confirm repay"
              )}
            </button>
          </div>
        ) : null}

      </ResponsiveModal>

      <ConfirmDialog
        open={confirmAction === "market_close"}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title={`Close ${marketTitle} at market?`}
        description="Your position will be redeemed at the best available bid. This cannot be undone."
        confirmLabel="Close position"
        variant="destructive"
        pending={closePosition.isPending}
        onConfirm={() =>
          closePosition.mutate(
            { position, redeemMode: "market" },
            {
              onError: (err) => {
                showTxError(err);
                setConfirmAction(null);
              },
              onSuccess: () => onSuccess("Position closed at market"),
            },
          )
        }
      >
        <PositionDetailGrid
          position={position}
          contractQuantity={onChainQtyRead}
          quantityLoading={quantityLoading}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "settle"}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title={`Settle expired ${marketTitle}?`}
        description={
          oracleSettled
            ? "Finalize redemption after oracle settlement."
            : "Oracle has not settled yet — settlement is not available."
        }
        confirmLabel="Settle position"
        variant="destructive"
        pending={settleExpired.isPending}
        onConfirm={() =>
          settleExpired.mutate(position, {
            onError: (err) => {
              showTxError(err);
              setConfirmAction(null);
            },
            onSuccess: () => onSuccess("Expired position settled"),
          })
        }
      >
        <PositionDetailGrid
          position={position}
          contractQuantity={onChainQtyRead}
          quantityLoading={quantityLoading}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "recover_custody"}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title={`Recover stranded funds?`}
        description="Moves quote locked on this market key and/or sitting in your Predict manager into your trading account. Repay vault debt first if key-locked funds cannot be swept. Withdraw to your wallet from the Account tab afterward."
        confirmLabel="Recover funds"
        pending={recoverStrandedCustody.isPending}
        onConfirm={() =>
          recoverStrandedCustody.mutate(
            {
              position,
              recoverKeyQuote,
              recoverManagerQuote,
            },
            {
              onError: (err) => {
                showTxError(err);
                setConfirmAction(null);
              },
              onSuccess: () => onSuccess("Stranded funds recovered to trading account"),
            },
          )
        }
      >
        <PositionDetailGrid
          position={position}
          contractQuantity={onChainQtyRead}
          quantityLoading={quantityLoading}
          keyQuoteBalance={keyQuoteBalance}
          managerQuoteBalance={managerQuoteBalance}
          custodyLoading={custodyLoading}
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmAction === "clear_triggers"}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title="Clear auto-exit rules?"
        description="Take-profit and stop-loss triggers for this market will be removed."
        confirmLabel="Clear rules"
        variant="destructive"
        pending={clearTriggers.isPending}
        onConfirm={() =>
          clearTriggers.mutate(
            {
              accountId: position.account_id,
              key: positionKey,
            },
            {
              onError: (err) => {
                showTxError(err);
                setConfirmAction(null);
              },
              onSuccess: () => onSuccess("Auto-exit rules cleared"),
            },
          )
        }
      >
        {triggerSummary ? (
          <p className="font-mono text-sm text-muted-foreground">
            TP {triggerSummary.tpCents}¢ · SL {triggerSummary.slCents}¢
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function ActionButton({
  label,
  hint,
  info,
  disabled,
  onClick,
  pending,
}: {
  label: string;
  hint: ReactNode;
  info: string;
  disabled?: boolean;
  onClick: () => void;
  pending?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex w-full cursor-pointer items-start justify-between gap-3 rounded-lg border border-border bg-card/50 px-3 py-3 text-left transition-colors",
        "hover:bg-hover/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {label}
          <InfoPopover iconClassName="h-3 w-3">{info}</InfoPopover>
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{hint}</span>
      </span>
      {pending ? <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" /> : null}
    </div>
  );
}

interface TriggerProps {
  position: LeveragedPosition;
  className?: string;
}

/** Opens position actions in a dialog (desktop) or bottom sheet (mobile). */
export function PositionActionsTrigger({ position, className }: TriggerProps) {
  const [open, setOpen] = useState(false);
  const { isProtocolReady, closePosition, settleExpired, recoverStrandedCustody, repayDebt, setTriggers, clearTriggers } =
    useLeverxTransactions();
  const pending =
    closePosition.isPending ||
    settleExpired.isPending ||
    recoverStrandedCustody.isPending ||
    repayDebt.isPending ||
    setTriggers.isPending ||
    clearTriggers.isPending;

  return (
    <>
      <button
        type="button"
        className={cn(
          pillToggleBtn,
          pillToggleIdle,
          "px-3 text-sm font-medium",
          className,
        )}
        disabled={!isProtocolReady || pending}
        onClick={() => setOpen(true)}
      >
        {pending ? "Working…" : "Manage"}
      </button>
      <PositionActionsModal position={position} open={open} onOpenChange={setOpen} />
    </>
  );
}
