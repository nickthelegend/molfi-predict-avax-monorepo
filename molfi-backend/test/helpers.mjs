// Shared test harness: boots the Express app against an in-memory MongoDB with a
// mocked (read-only) chain layer, so tests are deterministic and never touch
// live Fuji RPC or broadcast a transaction. The real BN254 zk module is used
// (proof-gen is slow but correct); pass a mock zk to skip heavy proving.
import { after } from "node:test";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createApp } from "../app.js";
import * as realZk from "../zk.js";

/** A deterministic mock of chain.js — no network, no transactions. */
export function mockChain(overrides = {}) {
  return {
    CONTRACTS: { predictEscrow: "0xfe00776f7EFc1208F2B89A34d6Acd408a0410c9c" },
    U: 10_000_000,
    async listMarketIds() {
      return [];
    },
    async getMarket() {
      return null;
    },
    async isResolved() {
      return false;
    },
    async winningOutcome() {
      return 0;
    },
    async escrowPools() {
      return { yes: 0, no: 0 };
    },
    async escrowPosition() {
      return 0;
    },
    async musdcBalance() {
      return 0n;
    },
    async chainlinkPrice() {
      return null;
    },
    ...overrides,
  };
}

// One shared in-memory MongoDB process for the whole test run — spinning up a
// fresh mongod per bootApp is slow and, under load, can stall. Each bootApp gets
// its own uniquely-named db for isolation. The server is torn down on exit.
let _sharedMongod = null;
let _sharedMongodPromise = null;
async function sharedMongoUri() {
  if (!_sharedMongodPromise) {
    _sharedMongodPromise = MongoMemoryServer.create().then((m) => {
      _sharedMongod = m;
      return m;
    });
  }
  const m = await _sharedMongodPromise;
  return m.getUri();
}
let _dbSeq = 0;

/** Immediately SIGKILL the mongod child by pid — a graceful MongoMemoryServer
 * stop can stall for tens of seconds under heavy machine load, which reads as a
 * hang even though every test has already passed. Killing the pid frees the
 * event loop instantly; the OS reaps the tmp dir. */
function killMongodNow(m) {
  try {
    const ii = m?._instanceInfo;
    const pid =
      ii?.instance?.mongodProcess?.pid ??
      ii?.instance?.childProcess?.pid ??
      ii?.childProcess?.pid;
    if (pid) process.kill(pid, "SIGKILL");
  } catch {
    /* already dead */
  }
}

// Register once: SIGKILL the mongod child on process exit as a backstop so a
// slow async stop can never wedge the run.
process.on("exit", () => {
  if (_sharedMongod) killMongodNow(_sharedMongod);
});

// After a file's tests complete, tear the shared mongod down fast: kill the
// child, then fire the library cleanup without awaiting its (slow) completion.
after(() => {
  if (_sharedMongod) {
    const m = _sharedMongod;
    _sharedMongod = null;
    _sharedMongodPromise = null;
    killMongodNow(m);
    m.stop({ force: true, doCleanup: true }).catch(() => {});
  }
});

/** Boot an app on a shared in-memory Mongo + http server. Returns { base, url, close }. */
export async function bootApp({ chain = mockChain(), zk = realZk, lastPrice = {} } = {}) {
  const uri = await sharedMongoUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(`molfi_test_${++_dbSeq}`);
  const app = createApp({ db, chain, zk, lastPrice });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  return {
    base,
    db,
    url: (path) => `${base}${path}`,
    async get(path) {
      const r = await fetch(`${base}${path}`);
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    async post(path, body) {
      const r = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      return { status: r.status, body: await r.json().catch(() => null) };
    },
    async close() {
      await new Promise((res) => server.close(res));
      await db.dropDatabase().catch(() => {});
      await client.close();
    },
  };
}
