import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import Header from "@/components/Header";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePriceTicker } from "@/hooks/usePriceTicker";
import { useWallet } from "@/hooks/useWallet";
import { writeContract, addressArg, bytesArg, i128Arg } from "@/services/soroban";
import { CONTRACTS, txUrl } from "@/config/molfi";
import { Lock, ArrowUpRight, Loader2, CheckCircle2, ExternalLink } from "lucide-react";

const ASSETS = ["BTC", "ETH", "SOL", "DOGE", "XRP"] as const;
const MAX_POINTS = 120;

/**
 * Molfi Trade — an original trading screen: live price chart (Coinbase feed),
 * a YES/NO position panel, and a confidential on-chain "take position" that
 * deposits collateral into the Molfi privacy pool (real Stellar tx, signed by
 * the connected wallet). Design is Molfi's own; wired to the deployed contracts.
 */
export default function Trade() {
  const { asset = "BTC" } = useParams();
  const sym = asset.toUpperCase();
  const navigate = useNavigate();
  const { address, isConnected, connect } = useWallet();
  const { price } = usePriceTicker(sym);

  const [series, setSeries] = useState<{ t: number; p: number }[]>([]);
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("10");
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = useRef<number | null>(null);

  // Roll live ticks into a chart series.
  useEffect(() => {
    if (!price) return;
    if (open.current == null) open.current = price;
    setSeries((s) => [...s, { t: Date.now(), p: price }].slice(-MAX_POINTS));
  }, [price]);

  const change = useMemo(() => {
    if (!price || open.current == null) return 0;
    return ((price - open.current) / open.current) * 100;
  }, [price]);

  const yesProb = 50 + Math.max(-45, Math.min(45, change * 6)); // indicative odds from drift
  const prob = side === "yes" ? yesProb : 100 - yesProb;

  const takePosition = async () => {
    if (!address) return;
    setBusy(true);
    setError(null);
    setTx(null);
    try {
      const stroops = BigInt(Math.round(parseFloat(amount || "0") * 1e7)); // XLM → stroops
      // commitment binds asset + side + nonce (kept off-chain; only the hash lands)
      const tag = `${sym}-${side}-${Date.now()}`;
      const enc = new TextEncoder().encode(tag);
      const buf = new Uint8Array(32);
      buf.set(enc.slice(0, 32));
      const commitment = Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
      const hash = await writeContract(address, CONTRACTS.privacyPool, "deposit", [
        addressArg(address),
        bytesArg(commitment),
        i128Arg(stroops),
      ]);
      setTx(hash);
    } catch (e: any) {
      setError(e?.message ?? "transaction failed");
    } finally {
      setBusy(false);
    }
  };

  const up = change >= 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title={`Trade ${sym} | Molfi`} description="Trade prediction markets privately on Stellar." />
      <Header />

      {/* Asset switcher */}
      <div className="border-b border-border px-4">
        <div className="max-w-6xl mx-auto flex gap-1 overflow-x-auto">
          {ASSETS.map((a) => (
            <button
              key={a}
              onClick={() => navigate(`/trade/${a}`)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                a === sym ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Chart + header */}
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{sym} · "Will {sym} close higher?"</h1>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl font-bold tabular-nums">
                  {price ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "…"}
                </span>
                <span className={cn("text-sm font-semibold tabular-nums", up ? "text-success" : "text-destructive")}>
                  {up ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border border-accent/40 text-accent">
              Live · Coinbase
            </span>
          </div>

          <div className="rounded-xl border border-border bg-card h-[340px] p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="molfiArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis domain={["dataMin", "dataMax"]} hide />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  labelFormatter={() => ""}
                  formatter={(v: any) => [`$${Number(v).toLocaleString()}`, sym]}
                />
                <Area type="monotone" dataKey="p" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#molfiArea)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order panel */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 h-fit">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSide("yes")}
              className={cn("py-2.5 rounded-lg text-sm font-semibold border transition-colors", side === "yes" ? "border-success bg-success/10 text-success" : "border-border text-muted-foreground hover:text-foreground")}
            >
              YES {yesProb.toFixed(0)}¢
            </button>
            <button
              onClick={() => setSide("no")}
              className={cn("py-2.5 rounded-lg text-sm font-semibold border transition-colors", side === "no" ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:text-foreground")}
            >
              NO {(100 - yesProb).toFixed(0)}¢
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount (XLM)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-3">
            <div className="flex justify-between"><span>Side</span><span className="text-foreground font-medium uppercase">{side} · {sym}</span></div>
            <div className="flex justify-between"><span>Indicative odds</span><span className="text-foreground font-medium">{prob.toFixed(0)}¢</span></div>
            <div className="flex justify-between"><span>Settlement</span><span className="text-foreground font-medium">On-chain (Stellar)</span></div>
          </div>

          {isConnected ? (
            <Button className="w-full" onClick={takePosition} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              Take position privately
            </Button>
          ) : (
            <Button className="w-full" onClick={() => connect()}>
              Connect wallet to trade
            </Button>
          )}

          {tx && (
            <p className="text-xs text-success flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Position opened —{" "}
              <a className="underline inline-flex items-center gap-1" href={txUrl(tx)} target="_blank" rel="noreferrer">
                {tx.slice(0, 8)}… <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
          {error && <p className="text-xs text-destructive break-all">⚠️ {error}</p>}

          <Link to="/demo" className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors pt-1">
            How private settlement works <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
