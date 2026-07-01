import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownLeft, Coins, Loader2, Receipt, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LivePriceChart } from "@/components/LivePriceChart";
import { vaultDepositOnChain } from "@/lib/stellar/soroban";
import { useWallet } from "@/context/WalletContext";
import {
  fetchVaults,
  fetchVaultPosition,
  fetchVaultHistory,
  fetchVaultActivity,
  vaultDeposit,
} from "@/lib/molfi-backend";
import { showError, showTxSuccess } from "@/lib/toast";
import { pageTitle } from "@/lib/brand";
import { pageSimple, pageSimpleTitle } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";
import { routePendingOptions } from "@/lib/router/route-options";

/** mUSDC is the Molfi testnet stand-in for USDC — show the real USDC mark. */
const USDC_LOGO =
  "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdc.png";

export const Route = createFileRoute("/_app/vault")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Vault") },
      { name: "description", content: "Deposit mUSDC to the Molfi LP vault and earn trading fees." },
    ],
  }),
  component: VaultPage,
});

const usd = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : 2 });

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-mono text-xl font-semibold", accent ? "text-accent" : "text-foreground")}>
        {value}
      </p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function timeAgo(ts: number, now: number) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function VaultPage() {
  const { address, connect } = useWallet();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("100");
  const [depositing, setDepositing] = useState(false);

  const { data: vaults } = useQuery({ queryKey: ["vaults"], queryFn: fetchVaults, refetchInterval: 15_000 });
  const vault = vaults?.[0];
  const { data: history = [] } = useQuery({
    queryKey: ["vault-history"],
    queryFn: fetchVaultHistory,
    refetchInterval: 30_000,
  });
  const { data: activity = [] } = useQuery({
    queryKey: ["vault-activity"],
    queryFn: fetchVaultActivity,
    refetchInterval: 15_000,
  });
  const { data: pos } = useQuery({
    queryKey: ["vault-position", address],
    queryFn: () => fetchVaultPosition(address as string),
    enabled: Boolean(address),
    refetchInterval: 15_000,
  });

  const navGrowth = vault?.sharePrice ? (vault.sharePrice - 1) * 100 : 0;
  const tvlPoints = history.map((h) => ({ ts: h.ts, price: h.tvl }));
  const now = Date.now();

  const handleDeposit = async () => {
    if (!address) return void connect();
    const amt = Number(amount);
    if (!(amt > 0)) return showError("Enter an amount");
    setDepositing(true);
    try {
      // Real on-chain deposit into the LP vault contract (wallet-signed).
      const hash = await vaultDepositOnChain(address, amt);
      showTxSuccess(`Deposited ${amt} mUSDC to the vault`, hash);
      // Mirror to the backend for the depositor count (non-fatal).
      await vaultDeposit(address, amt).catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ["vaults"] });
      await queryClient.invalidateQueries({ queryKey: ["vault-history"] });
      await queryClient.invalidateQueries({ queryKey: ["vault-activity"] });
      await queryClient.invalidateQueries({ queryKey: ["vault-position", address] });
    } catch (e) {
      showError(e instanceof Error ? e.message : "Deposit failed");
    } finally {
      setDepositing(false);
    }
  };

  return (
    <section className={pageSimple}>
      <div>
        <h1 className={pageSimpleTitle}>
          <Coins className="mb-1 mr-2 inline h-6 w-6 text-accent" />
          Vault
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The <strong className="text-foreground">Molfi LP Vault</strong> backs market settlement and earns a share
          of the <strong className="text-foreground">2% trading fee</strong> charged on every bet. Deposit mUSDC to
          provide liquidity and earn yield from trading activity across all markets.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total value locked" value={`${usd(vault?.tvl ?? 0)} mUSDC`} />
        <Stat
          label="Realized fee yield"
          value={`${vault?.apr ?? 0}%`}
          sub={`${usd(vault?.feesEarned ?? 0)} mUSDC fees earned`}
          accent
        />
        <Stat
          label="NAV / share"
          value={`${(vault?.sharePrice ?? 1).toFixed(4)}`}
          sub={`${navGrowth >= 0 ? "+" : ""}${navGrowth.toFixed(2)}% since inception`}
          accent
        />
        <Stat label="Total shares" value={`${usd(vault?.totalShares ?? 0)}`} sub="on-chain LP shares" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Vault performance · TVL</h2>
          <span className="font-mono text-sm text-[var(--long-text)]">
            +{usd(vault?.feesEarned ?? 0)} mUSDC earned
          </span>
        </div>
        {tvlPoints.length > 1 ? (
          <LivePriceChart points={tvlPoints} height={220} />
        ) : (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Performance history appears as deposits and trading fees accrue.
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold text-foreground">Provide liquidity</h2>
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2">
            <img src={USDC_LOGO} alt="USDC" className="h-7 w-7 rounded-full" loading="lazy" />
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">mUSDC</p>
              <p className="text-[11px] text-muted-foreground">USD-pegged · Molfi testnet</p>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted-foreground">Amount (mUSDC)</label>
            <div className="relative mt-1">
              <img
                src={USDC_LOGO}
                alt=""
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full"
              />
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-border bg-background pl-10 font-mono"
              />
            </div>
          </div>
          <Button onClick={handleDeposit} disabled={depositing} className="w-full gap-1.5" size="lg">
            {depositing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            {address ? "Deposit to vault" : "Connect wallet"}
          </Button>
          {address && pos ? (
            <div className="space-y-1 rounded-lg border border-border bg-background p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your deposit</span>
                <span className="font-mono">{usd(pos.deposited)} mUSDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pool share</span>
                <span className="font-mono">{pos.sharePct}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fees earned</span>
                <span className="font-mono text-[var(--long-text)]">+{usd(pos.earned)} mUSDC</span>
              </div>
            </div>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            Get test mUSDC from the <strong>Faucet</strong> in the header first.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {activity.map((e, i) => (
                <li key={`${e.address}-${e.ts}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      e.type === "deposit" ? "bg-accent/10 text-accent" : "bg-[var(--long-bg)] text-[var(--long-text)]",
                    )}
                  >
                    {e.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {e.type === "deposit" ? "Liquidity deposit" : `Trading fee · ${e.symbol ?? ""}`}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {e.address.slice(0, 6)}…{e.address.slice(-4)} · {timeAgo(e.ts, now)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-sm",
                      e.type === "deposit" ? "text-foreground" : "text-[var(--long-text)]",
                    )}
                  >
                    {e.type === "deposit" ? "" : "+"}
                    {usd(e.amount)} mUSDC
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">How the vault works</h2>
        <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <li className="flex gap-3">
            <Coins className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">Deposit mUSDC</strong> into the shared pool. Your deposit provides
              liquidity that backs market settlement.
            </span>
          </li>
          <li className="flex gap-3">
            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">Earn 2% of every trade.</strong> Each bet pays a 2% fee that accrues
              to the vault and lifts the NAV per share for all depositors.
            </span>
          </li>
          <li className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              <strong className="text-foreground">Private by design.</strong> The vault sees only aggregate flow —
              individual traders&apos; positions are never revealed on-chain (zero-knowledge).
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
