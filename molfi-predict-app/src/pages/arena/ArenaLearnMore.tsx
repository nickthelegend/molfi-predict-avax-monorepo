import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Trophy, 
  Users, 
  Calendar, 
  DollarSign, 
  Target, 
  Shield, 
  ChevronRight,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  HelpCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Season 0 Timeline Data - Q2 2026
const seasonTimeline = {
  seasonStart: "April 6, 2026",
  seasonEnd: "June 29, 2026",
  competitions: [
    { 
      number: 1, 
      regStart: "Mar 30", 
      regEnd: "Apr 4", 
      compStart: "Apr 6", 
      compEnd: "Apr 13",
      prizePool: "$4,000"
    },
    { 
      number: 2, 
      regStart: "Apr 13", 
      regEnd: "Apr 18", 
      compStart: "Apr 20", 
      compEnd: "Apr 27",
      prizePool: "$4,000"
    },
    { 
      number: 3, 
      regStart: "Apr 27", 
      regEnd: "May 2", 
      compStart: "May 4", 
      compEnd: "May 11",
      prizePool: "$4,000"
    },
    { 
      number: 4, 
      regStart: "May 11", 
      regEnd: "May 16", 
      compStart: "May 18", 
      compEnd: "May 25",
      prizePool: "$4,000"
    },
    { 
      number: 5, 
      regStart: "May 25", 
      regEnd: "May 30", 
      compStart: "Jun 1", 
      compEnd: "Jun 8",
      prizePool: "$4,000"
    },
  ],
  finale: {
    regStart: "Jun 8",
    regEnd: "Jun 13",
    compStart: "Jun 15",
    compEnd: "Jun 22",
    prizePool: "$10,000"
  }
};

const prizeDistribution = [
  { rank: "1st", biweekly: "$1,600", finale: "$5,000", note: "Champion Prize" },
  { rank: "2nd", biweekly: "$1,000", finale: "$2,000", note: "" },
  { rank: "3rd", biweekly: "$700", finale: "$1,500", note: "" },
  { rank: "4th", biweekly: "$400", finale: "$1,000", note: "" },
  { rank: "5th", biweekly: "$300", finale: "$500", note: "" },
];

const faqs = [
  {
    q: "How do I participate in the Arena?",
    a: "Check if registration is open for the current competition. If you're whitelisted or FCFS slots are available, connect your wallet, verify eligibility, and complete the registration process. You'll receive a dedicated Arena wallet address for trading."
  },
  {
    q: "What happens to my starting capital?",
    a: "All traders start with exactly $100 USDC. This capital is provided by the protocol for trading during the competition. No additional deposits are allowed, and you cannot withdraw during the trading period."
  },
  {
    q: "How are rankings calculated?",
    a: "Rankings are based on Total Account Equity, which includes both realized PnL and unrealized gains from open positions. A snapshot is taken exactly at the competition end time (Monday 16:59 UTC)."
  },
  {
    q: "What markets can I trade?",
    a: "All competitions allow trading on BTC, ETH, and SOL perpetual contracts. These markets are powered by GMX liquidity for deep liquidity and fair execution."
  },
  {
    q: "How do I qualify for the Grand Finale?",
    a: "Finish in the Top 5 by ROI in any of the 5 bi-weekly competitions to earn an automatic qualification slot. Alternatively, 25 FCFS (First-Come, First-Serve) wildcard slots are available for the Finale."
  },
  {
    q: "Can I participate in multiple competitions?",
    a: "Yes! You can register and compete in all 5 bi-weekly competitions. Each competition is independent, so your performance resets each time. Qualifying in multiple competitions doesn't give you multiple finale entries."
  },
  {
    q: "What if I have open positions at competition end?",
    a: "All open positions are counted at their current mark price at the exact end time. The equity including unrealized PnL determines your final ranking."
  },
  {
    q: "Are results verifiable?",
    a: "Yes, all trading activity and final results are on-chain and fully transparent. Anyone can verify the rankings and trading history."
  }
];

