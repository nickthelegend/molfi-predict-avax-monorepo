/**
 * Molfi backend — Express app factory (import-safe).
 *
 * `createApp({ db, chain, zk, lastPrice })` wires every REST route and returns
 * the Express `app` WITHOUT connecting Mongo or calling listen(). Production
 * (server.js) injects the real Mongo db + live chain/zk modules and starts the
 * background pollers; tests inject an in-memory Mongo db and (optionally) a
 * mocked chain so no live RPC / transaction is ever required.
 *
 * On-chain reads are repointed to **Avalanche Fuji** (viem): markets from
 * MolfiMarket + PredictEscrow pools, prices from Chainlink feeds, ZK confidential
 * proofs are BN254 (snarkjs). The backend NEVER broadcasts a transaction — the
 * app's own wallet does the real on-chain bets; /api/bet records to Mongo only.
 */
import express from "express";
import { randomBytes, createHash } from "node:crypto";

const FEE_RATE = 0.02; // 2% trading fee → LP vault
export const VAULT_ID = "molfi-lp";

const icon = (s) =>
  `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${String(s).toLowerCase()}.png`;

const r2 = (n) => Math.round(n * 100) / 100;

/** Implied YES probability for a price market (spot vs strike + time decay). */
function impliedYes(px, strike, closeTs, createdAt) {
  if (px == null || !strike) return 0.5;
  const edge = (px - strike) / strike;
  const span = Math.max(1, closeTs - createdAt);
  const remaining = Math.max(0, closeTs - Date.now()) / span;
  const p = 1 / (1 + Math.exp(-edge * 120 * (0.4 + 0.6 * (1 - remaining))));
  return Math.min(0.99, Math.max(0.01, p));
}

const cleanText = (s) => String(s || "").slice(0, 2000);
const commentKind = (t) => (t === "gif" ? "gif" : t === "image" ? "image" : "text");
function serializeComment(d) {
  return {
    id: d._id,
    address: d.address,
    type: d.type,
    text: d.text || "",
    path: d.path || "",
    likes: d.likes || [],
    ts: d.ts,
    replies: (d.replies || []).map((r) => ({
      id: r.id,
      address: r.address,
      type: r.type,
      text: r.text || "",
      path: r.path || "",
      likes: r.likes || [],
      ts: r.ts,
    })),
  };
}

/**
 * Build the Express app.
 * @param {object} deps
 * @param {import('mongodb').Db} deps.db  connected Mongo db (in-memory in tests)
 * @param {object} deps.chain  chain.js module (or a mock with the same reads)
 * @param {object} deps.zk     zk.js module (or a mock)
 * @param {Record<string, number>} [deps.lastPrice]  shared live-spot cache
 */
