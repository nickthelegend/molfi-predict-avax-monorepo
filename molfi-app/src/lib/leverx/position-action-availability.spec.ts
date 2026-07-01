import { describe, expect, it } from "vitest";
import type { LeveragedPosition } from "@/lib/leverx/indexer-client";
import {
  getPositionActionAvailability,
  isIndexerStaleOpenPosition,
} from "@/lib/leverx/position-action-availability";
import { positionShowsManageAction } from "@/lib/leverx/position-quantity";

function basePosition(overrides: Partial<LeveragedPosition> = {}): LeveragedPosition {
  return {
    position_key: "oracle:1:2:0:0:0",
    account_id: "0xacc",
    owner: "0xowner",
    predict_manager_id: "0xmgr",
    oracle_id: "0xoracle",
    expiry_ms: Date.now() - 60_000,
    strike: 2,
    higher_strike: 0,
    is_up: false,
    is_range: false,
    open_quantity: 10,
    margin_quote: 1_000_000,
    borrow_quote: 0,
    peak_borrow_quote: 0,
    leverage_bps: 10_000,
    mint_cost: 1_000_000,
    last_order_type: 0,
    status: "open",
    opened_at_ms: Date.now() - 120_000,
    closed_at_ms: null,
    realized_payout: 0,
    entry_mark: null,
    closing_mark: null,
    close_debt_repaid: 0,
    close_interest_paid: 0,
    close_surplus_quote: 0,
    ...overrides,
  };
}

describe("positionShowsManageAction", () => {
  it("shows manage for open positions", () => {
    expect(positionShowsManageAction({ status: "open", borrow_quote: 0 })).toBe(true);
  });

  it("hides manage for settled positions without debt", () => {
    expect(
      positionShowsManageAction({ status: "settled", borrow_quote: 0 }),
    ).toBe(false);
  });

  it("shows manage for ended positions with outstanding borrow", () => {
    expect(
      positionShowsManageAction({ status: "closed", borrow_quote: 1_000_000 }),
    ).toBe(true);
  });

  it("shows manage when indexer flags stranded custody", () => {
    expect(
      positionShowsManageAction({
        status: "closed",
        borrow_quote: 0,
        action_hints: {
          close_source: "predict_external",
          leverx_custody_complete: false,
          needs_custody_recovery: true,
          external_redeem_payout_quote: 500_000,
          custody_recovered_quote: 0,
          recommended_actions: ["recover_custody"],
          primary_cta: "recover_custody",
          empty_state_hint: "stranded_custody",
        },
      }),
    ).toBe(true);
  });
});

describe("isIndexerStaleOpenPosition", () => {
  it("is true when indexer lists contracts but on-chain read is zero", () => {
    expect(isIndexerStaleOpenPosition(basePosition(), 0n)).toBe(true);
  });

  it("is false when on-chain quantity matches indexer", () => {
    expect(isIndexerStaleOpenPosition(basePosition(), 10n)).toBe(false);
  });
});

describe("getPositionActionAvailability", () => {
  it("offers settle when expired, oracle settled, and on-chain qty > 0", () => {
    const result = getPositionActionAvailability({
      position: basePosition(),
      onChainQuantity: 10n,
      quantityLoading: false,
      oracleSettled: true,
      now: Date.now(),
    });
    expect(result.canSettle).toBe(true);
    expect(result.emptyState).toBeNull();
  });

  it("does not offer redeem or settle when on-chain qty is zero but indexer is stale", () => {
    const result = getPositionActionAvailability({
      position: basePosition(),
      onChainQuantity: 0n,
      quantityLoading: false,
      oracleSettled: true,
      custody: {
        keyQuoteBalance: 0n,
        managerQuoteBalance: 0n,
        custodyLoading: false,
      },
      now: Date.now(),
    });
    expect(result.canCloseRedeem).toBe(false);
    expect(result.canSettle).toBe(false);
    expect(result.canRecoverCustody).toBe(false);
    expect(result.emptyState).toBe("index_stale");
  });

  it("offers recover when contracts are flat and key quote is stranded", () => {
    const result = getPositionActionAvailability({
      position: basePosition(),
      onChainQuantity: 0n,
      quantityLoading: false,
      oracleSettled: true,
      custody: {
        keyQuoteBalance: 1_930_000_000n,
        managerQuoteBalance: 0n,
        custodyLoading: false,
      },
      now: Date.now(),
    });
    expect(result.canRecoverCustody).toBe(true);
    expect(result.recoverKeyQuote).toBe(1_930_000_000n);
    expect(result.emptyState).toBe("stranded_custody");
  });

  it("offers close when oracle is live and on-chain qty > 0", () => {
    const result = getPositionActionAvailability({
      position: basePosition({ expiry_ms: Date.now() + 60_000 }),
      onChainQuantity: 5n,
      quantityLoading: false,
      oracleSettled: false,
      now: Date.now(),
    });
    expect(result.canCloseRedeem).toBe(true);
    expect(result.canSettle).toBe(false);
  });

  it("treats ended rows with zero on-chain qty as fully redeemed", () => {
    const result = getPositionActionAvailability({
      position: basePosition({ status: "settled", closed_at_ms: Date.now() }),
      onChainQuantity: 0n,
      quantityLoading: false,
      oracleSettled: false,
      now: Date.now(),
    });
    expect(result.emptyState).toBe("fully_redeemed");
  });

  it("suggests recover when indexer flags external predict close", () => {
    const result = getPositionActionAvailability({
      position: basePosition({
        status: "closed",
        open_quantity: 0,
        borrow_quote: 0,
        external_redeem_payout_quote: 500_000,
        leverx_custody_complete: false,
        action_hints: {
          close_source: "predict_external",
          leverx_custody_complete: false,
          needs_custody_recovery: true,
          external_redeem_payout_quote: 500_000,
          custody_recovered_quote: 0,
          recommended_actions: ["recover_custody"],
          primary_cta: "recover_custody",
          empty_state_hint: "stranded_custody",
        },
      }),
      onChainQuantity: 0n,
      quantityLoading: false,
      oracleSettled: true,
      now: Date.now(),
    });
    expect(result.canRecoverCustody).toBe(true);
    expect(result.recoverManagerQuote).toBe(500_000n);
    expect(result.emptyState).toBe("stranded_custody");
  });

  it("allows manager recover with outstanding debt when manager holds quote", () => {
    const result = getPositionActionAvailability({
      position: basePosition({
        status: "closed",
        open_quantity: 0,
        borrow_quote: 200_000,
        action_hints: {
          close_source: "predict_external",
          leverx_custody_complete: false,
          needs_custody_recovery: true,
          external_redeem_payout_quote: 500_000,
          custody_recovered_quote: 0,
          recommended_actions: ["repay_debt", "recover_custody"],
          primary_cta: "repay_debt",
          empty_state_hint: null,
        },
      }),
      onChainQuantity: 0n,
      quantityLoading: false,
      oracleSettled: true,
      custody: {
        keyQuoteBalance: 0n,
        managerQuoteBalance: 500_000n,
        custodyLoading: false,
      },
      now: Date.now(),
    });
    expect(result.canRepayDebt).toBe(true);
    expect(result.canRecoverCustody).toBe(true);
    expect(result.canRecoverKeyQuote).toBe(false);
    expect(result.canRecoverManagerQuote).toBe(true);
    expect(result.recoverManagerQuote).toBe(500_000n);
  });
});
