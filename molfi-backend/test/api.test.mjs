// Integration tests: boot the Express app against an in-memory MongoDB and
// exercise the REST routes. Chain reads are mocked (read-only, deterministic) —
// NO live Fuji RPC and NO transactions. The BN254 confidential-commit path uses
// the real zk module.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { bootApp, mockChain } from "./helpers.mjs";

let h;
const lastPrice = { BTC: 60000, ETH: 3000 };

before(async () => {
  h = await bootApp({ lastPrice });
});
after(async () => {
  await h.close();
});

// Seed an open off-chain market directly in Mongo.
async function seedMarket(overrides = {}) {
  const doc = {
    _id: overrides._id || `BTC-15m-60000-${Date.now()}`,
    symbol: "BTC",
    icon: "https://icon",
    cadenceMins: 15,
    category: "crypto",
    question: "Will BTC be above $60,000?",
    strike: 60000,
    side: "above",
    openPrice: 60000,
    createdAt: Date.now(),
    closeTs: Date.now() + 15 * 60 * 1000,
    status: "open",
    outcome: null,
    settlePrice: null,
    ...overrides,
  };
  await h.db.collection("markets").insertOne(doc);
  return doc;
}

test("GET /api/health returns ok + live prices", async () => {
  const { status, body } = await h.get("/api/health");
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.prices.BTC, 60000);
});

test("GET /api/markets lists open markets, decorated with yesPrice + spot", async () => {
  await seedMarket({ _id: "BTC-15m-60000-open1" });
  const { status, body } = await h.get("/api/markets");
  assert.equal(status, 200);
  assert.ok(Array.isArray(body));
  const m = body.find((x) => x._id === "BTC-15m-60000-open1");
  assert.ok(m, "seeded market present");
  assert.equal(m.spot, 60000);
  assert.ok(m.yesPrice >= 0 && m.yesPrice <= 1);
  assert.equal(m.oi, 0);
});

test("GET /api/markets/:id returns a single market; 404 when missing", async () => {
  await seedMarket({ _id: "BTC-15m-60000-single" });
  const ok = await h.get("/api/markets/BTC-15m-60000-single");
  assert.equal(ok.status, 200);
  assert.equal(ok.body._id, "BTC-15m-60000-single");

  const miss = await h.get("/api/markets/does-not-exist");
  assert.equal(miss.status, 404);
});

test("POST /api/bet records to Mongo (no broadcast) + shows up in /api/positions", async () => {
  await seedMarket({ _id: "BTC-15m-60000-bet" });
  const addr = "0x1111111111111111111111111111111111111111";
  const bet = await h.post("/api/bet", { marketId: "BTC-15m-60000-bet", side: "yes", amount: 50, address: addr });
  assert.equal(bet.status, 200);
  assert.equal(bet.body.side, "yes");
  assert.equal(bet.body.amount, 50);
  assert.ok(Math.abs(bet.body.fee - 1) < 1e-6, "2% fee = 1.0");
  assert.ok(bet.body._id, "insertedId returned");

  const pos = await h.get(`/api/positions/${addr}`);
  assert.equal(pos.status, 200);
  assert.equal(pos.body.length, 1);
  assert.equal(pos.body[0].marketId, "BTC-15m-60000-bet");
});

test("POST /api/bet validates input + rejects closed markets", async () => {
  const bad = await h.post("/api/bet", { marketId: "x", side: "maybe", amount: 10, address: "0xabc" });
  assert.equal(bad.status, 400);

  await seedMarket({ _id: "BTC-15m-60000-closed", status: "resolved", outcome: "yes" });
  const closed = await h.post("/api/bet", { marketId: "BTC-15m-60000-closed", side: "yes", amount: 10, address: "0xabc" });
  assert.equal(closed.status, 400);

  const missing = await h.post("/api/bet", { marketId: "nope", side: "yes", amount: 10, address: "0xabc" });
  assert.equal(missing.status, 404);
});

test("GET /api/leaderboard aggregates indexed on-chain bet/redeem events", async () => {
  const addr = "0x2222222222222222222222222222222222222222";
  await h.db.collection("onchainTrades").insertMany([
    { _id: "t1", kind: "bet", market: "0xdead", address: addr, amount: 100, ts: Date.now() },
    { _id: "t2", kind: "redeem", market: "0xdead", address: addr, amount: 180, ts: Date.now() },
  ]);
  const { status, body } = await h.get("/api/leaderboard");
  assert.equal(status, 200);
  const row = body.find((r) => r.address === addr);
  assert.ok(row, "leaderboard row present");
  assert.equal(row.volume, 100);
  assert.equal(row.pnl, 80);
  assert.equal(row.trades, 1);
  assert.equal(row.wins, 1);
});

test("vaults: deposit updates TVL + position + activity/history", async () => {
  const addr = "0x3333333333333333333333333333333333333333";
  const dep = await h.post("/api/vaults/deposit", { address: addr, amount: 500 });
  assert.equal(dep.status, 200);
  assert.equal(dep.body.deposited, 500);

  const vaults = await h.get("/api/vaults");
  assert.equal(vaults.status, 200);
  assert.ok(vaults.body[0].tvl >= 500, "TVL reflects the deposit");

  const pos = await h.get(`/api/vaults/position/${addr}`);
  assert.equal(pos.status, 200);
  assert.equal(pos.body.deposited, 500);
  assert.ok(pos.body.sharePct > 0);
});

