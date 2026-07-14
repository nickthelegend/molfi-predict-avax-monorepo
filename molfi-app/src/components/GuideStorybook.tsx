import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Eye,
  ListChecks,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  landingCtaSecondary,
  pageSimple,
  segTab,
  segTabActive,
  segTabsClass,
} from "@/lib/leverx/tw";

const CHAPTERS = [
  { id: "introduction", label: "Introduction" },
  { id: "sides", label: "YES & NO" },
  { id: "howto", label: "Place a bet" },
  { id: "privacy", label: "Privacy" },
  { id: "resolution", label: "Settlement" },
  { id: "walkthrough", label: "Walkthrough" },
  { id: "faq", label: "FAQ" },
] as const;

type ChapterId = (typeof CHAPTERS)[number]["id"];

export function GuideStorybook() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("introduction");

  useEffect(() => {
    const headings = CHAPTERS.map((c) => document.getElementById(c.id)).filter(Boolean);
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActiveChapter(visible[0].target.id as ChapterId);
        }
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    headings.forEach((el) => observer.observe(el!));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn(pageSimple, "guide-storybook")}>
      <header className="guide-hero">
        <div className="guide-hero-top">
          <div>
            <p className="guide-hero-eyebrow">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Guide
            </p>
            <h1 className="guide-hero-title">How Molfi works</h1>
            <p className="guide-hero-lead">
              Bet on real-world outcomes — will it happen, or not? Pick YES or NO and win if
              you&apos;re right. Your position stays private, and every market settles on-chain.
            </p>
          </div>
          <Link to="/markets" className="guide-hero-cta">
            Browse markets
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="guide-hero-stats">
          <div className="guide-hero-stat">
            <span className="guide-hero-stat-value">YES / NO</span>
            <span className="guide-hero-stat-label">Simple bets — no leverage</span>
          </div>
          <div className="guide-hero-stat">
            <span className="guide-hero-stat-value">Private</span>
            <span className="guide-hero-stat-label">Positions kept confidential</span>
          </div>
          <div className="guide-hero-stat">
            <span className="guide-hero-stat-value">On-chain</span>
            <span className="guide-hero-stat-label">Settled &amp; verifiable on Avalanche</span>
          </div>
        </div>
      </header>

      <nav className="guide-mobile-toc lg:hidden" aria-label="Guide chapters">
        <div className={cn(segTabsClass("scroll"), "w-full")}>
          {CHAPTERS.map((chapter) => (
            <a
              key={chapter.id}
              href={`#${chapter.id}`}
              className={cn(segTab, activeChapter === chapter.id && segTabActive)}
            >
              {chapter.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="guide-layout">
        <nav className="guide-toc" aria-label="Guide chapters">
          <p className="guide-toc-label">Contents</p>
          <ol className="guide-toc-list">
            {CHAPTERS.map((chapter) => (
              <li key={chapter.id}>
                <a
                  href={`#${chapter.id}`}
                  className={cn(
                    "guide-toc-link",
                    activeChapter === chapter.id && "guide-toc-link-active",
                  )}
                >
                  {chapter.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="guide-article">
          <GuideChapter
            id="introduction"
            index="01"
            title="What is Molfi?"
            subtitle="Bet YES or NO on what happens next"
            first
          >
            <p>
              Molfi is a prediction market. Each market asks a simple question about the future —
              &ldquo;Will BTC be above $100k by 2026?&rdquo;, &ldquo;Will this team win?&rdquo; — and
              you back YES or NO. If your side is right when the market closes, you win. No leverage,
              no liquidations, no margin calls.
            </p>
            <div className="guide-pillar-grid guide-pillar-grid--single">
              <PillarCard
                icon={<Sparkles className="h-4 w-4" />}
                title="Real-world events"
                body="Crypto, sports, politics, news and more — pick a question you have a view on and take a side."
                accent="shield"
              />
            </div>
          </GuideChapter>

          <GuideChapter
            id="sides"
            index="02"
            title="YES & NO"
            subtitle="Two ways to take a view"
          >
            <div className="guide-pillar-grid">
              <PillarCard
                icon={<TrendingUp className="h-4 w-4" />}
                title="YES"
                body="Pays out if the outcome happens by the time the market closes."
                accent="long"
              />
              <PillarCard
                icon={<TrendingDown className="h-4 w-4" />}
                title="NO"
                body="Pays out if the outcome does not happen."
                accent="short"
              />
            </div>
            <GuideCallout variant="note" title="Pick the side you believe in">
              Every market resolves to YES or NO at close. Back the side you think is right — the
              winning side shares the pot.
            </GuideCallout>
          </GuideChapter>

          <GuideChapter
            id="howto"
            index="03"
            title="Placing a bet"
            subtitle="Three steps, then you're in"
          >
            <div className="guide-pillar-grid">
              <PillarCard
                icon={<ListChecks className="h-4 w-4" />}
                title="Pick a market"
                body="Browse markets and open one whose outcome you have a view on."
                accent="shield"
              />
              <PillarCard
                icon={<TrendingUp className="h-4 w-4" />}
                title="Choose a side"
                body="Tap YES or NO and enter how much you want to stake."
                accent="long"
              />
              <PillarCard
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Confirm"
                body="Approve in your wallet. Your bet is recorded on-chain — and kept private."
                accent="shield"
              />
            </div>
            <GuideCallout variant="tip" title="Nothing to manage">
              There&apos;s no leverage to set and no position health to watch. You stake, you wait
              for the market to close, you claim if you won.
            </GuideCallout>
          </GuideChapter>

          <GuideChapter
            id="privacy"
            index="04"
            title="Private by design"
            subtitle="Your position stays yours"
          >
            <p>
              Molfi keeps your positions confidential. Using zero-knowledge proofs, you can place a
              bet and later claim winnings without revealing which side you took or how much you
              staked — while the market&apos;s overall activity stays honest and verifiable.
            </p>
            <div className="guide-pillar-grid">
              <PillarCard
                icon={<Lock className="h-4 w-4" />}
                title="Confidential positions"
                body="Commitments and nullifiers hide who holds what, so your strategy isn't on display."
                accent="shield"
              />
              <PillarCard
                icon={<Eye className="h-4 w-4" />}
                title="Verifiable, not exposed"
                body="Settlement is proven on-chain with zero-knowledge — private to you, provable to everyone."
                accent="long"
              />
            </div>
            <GuideCallout variant="note" title="Why it matters">
              Public order books leak your moves. Molfi shows honest market depth while keeping your
              identity and size private.
            </GuideCallout>
          </GuideChapter>

          <GuideChapter
            id="resolution"
            index="05"
            title="How markets settle"
            subtitle="Resolved on-chain, claimed by winners"
          >
            <p>
              When a market closes, its outcome is resolved on-chain. Price markets settle against a
              price oracle; event markets settle against the real-world result. Winners claim their
              payout directly from the contract — there&apos;s no middleman holding your funds.
            </p>
            <GuidePanel label="What happens at close">
              <dl className="guide-risk-grid">
                <div>
                  <dt>Outcome resolved</dt>
                  <dd>The market is finalized to YES or NO from its oracle or real-world result.</dd>
                </div>
                <div>
                  <dt>Winners claim</dt>
                  <dd>Holders of the winning side redeem their payout straight from the contract.</dd>
                </div>
                <div>
                  <dt>Fully on-chain</dt>
                  <dd>Every market, bet, and settlement is recorded on Avalanche.</dd>
                </div>
              </dl>
            </GuidePanel>
            <GuideCallout variant="tip" title="Verify anything">
              Each market and settlement lives on Avalanche — open it on snowtrace.io to check the
              outcome and payouts for yourself.
            </GuideCallout>
          </GuideChapter>

          <GuideChapter
            id="walkthrough"
            index="06"
            title="Step by step"
            subtitle="From wallet to winnings"
          >
            <ol className="guide-steps">
              <li>
                <span className="guide-step-icon">
                  <Wallet className="h-4 w-4" />
                </span>
                <span className="guide-step-body">
                  <strong>Connect a wallet</strong>
                  <span>Click Sign in and pick an Avalanche wallet — MetaMask, Core, Rainbow, Coinbase Wallet, or WalletConnect.</span>
                </span>
              </li>
              <li>
                <span className="guide-step-icon">
                  <ListChecks className="h-4 w-4" />
                </span>
                <span className="guide-step-body">
                  <strong>Pick a market</strong>
                  <span>Browse markets and open one you have a view on.</span>
                </span>
              </li>
              <li>
                <span className="guide-step-icon">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <span className="guide-step-body">
                  <strong>Choose YES or NO</strong>
                  <span>Take a side and enter your stake.</span>
                </span>
              </li>
              <li>
                <span className="guide-step-icon">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className="guide-step-body">
                  <strong>Confirm in your wallet</strong>
                  <span>Approve the transaction — your bet is on-chain and private.</span>
                </span>
              </li>
              <li>
                <span className="guide-step-icon">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <span className="guide-step-body">
                  <strong>Claim if you win</strong>
                  <span>After the market resolves, claim your payout from Portfolio.</span>
                </span>
              </li>
            </ol>
            <div className="guide-cta-row">
              <Link to="/markets" className="btn-connect gap-1.5 text-sm">
                Browse markets
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/portfolio" className={cn(landingCtaSecondary, "text-sm")}>
                View portfolio
              </Link>
            </div>
          </GuideChapter>

          <GuideChapter id="faq" index="07" title="Good to know" subtitle="Common questions">
            <dl className="guide-faq">
              <div className="guide-faq-item">
                <dt>Is this real money?</dt>
                <dd>Molfi runs on Avalanche Fuji testnet for now — you bet with test funds, no real money at risk.</dd>
              </div>
              <div className="guide-faq-item">
                <dt>Is there leverage?</dt>
                <dd>No. Molfi is simple YES/NO prediction — no leverage, no margin, no liquidations.</dd>
              </div>
              <div className="guide-faq-item">
                <dt>How do markets resolve?</dt>
                <dd>On-chain at close — price markets from a price oracle, event markets from the real outcome.</dd>
              </div>
              <div className="guide-faq-item">
                <dt>Is my bet private?</dt>
                <dd>Yes — your position is kept confidential with zero-knowledge proofs, while settlement stays verifiable.</dd>
              </div>
              <div className="guide-faq-item">
                <dt>How do I connect?</dt>
                <dd>Click Sign in and choose an Avalanche wallet (MetaMask, Core, Rainbow, Coinbase Wallet, or WalletConnect).</dd>
              </div>
              <div className="guide-faq-item">
                <dt>Where can I verify a market?</dt>
                <dd>Every market and settlement is on Avalanche — open it on snowtrace.io to check.</dd>
              </div>
            </dl>
          </GuideChapter>
        </article>
      </div>
    </div>
  );
}

function GuideChapter({
  id,
  index,
  title,
  subtitle,
  first,
  children,
}: {
  id: ChapterId;
  index: string;
  title: string;
  subtitle: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("guide-chapter scroll-mt-28", !first && "guide-chapter--ruled")}
    >
      <div className="guide-chapter-header">
        <span className="guide-chapter-index">{index}</span>
        <div className="min-w-0">
          <h2 className="guide-chapter-title">{title}</h2>
          <p className="guide-chapter-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="guide-chapter-body">{children}</div>
    </section>
  );
}

function GuidePanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="guide-panel">
      <p className="guide-panel-label">{label}</p>
      <div className="guide-panel-body">{children}</div>
    </div>
  );
}

function GuideCallout({
  variant,
  title,
  children,
}: {
  variant: "tip" | "note";
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className={cn("guide-callout", variant === "tip" && "guide-callout-tip")}>
      <p className="guide-callout-title">{title}</p>
      <div className="guide-callout-body">{children}</div>
    </aside>
  );
}

function PillarCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  accent: "long" | "short" | "shield";
}) {
  return (
    <div className={cn("guide-pillar", `guide-pillar-${accent}`)}>
      <div className="guide-pillar-icon">{icon}</div>
      <h3 className="guide-pillar-title">{title}</h3>
      <p className="guide-pillar-body">{body}</p>
    </div>
  );
}
