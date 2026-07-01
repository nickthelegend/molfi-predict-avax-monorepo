import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";
import { PageHeader } from "@/components/PageHeader";
import { APP_NAME, pageTitle } from "@/lib/brand";
import { pageSimple } from "@/lib/leverx/tw";
import { Lock } from "lucide-react";
import { routePendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/privacy")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Privacy Policy") },
      { name: "description", content: `How ${APP_NAME} handles your wallet and usage data.` },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <div className={pageSimple}>
        <PageHeader
          icon={<Lock className="h-5 w-5 text-accent" />}
          title="Privacy Policy"
          subtitle="Last updated June 13, 2026"
        />
        <article className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <Clause n="1" title="What we collect">
            We don&apos;t ask for your name or email directly. When you log in with Google via
            Enoki, we only use your on-chain address to show your trades and prepare transactions
            you approve yourself.
          </Clause>
          <Clause n="2" title="Analytics">
            Anonymous, aggregated usage metrics (page views, transaction success rate) may be
            collected to improve the interface. No wallet addresses are linked to analytics events.
          </Clause>
          <Clause n="3" title="On-chain data">
            All position and settlement data is public on the Sui ledger. {APP_NAME} reads
            but does not store this data off-chain beyond ephemeral caching.
          </Clause>
          <Clause n="4" title="Cookies & local storage">
            Local storage is used only to remember UI preferences and your last login session. No
            third-party tracking cookies are set.
          </Clause>
          <Clause n="5" title="Your rights">
            Because we do not collect personal data, no deletion or data-export request is required.
            Log out at any time to end the session.
          </Clause>
          <Clause n="6" title="Contact">
            Questions about this policy can be raised in the public GitHub repository.
          </Clause>
      </article>
      </div>
    </SiteShell>
  );
}

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-baseline gap-2 text-base font-semibold text-foreground">
        <span className="text-sm text-accent">{n}.</span>
        {title}
      </h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}
