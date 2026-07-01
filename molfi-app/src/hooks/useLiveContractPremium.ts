import { useEffect, useMemo, useRef } from "react";
import { useLeverxMarketAsk } from "@/hooks/useLeverxMarketAsk";
import { isContractQuotePaused } from "@/lib/leverx/contract-quote";
import { formatContractPremiumLabel } from "@/lib/leverx/indexer-markets";
import { tradeSideToMarketKey } from "@/lib/leverx/market-keys";
import type { PredictSide } from "@/lib/predict/instruments";

/** Live LP mint price with indexer catalog fallback (1e9-scaled raw premium). */
export function useLiveContractPremium(args: {
  oracleId: string;
  expiryMs?: number;
  strikeRaw?: number;
  higherStrikeRaw?: number;
  side: PredictSide;
  catalogPremium?: number | null;
}) {
  const marketKey = useMemo(() => {
    if (!args.expiryMs) return undefined;
    if (args.side === "range") {
      const lower = args.strikeRaw;
      const upper = args.higherStrikeRaw;
      if (!lower || !upper || upper <= lower) return undefined;
      return tradeSideToMarketKey({
        oracleId: args.oracleId,
        expiryMs: args.expiryMs,
        strike: lower,
        higherStrike: upper,
        side: args.side,
      });
    }
    if (!args.strikeRaw) return undefined;
    return tradeSideToMarketKey({
      oracleId: args.oracleId,
      expiryMs: args.expiryMs,
      strike: args.strikeRaw,
      higherStrike: args.higherStrikeRaw,
      side: args.side,
    });
  }, [args.oracleId, args.expiryMs, args.strikeRaw, args.higherStrikeRaw, args.side]);

  const marketKeySig = useMemo(
    () =>
      marketKey
        ? `${marketKey.oracleId}:${marketKey.expiryMs}:${marketKey.strike}:${marketKey.higherStrike}:${marketKey.isRange ? 1 : 0}`
        : "",
    [marketKey],
  );

  const lastAskByKeyRef = useRef<{ key: string; ask: bigint } | null>(null);

  const {
    data: liveAskRaw,
    isPending,
    isFetching,
    isError,
    isFetched,
  } = useLeverxMarketAsk(marketKey);

  useEffect(() => {
    if (!marketKeySig) {
      lastAskByKeyRef.current = null;
      return;
    }
    if (marketKeySig !== lastAskByKeyRef.current?.key) {
      lastAskByKeyRef.current = null;
    }
    if (liveAskRaw != null && liveAskRaw > 0n) {
      lastAskByKeyRef.current = { key: marketKeySig, ask: liveAskRaw };
    }
  }, [marketKeySig, liveAskRaw]);

  const heldAskRaw =
    liveAskRaw != null && liveAskRaw > 0n
      ? liveAskRaw
      : isFetching && lastAskByKeyRef.current?.key === marketKeySig
        ? lastAskByKeyRef.current.ask
        : liveAskRaw;

  const quotePaused = useMemo(
    () =>
      isContractQuotePaused({
        enabled: Boolean(marketKey),
        isPending,
        isFetching,
        isError,
        isFetched,
        liveAskRaw: heldAskRaw,
      }),
    [marketKey, isPending, isFetching, isError, isFetched, heldAskRaw],
  );

  const quoteResolving =
    args.side === "range" && Boolean(args.expiryMs) && !marketKey;

  const label = useMemo(() => {
    if (quotePaused) return "Paused";
    return formatContractPremiumLabel({
      liveAskRaw: heldAskRaw,
      catalogPremium: args.catalogPremium,
      loading:
        (isPending || isFetching) &&
        heldAskRaw == null &&
        !args.catalogPremium,
    });
  }, [quotePaused, heldAskRaw, args.catalogPremium, isPending, isFetching]);

  const premiumRaw = quotePaused
    ? null
    : heldAskRaw != null && heldAskRaw > 0n
      ? Number(heldAskRaw)
      : args.catalogPremium != null && args.catalogPremium > 0
        ? args.catalogPremium
        : null;

  const isLoading =
    quoteResolving ||
    ((isPending || isFetching) && premiumRaw == null && !quotePaused);

  return {
    label,
    premiumRaw,
    liveAskRaw: heldAskRaw,
    quotePaused,
    quoteResolving,
    isLoading,
  };
}
