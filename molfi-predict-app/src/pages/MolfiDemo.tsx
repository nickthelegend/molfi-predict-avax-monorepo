import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import {
  readContract,
  writeContract,
  bytesArg,
  addressArg,
  i128Arg,
} from "@/services/soroban";
import { CONTRACTS, DEMO_MARKET_ID, contractUrl, txUrl } from "@/config/molfi";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";

const OUTCOME = ["YES", "NO", "INVALID"];

/**
 * Live on-chain demo: connect a Stellar wallet, read the BTC market outcome
 * from the deployed `market` contract, and submit a real transaction to the
 * `privacy-pool` contract — all against Molfi's testnet deployment.
 */
export default function MolfiDemo() {
  const { address, isConnected, connect, disconnect } = useWallet();
  const [outcome, setOutcome] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [depositTx, setDepositTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readOutcome = async () => {
    if (!address) return;
    setError(null);
    setReading(true);
    try {
      const res = await readContract(address, CONTRACTS.market, "winning_outcome", [
        bytesArg(DEMO_MARKET_ID),
      ]);
      setOutcome(OUTCOME[Number(res)] ?? String(res));
    } catch (e: any) {
      setError(e?.message ?? "read failed");
    } finally {
      setReading(false);
    }
  };

  const deposit = async () => {
    if (!address) return;
    setError(null);
    setDepositing(true);
    setDepositTx(null);
    try {
      // commitment = a 32-byte tag; 1 XLM = 10,000,000 stroops.
      const commitment = "11".repeat(32);
      const hash = await writeContract(address, CONTRACTS.privacyPool, "deposit", [
        addressArg(address),
        bytesArg(commitment),
        i128Arg(10_000_000n),
      ]);
      setDepositTx(hash);
    } catch (e: any) {
      setError(e?.message ?? "deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  const short = (s: string) => `${s.slice(0, 6)}…${s.slice(-6)}`;

  return (
    <main className="min-h-screen bg-background text-foreground px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold">Molfi — Live on Stellar Testnet</h1>
          <p className="text-muted-foreground">
            Private prediction markets. Connect a Stellar wallet and interact with the
            deployed Soroban contracts directly.
          </p>
        </header>

        {/* Wallet */}
        <section className="rounded-xl border border-border p-5">
          {isConnected && address ? (
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Connected: <span className="font-mono">{short(address)}</span>
              </span>
              <Button variant="outline" size="sm" onClick={() => disconnect()}>
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={() => connect()}>Connect Stellar Wallet</Button>
          )}
        </section>

        {/* Read market */}
        <section className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="font-semibold">Read a resolved market's outcome (on-chain)</h2>
          <Button onClick={readOutcome} disabled={!isConnected || reading} size="sm">
            {reading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Read on-chain outcome
          </Button>
          {outcome && (
            <p className="text-sm">
              Resolved outcome:{" "}
              <span className={outcome === "YES" ? "text-green-500 font-bold" : "font-bold"}>
                {outcome}
              </span>{" "}
              {outcome === "YES" && "→ YES bettors win"}
            </p>
          )}
        </section>

        {/* Write tx */}
        <section className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="font-semibold">Privacy pool — confidential deposit</h2>
          <p className="text-sm text-muted-foreground">
            Submit a real on-chain deposit (1 XLM) to the privacy-pool contract, signed by
            your wallet.
          </p>
          <Button onClick={deposit} disabled={!isConnected || depositing} size="sm">
            {depositing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Deposit 1 XLM on-chain
          </Button>
          {depositTx && (
            <p className="text-sm flex items-center gap-2 text-green-500">
              <CheckCircle2 className="h-4 w-4" /> Confirmed —{" "}
              <a className="underline inline-flex items-center gap-1" href={txUrl(depositTx)} target="_blank" rel="noreferrer">
                {short(depositTx)} <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
        </section>

        {error && (
          <p className="text-sm text-red-500 break-all">⚠️ {error}</p>
        )}

        {/* Deployed contracts */}
        <section className="rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-3">Deployed contracts (testnet)</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(CONTRACTS).map(([name, id]) => (
              <li key={name} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{name}</span>
                <a className="font-mono underline inline-flex items-center gap-1" href={contractUrl(id)} target="_blank" rel="noreferrer">
                  {short(id)} <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
