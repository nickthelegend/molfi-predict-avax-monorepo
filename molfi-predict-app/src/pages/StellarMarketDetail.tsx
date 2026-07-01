import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import {
  readContract,
  writeContract,
  bytesArg,
  addressArg,
  i128Arg,
} from "@/services/soroban";
import { CONTRACTS, READ_SOURCE, contractUrl, txUrl } from "@/config/molfi";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, CheckCircle2, ArrowLeft } from "lucide-react";

const STATUS = ["Trading", "Resolving", "Resolved"];
const OUTCOME = ["YES", "NO", "INVALID"];

/** Single market, read live from the `market` contract, with a real on-chain action. */
export default function StellarMarketDetail() {
  const { id = "" } = useParams();
  const { address, isConnected, connect } = useWallet();
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        setM(await readContract(READ_SOURCE, CONTRACTS.market, "get_market", [bytesArg(id)]));
      } catch (e: any) {
        setError(e?.message ?? "failed to read market");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const deposit = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    setTx(null);
    try {
      const commitment = id.slice(0, 62).padEnd(64, "0"); // market-derived 32-byte tag
      const hash = await writeContract(address, CONTRACTS.privacyPool, "deposit", [
        addressArg(address),
        bytesArg(commitment),
        i128Arg(10_000_000n),
      ]);
      setTx(hash);
    } catch (e: any) {
      setError(e?.message ?? "deposit failed");
    } finally {
      setBusy(false);
    }
  };

  const status = m ? Number(m.status) : 0;
  const outcome = m ? Number(m.outcome) : 2;

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link to="/markets" className="text-sm text-muted-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> All markets
        </Link>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading market from chain…
          </div>
        )}
        {error && <p className="text-red-500 text-sm break-all">⚠️ {error}</p>}

        {m && (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-bold">{m.question}</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded-full border ${status === 2 ? "border-green-600 text-green-500" : "border-border text-muted-foreground"}`}>
                  {STATUS[status]}
                </span>
                {status === 2 && (
                  <span className={`font-bold ${outcome === 0 ? "text-green-500" : "text-red-400"}`}>
                    Resolved {OUTCOME[outcome]}
                  </span>
                )}
                <a className="text-muted-foreground underline inline-flex items-center gap-1 ml-auto" href={contractUrl(CONTRACTS.market)} target="_blank" rel="noreferrer">
                  on-chain <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-xs font-mono text-muted-foreground break-all">{id}</p>
            </header>

            <section className="rounded-xl border border-border p-5 space-y-3">
              <h2 className="font-semibold">Take a confidential position</h2>
              <p className="text-sm text-muted-foreground">
                Deposit collateral into the privacy pool for this market — a real on-chain
                transaction signed by your wallet.
              </p>
              {isConnected ? (
                <Button size="sm" onClick={deposit} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Deposit 1 XLM
                </Button>
              ) : (
                <Button size="sm" onClick={() => connect()}>Connect wallet</Button>
              )}
              {tx && (
                <p className="text-sm text-green-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Confirmed —{" "}
                  <a className="underline inline-flex items-center gap-1" href={txUrl(tx)} target="_blank" rel="noreferrer">
                    {tx.slice(0, 8)}… <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