test("GET /api/onchain/markets returns [] when no indexed/on-chain markets", async () => {
  const { status, body } = await h.get("/api/onchain/markets");
  assert.equal(status, 200);
  assert.ok(Array.isArray(body));
});

test("GET /api/onchain/markets reads an indexed doc + escrow OI", async () => {
  await h.db.collection("onchainMarkets").insertOne({
    _id: "0xfeed",
    symbol: "BTC",
    question: "on-chain BTC market",
    closeTs: Date.now() + 60 * 60 * 1000,
    cadenceMins: 15,
    oracle: "chainlink",
    resolved: false,
    createdAt: Date.now(),
    strikeUsd: 60000,
  });
  await h.db.collection("onchainTrades").insertOne({
    _id: "oi1", kind: "bet", market: "0xfeed", address: "0xabc", outcome: 0, amount: 25, ts: Date.now(),
  });
  const { status, body } = await h.get("/api/onchain/markets");
  assert.equal(status, 200);
  const m = body.find((x) => x.marketId === "0xfeed");
  assert.ok(m, "indexed on-chain market present");
  assert.equal(m.oi, 25);
  assert.equal(m.bets, 1);
});

test("GET /api/onchain/positions/:address returns indexed trades", async () => {
  const addr = "0x4444444444444444444444444444444444444444";
  await h.db.collection("onchainTrades").insertOne({
    _id: "p1", kind: "bet", market: "0xfeed", address: addr, outcome: 1, amount: 12, ts: Date.now(), txHash: "0xtx",
  });
  const { status, body } = await h.get(`/api/onchain/positions/${addr}`);
  assert.equal(status, 200);
  assert.equal(body.length, 1);
  assert.equal(body[0].txHash, "0xtx");
  assert.equal(body[0].outcome, 1);
});

test("GET /api/prices/:symbol falls back to a live Chainlink point", async () => {
  // Boot a fresh app whose chain mock returns a Chainlink price (BTC feed).
  const local = await bootApp({ chain: mockChain({ chainlinkPrice: async () => 61234.5 }) });
  try {
    const { status, body } = await local.get("/api/prices/BTC");
    assert.equal(status, 200);
    assert.equal(body.length, 1);
    assert.equal(body[0].price, 61234.5);
  } finally {
    await local.close();
  }
});

test("BN254 /api/confidential/prepare-commit returns a well-formed note + commitment", async () => {
  const { status, body } = await h.post("/api/confidential/prepare-commit", { side: "NO" });
  assert.equal(status, 200);
  assert.equal(body.side, "NO");
  assert.equal(body.note.outcome, 1);
  assert.equal(body.denom, 100);
  // note fields are decimal BN254 field elements
  assert.match(body.note.secret, /^\d+$/);
  assert.match(body.note.nullifier, /^\d+$/);
  assert.match(body.note.recipient, /^\d+$/);
  // commitment is a 64-hex sha256 binding hash (reveals nothing about the side)
  assert.match(body.commitment, /^[0-9a-f]{64}$/);

  const yes = await h.post("/api/confidential/prepare-commit", { side: "YES" });
  assert.equal(yes.body.note.outcome, 0);
  assert.equal(yes.body.side, "YES");
});

test("confidential/prepare-claim: unresolved market → {resolved:false}", async () => {
  const { status, body } = await h.post("/api/confidential/prepare-claim", {
    note: { secret: "1", nullifier: "2", outcome: 0, recipient: "3" },
    marketId: "0xfeed",
    recipient: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(status, 200);
  assert.equal(body.resolved, false);
});

test("confidential/prepare-claim: missing recipient or non-numeric outcome → 400", async () => {
  const noRecipient = await h.post("/api/confidential/prepare-claim", {
    note: { secret: "1", nullifier: "2", outcome: 0, recipient: "3" },
    marketId: "0xfeed",
  });
  assert.equal(noRecipient.status, 400);

  const badOutcome = await h.post("/api/confidential/prepare-claim", {
    note: { secret: "1", nullifier: "2", outcome: "nope", recipient: "3" },
    marketId: "0xfeed",
    recipient: "0x1111111111111111111111111111111111111111",
  });
  assert.equal(badOutcome.status, 400);
});

test("confidential/prepare-claim: resolved but losing side → won:false (no proof burned)", async () => {
  // chain mock: resolved with winner=1 (NO); our note backs 0 (YES) → lost.
  const local = await bootApp({
    chain: mockChain({ isResolved: async () => true, winningOutcome: async () => 1 }),
  });
  try {
    const { status, body } = await local.post("/api/confidential/prepare-claim", {
      note: { secret: "1", nullifier: "2", outcome: 0, recipient: "3" },
      marketId: "0xfeed",
      recipient: "0x1111111111111111111111111111111111111111",
    });
    assert.equal(status, 200);
    assert.equal(body.resolved, true);
    assert.equal(body.won, false);
    assert.equal(body.winningOutcome, 1);
  } finally {
    await local.close();
  }
});

test("market chat: post a comment + list it back", async () => {
  const addr = "0x5555555555555555555555555555555555555555";
  const posted = await h.post("/api/markets/0xfeed/comments", { address: addr, type: "text", text: "gm molfi" });
  assert.equal(posted.status, 200);
  assert.equal(posted.body.text, "gm molfi");

  const list = await h.get("/api/markets/0xfeed/comments");
  assert.equal(list.status, 200);
  assert.ok(list.body.some((c) => c.text === "gm molfi"));
});