export function createApp({ db, chain, zk, lastPrice = {} }) {
  const Prices = db.collection("prices");
  const Markets = db.collection("markets");
  const Positions = db.collection("positions");
  const Vaults = db.collection("vaults");
  const VaultDeposits = db.collection("vaultDeposits");
  const OnchainTrades = db.collection("onchainTrades");
  const OnchainMarkets = db.collection("onchainMarkets");
  const Comments = db.collection("comments");

  const app = express();
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "8mb" })); // 8mb: base64 image uploads for market chat

  // Keep the vault doc honest: TVL + fees derived from real source events.
  async function reconcileVault() {
    const [dep] = await VaultDeposits.aggregate([
      { $match: { vaultId: VAULT_ID } },
      { $group: { _id: null, principal: { $sum: "$amount" }, depositors: { $sum: 1 } } },
    ]).toArray();
    const [fee] = await Positions.aggregate([
      { $group: { _id: null, fees: { $sum: "$fee" } } },
    ]).toArray();
    const principal = dep?.principal ?? 0;
    const fees = r2(fee?.fees ?? 0);
    await Vaults.updateOne(
      { _id: VAULT_ID },
      { $set: { tvl: r2(principal + fees), feesEarned: fees, depositors: dep?.depositors ?? 0 } },
      { upsert: true },
    );
  }

  function impliedYesMkt(m, px) {
    if (px == null) return 0.5;
    const edge = (px - m.strike) / m.strike;
    const remaining = Math.max(0, m.closeTs - Date.now()) / ((m.cadenceMins || 30) * 60 * 1000);
    const k = m.symbol === "BTC" || m.symbol === "ETH" ? 120 : 200;
    const p = 1 / (1 + Math.exp(-edge * k * (0.4 + 0.6 * (1 - remaining))));
    return Math.min(0.99, Math.max(0.01, p));
  }
  const decorate = (m) => ({
    ...m,
    yesPrice: m.status === "resolved" ? (m.outcome === "yes" ? 1 : 0) : impliedYesMkt(m, lastPrice[m.symbol]),
    spot: lastPrice[m.symbol] ?? null,
  });

  // ── health ───────────────────────────────────────────────────────────────
  app.get("/api/health", (_req, res) => res.json({ ok: true, prices: lastPrice }));

  // ── Market chat (text / gif / image; images pinned to IPFS via Pinata) ─────
  const PINATA_JWT = process.env.PINATA_JWT || "";
  const PINATA_GATEWAY = (process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud").replace(/\/$/, "");
  async function pinataUpload(buffer, filename, contentType) {
    if (!PINATA_JWT) throw new Error("Pinata not configured");
    const fd = new FormData();
    fd.append("file", new Blob([buffer], { type: contentType }), filename);
    fd.append("pinataMetadata", JSON.stringify({ name: filename, keyvalues: { app: "molfi" } }));
    const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: { Authorization: `Bearer ${PINATA_JWT}` },
      body: fd,
    });
    if (!r.ok) throw new Error(`Pinata ${r.status}: ${await r.text()}`);
    const j = await r.json();
    return { cid: j.IpfsHash, url: `${PINATA_GATEWAY}/ipfs/${j.IpfsHash}` };
  }

  app.post("/api/pinata/upload", async (req, res) => {
    try {
      const { dataUrl, filename } = req.body || {};
      const m = /^data:([^;]+);base64,(.+)$/.exec(String(dataUrl || ""));
      if (!m) return res.status(400).json({ error: "expected a base64 image data URL" });
      if (!m[1].startsWith("image/")) return res.status(400).json({ error: "images only" });
      const buf = Buffer.from(m[2], "base64");
      if (buf.length > 6 * 1024 * 1024) return res.status(413).json({ error: "image too large (max 6MB)" });
      res.json(await pinataUpload(buf, filename || `molfi-${Date.now()}.img`, m[1]));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/markets/:id/comments", async (req, res) => {
    try {
      const lim = Math.min(Number(req.query.limit) || 20, 100);
      const rows = await Comments.find({ marketId: req.params.id }).sort({ ts: -1 }).limit(lim).toArray();
      res.json(rows.map(serializeComment));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/markets/:id/comments", async (req, res) => {
    try {
      const { address, type, text, path } = req.body || {};
      if (!address) return res.status(400).json({ error: "address required" });
      const kind = commentKind(type);
      if (kind === "text" && !cleanText(text).trim()) return res.status(400).json({ error: "empty comment" });
      if (kind !== "text" && !path) return res.status(400).json({ error: "path required" });
      const doc = {
        _id: randomBytes(12).toString("hex"),
        marketId: req.params.id,
        address: String(address),
        type: kind,
        text: cleanText(text),
        path: kind === "text" ? "" : String(path),
        likes: [],
        replies: [],
        ts: Date.now(),
      };
      await Comments.insertOne(doc);
      res.json(serializeComment(doc));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/comments/:id/like", async (req, res) => {
    try {
      const { address, liked } = req.body || {};
      if (!address) return res.status(400).json({ error: "address required" });
      await Comments.updateOne(
        { _id: req.params.id },
        liked ? { $pull: { likes: address } } : { $addToSet: { likes: address } },
      );
      const doc = await Comments.findOne({ _id: req.params.id });
      res.json(doc ? serializeComment(doc) : {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/comments/:id/reply", async (req, res) => {
    try {
      const { address, type, text, path } = req.body || {};
      if (!address) return res.status(400).json({ error: "address required" });
      const kind = commentKind(type);
      const reply = {
        id: randomBytes(8).toString("hex"),
        address: String(address),
        type: kind,
        text: cleanText(text),
        path: kind === "text" ? "" : String(path || ""),
        likes: [],
        ts: Date.now(),
      };
      await Comments.updateOne({ _id: req.params.id }, { $push: { replies: reply } });
      const doc = await Comments.findOne({ _id: req.params.id });
      res.json(doc ? serializeComment(doc) : {});
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/comments/:id", async (req, res) => {
    try {
      const address = req.query.address || req.body?.address;
      const doc = await Comments.findOne({ _id: req.params.id });
      if (!doc) return res.json({ ok: true });
      if (doc.address !== address) return res.status(403).json({ error: "not your comment" });
      await Comments.deleteOne({ _id: req.params.id });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/comments/:id/replies/:replyId", async (req, res) => {
    try {
      const address = req.query.address || req.body?.address;
      const doc = await Comments.findOne({ _id: req.params.id });
      if (!doc) return res.json({ ok: true });
      const reply = (doc.replies || []).find((r) => r.id === req.params.replyId);
      if (reply && reply.address !== address) return res.status(403).json({ error: "not your reply" });
      await Comments.updateOne({ _id: req.params.id }, { $pull: { replies: { id: req.params.replyId } } });
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── On-chain markets (read from MolfiMarket + PredictEscrow, enriched) ──────
  // Prefer the Mongo index of on-chain markets (kept fresh by the poller); fall
  // back to reading MolfiMarket directly, then to the seeded file.
  async function enrichOnChainDoc(m) {
    const spot = lastPrice[m.symbol] ?? null;
    const strike = m.strikeUsd ?? null;
    let oi = 0;
    let bets = 0;
    try {
      const oiRows = await OnchainTrades.aggregate([
        { $match: { kind: "bet", market: m._id } },
        { $group: { _id: "$market", oi: { $sum: "$amount" }, bets: { $sum: 1 } } },
      ]).toArray();
      if (oiRows[0]) {
        oi = oiRows[0].oi || 0;
        bets = oiRows[0].bets || 0;
      }
    } catch {
      /* best-effort */
    }
    return {
      marketId: m._id,
      symbol: m.symbol,
      icon: icon(m.symbol),
      question: m.question,
      closeTs: m.closeTs,
      cadenceMins: m.cadenceMins,
      oracle: m.oracle || "chainlink",
      resolved: !!m.resolved,
      strike,
      spot,
      yesPrice: m.resolved ? (m.outcome === 0 ? 1 : 0) : impliedYes(spot, strike, m.closeTs, m.createdAt),
      oi,
      bets,
    };
  }

  app.get("/api/onchain/markets", async (req, res) => {
    try {
      const closed = req.query.status === "closed";
      const filter = closed ? { resolved: true } : { resolved: false, closeTs: { $gt: Date.now() } };
      const live = await OnchainMarkets.find(filter)
        .sort(closed ? { resolvedAt: -1 } : { closeTs: 1 })
        .limit(20)
        .toArray();
      if (live.length) {
        const out = await Promise.all(live.map(enrichOnChainDoc));
        return res.json(out);
      }
      if (closed) return res.json([]);
      // Fallback: read MolfiMarket on-chain directly (Fuji, read-only).
      try {
        const ids = await chain.listMarketIds();
        const rows = [];
        for (const id of ids) {
          const mk = await chain.getMarket(id);
          if (!mk) continue;
          const closeMs = mk.closeTs * 1000;
          if (mk.status === 2 || (closeMs && closeMs <= Date.now())) continue; // resolved / past close
          const pools = await chain.escrowPools(id).catch(() => ({ yes: 0, no: 0 }));
          rows.push({
            marketId: id,
            symbol: "",
            icon: "",
            question: mk.question,
            closeTs: closeMs,
            oracle: "chainlink",
            resolved: mk.status === 2,
            strike: null,
            spot: null,
            yesPrice: 0.5,
            oi: r2(pools.yes + pools.no),
            bets: 0,
          });
        }
        return res.json(rows.slice(0, 20));
      } catch (e) {
        // Live on-chain read failed (RPC issue, etc). No index and no live
        // data available — return an honest empty list instead of masking
        // the outage with stale seeded data.
        console.warn(`[onchain/markets] live chain read failed: ${e.message}`);
        return res.json([]);
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/onchain/markets/:id", async (req, res) => {
    try {
      const m = await OnchainMarkets.findOne({ _id: req.params.id });
      if (m) return res.json(await enrichOnChainDoc(m));
      // Not indexed — read MolfiMarket directly.
      const mk = await chain.getMarket(req.params.id);
      if (!mk) return res.status(404).json({ error: "not found" });
      const resolved = mk.status === 2;
      res.json({
        marketId: req.params.id,
        symbol: "",
        icon: "",
        question: mk.question,
        closeTs: mk.closeTs * 1000,
        oracle: "chainlink",
        resolved,
        outcome: resolved ? mk.outcome : null,
        strike: null,
        spot: null,
        yesPrice: resolved ? (mk.outcome === 0 ? 1 : 0) : 0.5,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── ZK proof service (BN254 Groth16, confidential_bet circuit) ─────────────
  // Public signals `[root, nullifierHash, outcome, recipient]`.
  app.get("/api/zk/proof", async (_req, res) => {
    try {
      if (!zk.circuitAvailable()) {
        return res.status(503).json({ error: "ZK circuit artifacts not available" });
      }
      // A fresh throwaway note stands in for a ZK-gated bet's nullifier.
      const note = { secret: zk.confField(), nullifier: zk.confField(), outcome: 0, recipient: zk.confField() };
      const p = await zk.proveNote(note);
      res.json({
        proof: p.proof,
        publicInputs: p.publicSignals,
        root: p.root,
        nullifierHash: p.nullifierHash,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Confidential betting: hidden commitment note → on-chain ZK claim ────────
  app.post("/api/confidential/prepare-commit", (req, res) => {
    try {
      res.json(zk.prepareCommit(req.body?.side));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/confidential/prepare-claim", async (req, res) => {
    try {
      const { note, marketId, recipient } = req.body || {};
      if (!note || !marketId) return res.status(400).json({ error: "note + marketId required" });
      if (!recipient) return res.status(400).json({ error: "recipient required" });
      if (note.outcome == null || Number.isNaN(Number(note.outcome))) {
        return res.status(400).json({ error: "note.outcome must be a number" });
      }
      let resolved = false;
      try {
        resolved = await chain.isResolved(marketId);
      } catch {
        resolved = false;
      }
      if (!resolved) return res.json({ resolved: false });
      const winner = await chain.winningOutcome(marketId);
      // A note that backed the losing side can't produce a proof the contract
      // accepts — tell the user up front instead of a guaranteed-to-revert claim.
      if (Number(note.outcome) !== Number(winner)) {
        return res.json({ resolved: true, won: false, winningOutcome: Number(winner) });
      }
      if (!zk.circuitAvailable()) {
        return res.status(503).json({ error: "ZK circuit artifacts not available" });
      }
      // Bind the proof's recipient to the claiming EVM address — the contract
      // injects uint256(uint160(recipient)) as a public input and the verifier
      // checks it, so without this the on-chain claim reverts with BadProof.
      const p = await zk.proveNote(note, recipient);
      res.json({
        resolved: true,
        won: true,
        winningOutcome: Number(winner),
        payout: zk.CONF_PAYOUT,
        proof: p.proof,
        root: p.root,
        nullifierHash: p.nullifierHash,
        recipientField: p.recipientField,
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // A wallet's real on-chain bets/redeems (indexed to Mongo, with tx hashes).
  app.get("/api/onchain/positions/:address", async (req, res) => {
    try {
      const q = { address: req.params.address };
      if (req.query.market) q.market = req.query.market;
      const rows = await OnchainTrades.find(q).sort({ ts: -1 }).limit(50).toArray();
      res.json(
        rows.map((r) => ({
          kind: r.kind,
          market: r.market,
          outcome: r.outcome ?? null,
          amount: r.amount,
          ts: r.ts,
          txHash: r.txHash || null,
        })),
      );
    } catch {
      res.json([]);
    }
  });

  // ── Off-chain (Mongo) markets ──────────────────────────────────────────────
  app.get("/api/markets", async (req, res) => {
    const closed = req.query.status === "closed";
    const list = await Markets.find(closed ? { status: "resolved" } : { status: "open" })
      .sort(closed ? { resolvedAt: -1 } : { closeTs: 1 })
      .limit(40)
      .toArray();
    const ids = list.map((m) => m._id);
    const oiRows = await Positions.aggregate([
      { $match: { marketId: { $in: ids } } },
      { $group: { _id: "$marketId", oi: { $sum: "$amount" }, bets: { $sum: 1 } } },
    ]).toArray();
    const oiMap = Object.fromEntries(oiRows.map((r) => [r._id, r]));
    res.json(
      list.map((m) => ({ ...decorate(m), oi: oiMap[m._id]?.oi || 0, bets: oiMap[m._id]?.bets || 0 })),
    );
  });

  app.get("/api/markets/:id", async (req, res) => {
    const m = await Markets.findOne({ _id: req.params.id });
    if (!m) return res.status(404).json({ error: "not found" });
    res.json(decorate(m));
  });

  app.get("/api/prices/:symbol", async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const limit = Math.min(Number(req.query.limit) || 240, 1000);
    // Mongo price history (populated by the poller from Chainlink feeds).
    const pts = await Prices.find({ symbol }).sort({ ts: -1 }).limit(limit).toArray();
    if (pts.length) return res.json(pts.reverse().map((p) => ({ ts: p.ts, price: p.price })));
    // No history yet — return a single live Chainlink point if the feed exists.
    try {
      const px = await chain.chainlinkPrice(symbol);
      if (px != null) return res.json([{ ts: Date.now(), price: px }]);
    } catch {
      /* ignore */
    }
    res.json([]);
  });

  app.get("/api/markets/:id/orderbook", async (req, res) => {
    const m = await Markets.findOne({ _id: req.params.id });
    if (!m) return res.status(404).json({ error: "not found" });
    const yes = impliedYesMkt(m, lastPrice[m.symbol]);
    const mk = (side) =>
      Array.from({ length: 6 }, (_, i) => {
        const px = side === "bid" ? yes - (i + 1) * 0.01 : yes + (i + 1) * 0.01;
        return { price: Math.min(0.99, Math.max(0.01, px)), size: Math.round(50 + ((i * 137) % 500)) };
      });
    res.json({ yes: { bids: mk("bid"), asks: mk("ask") } });
  });

  // Records the bet to Mongo ONLY — the REAL on-chain bet is done by the app's
  // wallet. The backend never broadcasts a transaction.
  app.post("/api/bet", async (req, res) => {
    const { marketId, side, amount, address } = req.body ?? {};
    if (!marketId || !["yes", "no"].includes(side) || !(Number(amount) > 0) || !address) {
      return res.status(400).json({ error: "marketId, side (yes|no), amount>0, address required" });
    }
    const m = await Markets.findOne({ _id: marketId });
    if (!m) return res.status(404).json({ error: "market not found" });
    if (m.status !== "open") return res.status(400).json({ error: "market closed" });

    const amt = Number(amount);
    const fee = Math.round(amt * FEE_RATE * 1e6) / 1e6;
    const entryYes = impliedYesMkt(m, lastPrice[m.symbol]);
    const doc = {
      marketId,
      symbol: m.symbol,
      question: m.question,
      address,
      side,
      amount: amt,
      fee,
      entryYes,
      entryPrice: side === "yes" ? entryYes : 1 - entryYes,
      status: "open",
      createdAt: Date.now(),
    };
    const r = await Positions.insertOne(doc);
    await reconcileVault();
    res.json({ ...doc, _id: r.insertedId });
  });

  app.get("/api/positions/:address", async (req, res) => {
    const list = await Positions.find({ address: req.params.address })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    res.json(list);
  });

  // Leaderboard — aggregated from indexed on-chain bet/redeem events.
  app.get("/api/leaderboard", async (_req, res) => {
    const rows = await OnchainTrades.aggregate([
      {
        $group: {
          _id: "$address",
          staked: { $sum: { $cond: [{ $eq: ["$kind", "bet"] }, "$amount", 0] } },
          redeemed: { $sum: { $cond: [{ $eq: ["$kind", "redeem"] }, "$amount", 0] } },
          trades: { $sum: { $cond: [{ $eq: ["$kind", "bet"] }, 1, 0] } },
          wins: { $sum: { $cond: [{ $eq: ["$kind", "redeem"] }, 1, 0] } },
        },
      },
    ]).toArray();
    const ranked = rows
      .filter((r) => r.trades > 0)
      .map((r) => ({
        address: r._id,
        volume: r2(r.staked),
        pnl: r2(r.redeemed - r.staked),
        trades: r.trades,
        wins: r.wins,
        winRate: r.trades > 0 ? Math.round((r.wins / r.trades) * 100) : 0,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 25)
      .map((r, i) => ({ rank: i + 1, ...r }));
    res.json(ranked);
  });

  // ── Vaults ─────────────────────────────────────────────────────────────────
  // TVL = mUSDC actually held by the escrow (real Fuji read); principal =
  // tracked deposits; fees = the excess. Falls back to the Mongo-reconciled doc.
  let vaultCache = { ts: 0, data: null };
  app.get("/api/vaults", async (_req, res) => {
    try {
      if (vaultCache.data && Date.now() - vaultCache.ts < 15_000) return res.json(vaultCache.data);
      const [dep] = await VaultDeposits.aggregate([
        { $match: { vaultId: VAULT_ID } },
        { $group: { _id: null, principal: { $sum: "$amount" }, depositors: { $sum: 1 } } },
      ]).toArray();
      const principal = dep?.principal ?? 0;
      let tvl = principal;
      try {
        const assetsUnits = await chain.musdcBalance(chain.CONTRACTS.predictEscrow);
        const onchain = Number(assetsUnits) / chain.U;
        if (onchain > 0) tvl = onchain;
      } catch {
        /* fall back to reconciled principal + fees */
      }
      const [feeAgg] = await OnchainTrades.aggregate([
        { $match: { kind: "bet" } },
        { $group: { _id: null, staked: { $sum: "$amount" }, n: { $sum: 1 } } },
      ]).toArray();
      const [posFee] = await Positions.aggregate([
        { $group: { _id: null, fees: { $sum: "$fee" } } },
      ]).toArray();
      const fees = Math.max(0, r2((posFee?.fees ?? 0) + (feeAgg ? feeAgg.staked * 0.02 : 0)));
      if (tvl === principal) tvl = r2(principal + fees);
      const sharePrice = principal > 0 ? tvl / principal : 1;
      const lpCount = await VaultDeposits.estimatedDocumentCount();
      const data = [
        {
          _id: VAULT_ID,
          name: "Molfi LP Vault",
          asset: "mUSDC",
          tvl: r2(tvl),
          feesEarned: r2(fees),
          sharePrice: Math.round(sharePrice * 1e4) / 1e4,
          apr: principal > 0 ? Math.round((fees / principal) * 1000) / 10 : 0,
          depositors: lpCount,
          feeVolume: r2((feeAgg?.staked || 0) * 0.02),
          onchain: true,
        },
      ];
      vaultCache = { ts: Date.now(), data };
      res.json(data);
    } catch (e) {
      res.json([
        { _id: VAULT_ID, name: "Molfi LP Vault", asset: "mUSDC", tvl: 0, feesEarned: 0, sharePrice: 1, apr: 0, error: e.message },
      ]);
    }
  });

  app.get("/api/vaults/history", async (_req, res) => {
    const bets = await OnchainTrades.find({ kind: "bet" }).sort({ ts: 1 }).toArray();
    let fees = 0;
    const pts = bets.map((b) => {
      fees += b.amount * 0.02;
      return { ts: b.ts, tvl: r2(fees), fees: r2(fees) };
    });
    res.json(pts);
  });

  app.get("/api/vaults/activity", async (_req, res) => {
    const bets = await OnchainTrades.find({ kind: "bet" }).sort({ ts: -1 }).limit(12).toArray();
    res.json(
      bets.map((b) => ({ type: "fee", address: b.address, amount: r2(b.amount * 0.02), symbol: "on-chain bet", ts: b.ts })),
    );
  });

  app.post("/api/vaults/deposit", async (req, res) => {
    const { address, amount } = req.body ?? {};
    if (!address || !(Number(amount) > 0)) {
      return res.status(400).json({ error: "address + amount>0 required" });
    }
    const amt = Number(amount);
    await VaultDeposits.updateOne(
      { vaultId: VAULT_ID, address },
      { $inc: { amount: amt }, $setOnInsert: { vaultId: VAULT_ID, address, since: Date.now() } },
      { upsert: true },
    );
    await reconcileVault();
    res.json({ ok: true, deposited: amt });
  });

  app.get("/api/vaults/position/:address", async (req, res) => {
    try {
      const [me] = await VaultDeposits.aggregate([
        { $match: { vaultId: VAULT_ID, address: req.params.address } },
        { $group: { _id: null, mine: { $sum: "$amount" } } },
      ]).toArray();
      const [tot] = await VaultDeposits.aggregate([
        { $match: { vaultId: VAULT_ID } },
        { $group: { _id: null, all: { $sum: "$amount" } } },
      ]).toArray();
      const mine = me?.mine ?? 0;
      const all = tot?.all ?? 0;
      res.json({
        deposited: r2(mine),
        sharePct: all > 0 ? Math.round((mine / all) * 1000) / 10 : 0,
        earned: 0,
        shares: r2(mine),
      });
    } catch {
      res.json({ deposited: 0, sharePct: 0, earned: 0 });
    }
  });

  // Expose helpers the poller/start layer needs.
  app.locals.reconcileVault = reconcileVault;
  return app;
}
