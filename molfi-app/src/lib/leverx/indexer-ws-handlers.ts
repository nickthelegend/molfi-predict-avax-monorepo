import type { QueryClient } from "@tanstack/react-query";
import { indexerKeys } from "@/lib/leverx/indexer-query-keys";
import type {
  GlobalMarketTrade,
  LeveragedPosition,
  LimitMintOrder,
  OrderBookResponse,
  Paginated,
} from "@/lib/leverx/indexer-client";
import type { IndexerWsMessage } from "@/lib/leverx/indexer-ws";
import {
  invalidateLimitOrderQueries,
  invalidateMarketQuoteQueries,
  invalidatePortfolioQueries,
} from "@/lib/leverx/invalidate-queries";

function parseOrderbookChannel(channel: string) {
  const parts = channel.split(":");
  if (parts[0] !== "orderbook" || parts.length < 7) return null;
  return {
    oracleId: parts[1]!,
    expiryMs: Number(parts[2]),
    strike: Number(parts[3]),
    higherStrike: Number(parts[4]),
    isUp: parts[5] === "1",
    isRange: parts[6] === "1",
  };
}

function parsePositionsChannel(channel: string) {
  const parts = channel.split(":");
  if (parts[0] !== "positions" || !parts[1]) return null;
  return { owner: parts[1], oracleId: parts[2] };
}

function parseLimitsChannel(channel: string) {
  const parts = channel.split(":");
  if (parts[0] !== "limits" || !parts[1]) return null;
  return { owner: parts[1], oracleId: parts[2] };
}

export function applyIndexerStreamMessage(
  queryClient: QueryClient,
  message: IndexerWsMessage,
): void {
  if (!message.channel || message.data == null) return;

  if (message.type === "orderbook.snapshot") {
    const parsed = parseOrderbookChannel(message.channel);
    if (!parsed) return;
    queryClient.setQueryData(
      indexerKeys.orderBook(
        parsed.oracleId,
        parsed.expiryMs,
        parsed.strike,
        parsed.higherStrike,
        parsed.isUp,
        parsed.isRange,
      ),
      message.data as OrderBookResponse,
    );
    void invalidateMarketQuoteQueries(queryClient);
    return;
  }

  if (message.type === "trades.global.snapshot") {
    const oracleId = message.channel.replace("trades:global:", "");
    const page = message.data as Paginated<GlobalMarketTrade>;
    queryClient.setQueryData(indexerKeys.globalTrades(oracleId), page.items);
    void invalidateMarketQuoteQueries(queryClient);
    return;
  }

  if (message.type === "positions.snapshot") {
    const parsed = parsePositionsChannel(message.channel);
    if (!parsed) return;
    const page = message.data as Paginated<LeveragedPosition>;
    queryClient.setQueryData(
      indexerKeys.positions(parsed.owner, "open", parsed.oracleId),
      page.items,
    );
    void invalidatePortfolioQueries(queryClient);
    void invalidateMarketQuoteQueries(queryClient);
    return;
  }

  if (message.type === "limits.snapshot") {
    const parsed = parseLimitsChannel(message.channel);
    if (!parsed) return;
    const page = message.data as Paginated<LimitMintOrder>;
    queryClient.setQueryData(
      indexerKeys.limitOrders(parsed.owner, parsed.oracleId),
      page.items,
    );
    void invalidateLimitOrderQueries(queryClient);
  }
}
