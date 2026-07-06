import { describe, expect, it } from "vitest";
import { stellarMarketToRow } from "@/lib/stellar/market-adapter";
import { MARKET_STATUS } from "@/lib/stellar/contracts";
import type { OnChainMarket } from "@/lib/stellar/soroban";

function baseMarket(overrides: Partial<OnChainMarket> = {}): OnChainMarket {
  return {
    id: "0xabc123",
    question: "Will BTC be >= $60k at close?",
    closeTs: 1_800_000_000, // seconds
    status: MARKET_STATUS.TRADING,
    outcome: 2,
    ...overrides,
  };
}

describe("stellarMarketToRow", () => {
  it("maps id/oracleId/question/expiry straight through", () => {
    const row = stellarMarketToRow(baseMarket());
    expect(row.id).toBe("0xabc123");
    expect(row.oracleId).toBe("0xabc123");
    expect(row.question).toBe("Will BTC be >= $60k at close?");
    // expiry is closeTs converted from seconds to milliseconds
    expect(row.expiry).toBe(1_800_000_000 * 1000);
  });

  it("disables the premium/ask fetch via zeroed strike fields", () => {
    const row = stellarMarketToRow(baseMarket());
    expect(row.strike).toBe(0);
    expect(row.strikeRaw).toBe(0);
    expect(row.higherStrikeRaw).toBe(0);
    expect(row.lastAskPremium).toBeNull();
  });

  it("maps status TRADING to 'active'", () => {
    const row = stellarMarketToRow(baseMarket({ status: MARKET_STATUS.TRADING }));
    expect(row.status).toBe("active");
    expect(row.onchainStatus).toBe(MARKET_STATUS.TRADING);
  });

  it("maps status RESOLVING to 'active' (only RESOLVED counts as resolved)", () => {
    const row = stellarMarketToRow(baseMarket({ status: MARKET_STATUS.RESOLVING }));
    expect(row.status).toBe("active");
  });

  it("maps status RESOLVED to 'resolved' and carries the outcome", () => {
    const row = stellarMarketToRow(baseMarket({ status: MARKET_STATUS.RESOLVED, outcome: 0 }));
    expect(row.status).toBe("resolved");
    expect(row.onchainOutcome).toBe(0);
  });

  describe("asset detection from the question text", () => {
    it.each([
      ["Will BTC be >= $60k at close?", "BTC"],
      ["Will Bitcoin close above $60k?", "BTC"],
      ["Will ETH flip BTC this cycle?", "ETH"], // first match wins
      ["Is Ethereum going to $5k?", "ETH"],
      ["Will Stellar (XLM) hold support?", "XLM"],
      ["Will SOL outperform ETH?", "SOL"],
      ["Will Solana ship firedancer?", "SOL"],
      ["USDC depeg event this week?", "USDC"],
      ["Will the sky be blue tomorrow?", "XLM"], // no match → default
    ])("%s -> %s", (question, asset) => {
      const row = stellarMarketToRow(baseMarket({ question }));
      expect(row.asset).toBe(asset);
    });

    it("is case-insensitive", () => {
      const row = stellarMarketToRow(baseMarket({ question: "will btc hit 100k?" }));
      expect(row.asset).toBe("BTC");
    });
  });

  it("always marks isUp true and isRange false (binary market convention)", () => {
    const row = stellarMarketToRow(baseMarket());
    expect(row.isUp).toBe(true);
    expect(row.isRange).toBe(false);
  });
});
