/**
 * Vercel serverless entry for the Molfi backend.
 *
 * The backend (server.js) is normally a long-running process with interval
 * pollers. On Vercel we can't run intervals, so this handler lazily boots the
 * Express app once per warm instance and seeds prices + rolling markets on cold
 * start. Market data then lives in MongoDB and is served on every request.
 *
 * All /api/* routes are rewritten to this function (see vercel.json); Express
 * routes on the original req.url.
 */
import { MongoClient } from "mongodb";
import { createApp } from "../app.js";
import * as chain from "../chain.js";
import * as zk from "../zk.js";

const icon = (s) =>
  `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${s.toLowerCase()}.png`;

const TOKENS = {
  BTC: { pair: "BTC-USD", icon: icon("btc"), round: (p) => Math.round(p / 100) * 100 },
  ETH: { pair: "ETH-USD", icon: icon("eth"), round: (p) => Math.round(p / 10) * 10 },
  AVAX: { pair: "AVAX-USD", icon: icon("avax"), round: (p) => Math.round(p) },
  LINK: { pair: "LINK-USD", icon: icon("link"), round: (p) => Math.round(p) },
};
const CADENCES = [15, 30];
const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const fmtStrike = (sym, s) => `$${s.toLocaleString()}`;

let ready = null;

async function boot() {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db("molfi");
  const Prices = db.collection("prices");
  const Markets = db.collection("markets");
  await Markets.createIndex({ closeTs: 1, status: 1 }).catch(() => {});

  const lastPrice = {};

  async function fetchSpot(sym) {
    try {
      const r = await fetch(`https://api.coinbase.com/v2/prices/${TOKENS[sym].pair}/spot`);
      const v = Number((await r.json())?.data?.amount);
      if (Number.isFinite(v)) return v;
    } catch {
      /* fall through */
    }
    try {
      const px = await chain.chainlinkPrice(sym);
      if (px != null) return px;
    } catch {
      /* ignore */
    }
    return null;
  }

  async function pollPrices() {
    for (const sym of Object.keys(TOKENS)) {
      const p = await fetchSpot(sym);
      if (p != null) {
        lastPrice[sym] = p;
        await Prices.insertOne({ symbol: sym, price: p, ts: Date.now() }).catch(() => {});
      }
    }
  }

  async function ensureMarkets() {
    const now = Date.now();
    for (const sym of Object.keys(TOKENS)) {
      const price = lastPrice[sym];
      if (price == null) continue;
      const t = TOKENS[sym];
      for (const mins of CADENCES) {
        const slotMs = mins * 60 * 1000;
        const closeTs = Math.ceil(now / slotMs) * slotMs;
        const strike = t.round(price);
        const id = `${sym}-${mins}m-${strike}-${closeTs}`;
        if (await Markets.findOne({ _id: id })) continue;
        await Markets.insertOne({
          _id: id,
          symbol: sym,
          icon: t.icon,
          cadenceMins: mins,
          category: "crypto",
          question: `Will ${sym} be above ${fmtStrike(sym, strike)} at ${fmtTime(closeTs)}? (${mins}m)`,
          strike,
          side: "above",
          openPrice: price,
          createdAt: now,
          closeTs,
          status: "open",
          outcome: null,
          settlePrice: null,
        }).catch(() => {});
      }
    }
  }

  async function settleDue() {
    const now = Date.now();
    const due = await Markets.find({ status: "open", closeTs: { $lte: now } }).toArray();
    for (const m of due) {
      const settlePrice = lastPrice[m.symbol] ?? m.openPrice;
      const outcome = settlePrice >= m.strike ? "yes" : "no";
      await Markets.updateOne(
        { _id: m._id },
        { $set: { status: "resolved", outcome, settlePrice, resolvedAt: now } },
      ).catch(() => {});
    }
  }

  const app = createApp({ db, chain, zk, lastPrice });
  await pollPrices().catch(() => {});
  await settleDue().catch(() => {});
  await ensureMarkets().catch(() => {});
  return { app, pollPrices, ensureMarkets, settleDue };
}

function getReady() {
  if (!ready) ready = boot();
  return ready;
}

export default async function handler(req, res) {
  try {
    const { app, pollPrices, settleDue, ensureMarkets } = await getReady();
    // Opportunistic, non-blocking refresh so a warm instance keeps markets fresh.
    Promise.resolve()
      .then(() => pollPrices())
      .then(() => settleDue())
      .then(() => ensureMarkets())
      .catch(() => {});
    return app(req, res);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "backend boot failed", detail: String(e?.message || e) }));
  }
}
