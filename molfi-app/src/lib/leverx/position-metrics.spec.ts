import { describe, expect, it } from "vitest";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import { computePositionMarkToMarket } from "@/lib/leverx/position-metrics";
import type { RedeemQuote } from "@/lib/leverx/quotes";
import { PREDICT_PRICE_SCALE } from "@/lib/leverx/constants";

function basePosition(overrides: Partial<LeveragedPosition> = {}): LeveragedPosition {
  return {
    position_key: "pk1",
    account_id: "acc1",
    owner: "0xowner",
    oracle_id: "btc",
    expiry_ms: Date.now() + 86_400_000,
    strike: 100_000,
    higher_strike: 0,
    is_up: true,
    is_range: false,
    status: "open",
    open_quantity: 1_000_000,
    margin_quote: 10_000_000,
    borrow_quote: 90_000_000,
    mint_cost: 95_000_000,
    leverage_bps: 100_000,
    predict_manager_id: "mgr1",
    peak_borrow_quote: 90_000_000,
    entry_mark: 0,
    closing_mark: 0,
    realized_payout: 0,
    close_debt_repaid: 0,
    close_interest_paid: 0,
    close_surplus_quote: 0,
    ...overrides,
  } as LeveragedPosition;
}

function redeemQuote(payoutAtoms: bigint): RedeemQuote {
  return {
    expectedPayout: payoutAtoms,
    marketBidPerUnit: (50n * PREDICT_PRICE_SCALE) / 100n,
  };
}

describe("computePositionMarkToMarket", () => {
  it("includes key-locked quote in health, net equity, and unrealized P&L", () => {
    const position = basePosition();
    const quote = redeemQuote(100_000_000n);
    const ledger = {
      borrowedQuote: 90_000_000n,
      leverageBps: 100_000n,
      keyQuoteBalance: 5_000_000n,
    };

    const mtm = computePositionMarkToMarket(position, quote, false, 10_500, ledger, true);

    expect(mtm.markValueUsd).toBe(100);
    expect(mtm.keyQuoteUsd).toBe(5);
    expect(mtm.collateralUsd).toBe(105);
    expect(mtm.netEquityUsd).toBe(15);
    expect(mtm.unrealizedPnlUsd).toBe(5);
    expect(mtm.healthBps).toBe(Math.round((105 / 90) * 10_000));
  });

  it("matches redeem bid only when key ledger is empty", () => {
    const position = basePosition({
      margin_quote: 10_000_000,
      borrow_quote: 0,
      peak_borrow_quote: 0,
      mint_cost: 10_000_000,
      leverage_bps: 10_000,
    });
    const quote = redeemQuote(12_000_000n);
    const ledger = {
      borrowedQuote: 0n,
      leverageBps: 10_000n,
      keyQuoteBalance: 0n,
    };

    const mtm = computePositionMarkToMarket(position, quote, false, 10_500, ledger, true);

    expect(mtm.netEquityUsd).toBe(12);
    expect(mtm.unrealizedPnlUsd).toBe(2);
  });

  it("stays not live until on-chain ledger inputs are available", () => {
    const position = basePosition();
    const quote = redeemQuote(100_000_000n);

    const pending = computePositionMarkToMarket(position, quote, false, 10_500, null, false);
    expect(pending.isLive).toBe(false);

    const ledger = {
      borrowedQuote: 90_000_000n,
      leverageBps: 100_000n,
      keyQuoteBalance: 5_000_000n,
    };
    const live = computePositionMarkToMarket(position, quote, false, 10_500, ledger, true);
    expect(live.isLive).toBe(true);
  });
});