export default function ArenaLearnMore() {
  const navigate = useNavigate();

  return (
    <ArenaLayout
      title="Learn About Arena | Molfi Trading Arena"
      description="Everything you need to know about Molfi Trading Arena - competitive perpetual trading with fixed capital and transparent rankings."
    >
      {/* Hero Section */}
      <div className="relative mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-primary/5 rounded-2xl" />
        <div className="relative p-8 md:p-12 text-center">
          <Badge className="mb-4 bg-warning/10 text-warning border-warning/30 uppercase tracking-wider">
            Season 0 — Pilot
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Molfi Trading Arena
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Competitive, league-style perpetual trading. All participants trade under identical conditions. 
            Pure skill. Observable performance.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            <Trophy className="w-6 h-6 text-warning" />
            <span className="text-2xl md:text-3xl font-bold text-warning">$30,000</span>
            <span className="text-lg text-muted-foreground">Total Prize Pool</span>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate("/arena")}
            className="gap-2"
          >
            View Season Overview
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* How It Works */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-warning" />
          How the Arena Works
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 border-border bg-card/50">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
              <DollarSign className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Fixed Capital</h3>
            <p className="text-sm text-muted-foreground">
              Everyone starts with exactly $100 USDC. No additional deposits. Level playing field.
            </p>
          </Card>
          <Card className="p-5 border-border bg-card/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-2">ROI Rankings</h3>
            <p className="text-sm text-muted-foreground">
              Ranked purely on return percentage. Your total equity including open positions determines rank.
            </p>
          </Card>
          <Card className="p-5 border-border bg-card/50">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-medium text-foreground mb-2">On-Chain Verified</h3>
            <p className="text-sm text-muted-foreground">
              All trades and results are transparent and verifiable. No hidden advantages.
            </p>
          </Card>
          <Card className="p-5 border-border bg-card/50">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-medium text-foreground mb-2">Real Prizes</h3>
            <p className="text-sm text-muted-foreground">
              Top performers win from the $30,000 prize pool. Champion takes $5,000.
            </p>
          </Card>
        </div>
      </section>

      {/* Season Structure */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-warning" />
          Season 0 Structure
        </h2>
        <Card className="p-6 border-border">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 pb-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">Season Duration</p>
              <p className="text-lg font-semibold text-foreground">12 Weeks</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="text-lg font-semibold text-foreground">{seasonTimeline.seasonStart}</p>
            </div>
            <div className="hidden md:block w-px h-10 bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">End Date</p>
              <p className="text-lg font-semibold text-foreground">{seasonTimeline.seasonEnd}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">5</div>
              <div>
                <p className="font-medium text-foreground">Bi-Weekly Qualifier Competitions</p>
                <p className="text-sm text-muted-foreground">50 traders each • Top 5 qualify for finale</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center text-sm font-bold text-warning">1</div>
              <div>
                <p className="font-medium text-foreground">Grand Finale</p>
                <p className="text-sm text-muted-foreground">25 qualified + 25 FCFS wildcards • $10,000 prize pool</p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Competition Schedule */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Competition Schedule
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Competition</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Registration</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Trading Period</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Prize Pool</th>
              </tr>
            </thead>
            <tbody>
              {seasonTimeline.competitions.map((comp) => (
                <tr key={comp.number} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-medium text-foreground">Competition {comp.number}</td>
                  <td className="py-3 px-4 text-muted-foreground">{comp.regStart} — {comp.regEnd}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {comp.compStart} — {comp.compEnd}
                    <span className="text-xs text-muted-foreground/70 ml-2">(7 days)</span>
                  </td>
                  <td className="py-3 px-4 text-right text-warning font-medium">{comp.prizePool}</td>
                </tr>
              ))}
              <tr className="bg-warning/5 hover:bg-warning/10 transition-colors">
                <td className="py-3 px-4 font-semibold text-warning">Grand Finale</td>
                <td className="py-3 px-4 text-muted-foreground">{seasonTimeline.finale.regStart} — {seasonTimeline.finale.regEnd}</td>
                <td className="py-3 px-4 text-muted-foreground">
                  {seasonTimeline.finale.compStart} — {seasonTimeline.finale.compEnd}
                  <span className="text-xs text-muted-foreground/70 ml-2">(7 days)</span>
                </td>
                <td className="py-3 px-4 text-right text-warning font-semibold">{seasonTimeline.finale.prizePool}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          All times in UTC. Trading starts Monday 17:00 UTC, ends following Monday 16:59 UTC.
        </p>
      </section>

      {/* Prize Distribution */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Prize Distribution
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 border-border">
            <h3 className="font-medium text-foreground mb-4">Bi-Weekly Competitions</h3>
            <p className="text-sm text-muted-foreground mb-4">$4,000 per competition • $20,000 total</p>
            <div className="space-y-2">
              {prizeDistribution.map((p) => (
                <div key={p.rank} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-foreground font-medium">{p.rank}</span>
                  <span className="text-warning font-semibold">{p.biweekly}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6 border-warning/30 bg-warning/5">
            <h3 className="font-medium text-warning mb-4">Grand Finale</h3>
            <p className="text-sm text-muted-foreground mb-4">$10,000 prize pool</p>
            <div className="space-y-2">
              {prizeDistribution.map((p) => (
                <div key={p.rank} className="flex items-center justify-between py-2 border-b border-warning/20 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-medium">{p.rank}</span>
                    {p.note && (
                      <Badge variant="outline" className="text-[9px] border-warning/30 text-warning">
                        {p.note}
                      </Badge>
                    )}
                  </div>
                  <span className="text-warning font-semibold">{p.finale}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Rules Summary */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-warning" />
          Competition Rules
        </h2>
        <Card className="p-6 border-border">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">Trading Rules</h3>
              <ul className="space-y-2">
                {[
                  "Fixed $100 starting capital for all traders",
                  "No additional deposits allowed",
                  "Markets: BTC, ETH, SOL perpetuals",
                  "Trading only during active competition window",
                  "One trader, one vault, one ranking"
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">Ranking Methodology</h3>
              <ul className="space-y-2">
                {[
                  "Rankings based on Total Account Equity",
                  "Includes both realized and unrealized PnL",
                  "Open positions counted at mark price",
                  "Snapshot taken at exact competition end",
                  "Results are final and on-chain verifiable"
                ].map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </section>

      {/* Grand Finale Details */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-warning" />
          Grand Finale
        </h2>
        <Card className="p-6 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">Participants</h3>
              <p className="text-2xl font-bold text-foreground mb-2">50 Traders</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 25 qualified (Top 5 from each competition)</li>
                <li>• 25 FCFS wildcard entries</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">Format</h3>
              <p className="text-2xl font-bold text-foreground mb-2">Fresh Start</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Everyone starts with $100 again</li>
                <li>• Same rules and constraints</li>
                <li>• No carryover advantage</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">Champion Prize</h3>
              <p className="text-2xl font-bold text-warning mb-2">$5,000</p>
              <p className="text-sm text-muted-foreground">
                Sponsored by Season 0 Title Sponsor
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* FAQs */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-warning" />
          Frequently Asked Questions
        </h2>
        <Card className="p-6 border-border">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                <AccordionTrigger className="text-left text-foreground hover:text-warning">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">Ready to compete?</p>
        <Button 
          size="lg" 
          onClick={() => navigate("/arena")}
          className="gap-2"
        >
          Go to Arena
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </ArenaLayout>
  );
}
