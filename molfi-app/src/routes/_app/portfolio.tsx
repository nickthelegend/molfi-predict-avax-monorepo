import { createFileRoute } from "@tanstack/react-router";
import { WalletConnectPrompt } from "@/components/WalletConnectPrompt";
import { MolfiPortfolio } from "@/components/MolfiPortfolio";
import { useWallet } from "@/context/WalletContext";
import { pageTitle } from "@/lib/brand";
import { pageSimple, pageSimpleTitle } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";
import { routePendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/_app/portfolio")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Portfolio") },
      {
        name: "description",
        content: "Your trades and indicative profit and loss on Molfi.",
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const { address, isWalletConnected } = useWallet();

  return (
    <section className={cn(pageSimple, "mx-auto max-w-[var(--page-max)]")}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={pageSimpleTitle}>Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your bets, live indicative P&amp;L, and settled results — private to you.
          </p>
        </div>
        {isWalletConnected && address ? (
          <p className="font-mono text-[11px] text-muted-foreground sm:text-right">
            {address.slice(0, 8)}…{address.slice(-6)}
          </p>
        ) : null}
      </div>

      {!isWalletConnected || !address ? (
        <WalletConnectPrompt
          title="Sign in for your portfolio"
          description="Connect your Stellar wallet to see your trades and indicative profit and loss."
        />
      ) : (
        <MolfiPortfolio address={address} />
      )}
    </section>
  );
}
