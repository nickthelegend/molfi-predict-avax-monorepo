import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ShieldCheck, TrendingUp, TrendingDown } from "lucide-react";
import { fetchLeaderboard } from "@/lib/molfi-backend";
import { pageTitle } from "@/lib/brand";
import { pageSimple, pageSimpleTitle } from "@/lib/leverx/tw";
import { routePendingOptions } from "@/lib/router/route-options";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/leaderboard")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Leaderboard") },
      { name: "description", content: "Top Molfi traders by realized PnL — positions stay private." },
    ],
  }),
  component: LeaderboardPage,
});

function shortAddr(a: string): string {
  if (a.length <= 12) return a;
  return `${a.slice(0, 5)}…${a.slice(-5)}`;
}

function LeaderboardPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: fetchLeaderboard,
    refetchInterval: 15_000,
  });

  return (
    <section className={pageSimple}>
      <div>
        <h1 className={pageSimpleTitle}>
          <Trophy className="mb-1 mr-2 inline h-6 w-6 text-accent" />
          Leaderboard
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-accent" />
          Ranked by realized PnL. Individual positions stay private (zero-knowledge) — only
          aggregate results are public.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[3rem_1fr_repeat(3,minmax(0,5rem))] gap-2 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:grid-cols-[3rem_1fr_repeat(4,minmax(0,6rem))]">
          <span>#</span>
          <span>Trader</span>
          <span className="text-right">PnL</span>
          <span className="hidden text-right sm:block">Volume</span>
          <span className="text-right">Win %</span>
          <span className="text-right">Trades</span>
        </div>

        {isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No settled trades yet — place a bet and win to top the board.
          </p>
        ) : (
          rows.map((r) => (
            <div
              key={r.address}
              className="grid grid-cols-[3rem_1fr_repeat(3,minmax(0,5rem))] items-center gap-2 border-b border-border px-4 py-3 text-sm last:border-0 sm:grid-cols-[3rem_1fr_repeat(4,minmax(0,6rem))]"
            >
              <span
                className={cn(
                  "font-mono font-semibold",
                  r.rank === 1 && "text-amber-400",
                  r.rank === 2 && "text-zinc-300",
                  r.rank === 3 && "text-amber-700",
                )}
              >
                {r.rank}
              </span>
              <span className="truncate font-mono text-foreground">{shortAddr(r.address)}</span>
              <span
                className={cn(
                  "flex items-center justify-end gap-1 text-right font-mono font-semibold",
                  r.pnl >= 0 ? "text-[var(--long-text)]" : "text-[var(--short-text)]",
                )}
              >
                {r.pnl >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {r.pnl >= 0 ? "+" : ""}
                {r.pnl.toLocaleString()}
              </span>
              <span className="hidden text-right font-mono text-muted-foreground sm:block">
                {r.volume.toLocaleString()}
              </span>
              <span className="text-right font-mono text-foreground">{r.winRate}%</span>
              <span className="text-right font-mono text-muted-foreground">{r.trades}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
