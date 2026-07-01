import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMarkets, type OnChainMarket } from "@/services/soroban";
import { CONTRACTS, contractUrl } from "@/config/molfi";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS = ["Trading", "Resolving", "Resolved"];
const OUTCOME = ["YES", "NO", "INVALID"];

/**
 * Markets — read live from the deployed `market` Soroban contract via
 * `markets()` enumeration + `get_market`. No mock data: every row is on-chain state.
 */
export default function StellarMarkets() {
  const [markets, setMarkets] = useState<OnChainMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setMarkets(await listMarkets());
    } catch (e: any) {
      setError(e?.message ?? "failed to load markets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold">Markets</h1>
            <p className="text-muted-foreground text-sm">
              Live from the{" "}
              <a className="underline inline-flex items-center gap-1" href={contractUrl(CONTRACTS.market)} target="_blank" rel="noreferrer">
                market contract <ExternalLink className="h-3 w-3" />
              </a>{" "}
              on Stellar testnet — every row is real on-chain state.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </header>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading markets from chain…
          </div>
        )}
        {error && <p className="text-red-500 text-sm break-all">⚠️ {error}</p>}

        <div className="space-y-3">
          {markets.map((m) => (
            <Link
              key={m.id}
              to={`/m/${m.id}`}
              className="rounded-xl border border-border p-4 flex items-center justify-between gap-4 hover:border-foreground/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{m.question}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {m.id.slice(0, 10)}…
                </p>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    m.status === 2 ? "border-green-600 text-green-500" : "border-border text-muted-foreground"
                  }`}
                >
                  {STATUS[m.status] ?? m.status}
                </span>
                {m.status === 2 && (
                  <p className={`mt-1 text-sm font-bold ${m.outcome === 0 ? "text-green-500" : "text-red-400"}`}>
                    {OUTCOME[m.outcome] ?? m.outcome}
                  </p>
                )}
              </div>
            </Link>
          ))}
          {!loading && markets.length === 0 && !error && (
            <p className="text-muted-foreground text-sm">No markets on-chain yet.</p>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Place a bet or make a confidential deposit on the{" "}
          <Link to="/demo" className="underline">
            live demo →
          </Link>
        </p>
      </div>
    </main>
  );
}
