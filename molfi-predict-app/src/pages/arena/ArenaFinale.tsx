import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Trophy, Users, Calendar, ChevronRight, Star, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Season 0 Grand Finale Details
const FINALE_DETAILS = {
  status: "UPCOMING" as const,
  regStart: "Jun 8, 2026",
  regEnd: "Jun 13, 2026",
  compStart: "Jun 15, 2026",
  compEnd: "Jun 22, 2026",
  prizePool: "$10,000",
  championPrize: "$5,000",
  runnerUpPool: "$5,000",
  qualifiedSlots: 25,
  fcfsSlots: 25,
  totalSlots: 50,
  startingCapital: "$100",
  duration: "7 days",
};

// Competitions that feed into the finale
const QUALIFIER_COMPETITIONS = [
  { number: 1, dates: "Apr 6-13", qualifySlots: 5, status: "upcoming" },
  { number: 2, dates: "Apr 20-27", qualifySlots: 5, status: "upcoming" },
  { number: 3, dates: "May 4-11", qualifySlots: 5, status: "upcoming" },
  { number: 4, dates: "May 18-25", qualifySlots: 5, status: "upcoming" },
  { number: 5, dates: "Jun 1-8", qualifySlots: 5, status: "upcoming" },
];

export default function ArenaFinale() {
  const navigate = useNavigate();

  return (
    <ArenaLayout
      title="Grand Finale | Arena Season 0 | Molfi"
      description="Season 0 Grand Finale. Top 50 traders compete for the championship."
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold text-foreground">Grand Finale</h1>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30 uppercase tracking-wide">
            SEASON 0
          </Badge>
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 uppercase tracking-wide">
            {FINALE_DETAILS.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          The ultimate showdown. Top 25 qualified traders + 25 FCFS wildcards compete for the Season 0 championship.
        </p>
      </div>

      {/* Finale Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning uppercase tracking-wide">Finale Dates</span>
          </div>
          <p className="text-lg font-semibold text-foreground">Jun 15-22</p>
          <p className="text-xs text-muted-foreground mt-1">2026</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Total Slots</span>
          </div>
          <p className="text-lg font-semibold text-foreground">{FINALE_DETAILS.totalSlots}</p>
          <p className="text-xs text-muted-foreground mt-1">25 qualified + 25 FCFS</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Prize Pool</span>
          </div>
          <p className="text-lg font-semibold text-warning">{FINALE_DETAILS.prizePool}</p>
          <p className="text-xs text-muted-foreground mt-1">Champion: {FINALE_DETAILS.championPrize}</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Duration</span>
          </div>
          <p className="text-lg font-semibold text-foreground">{FINALE_DETAILS.duration}</p>
          <p className="text-xs text-muted-foreground mt-1">17:00 UTC start</p>
        </Card>
      </div>

      {/* Qualification & Entry */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Qualified Entrants */}
        <Card className="p-5 border border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Star className="w-4 h-4 text-warning" />
            Qualified Entrants
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Top 5 traders from each bi-weekly competition automatically qualify.
          </p>
          <div className="space-y-3 text-xs">
            {QUALIFIER_COMPETITIONS.map((comp) => (
              <div 
                key={comp.number} 
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Competition {comp.number}</span>
                  <span className="text-[10px] text-muted-foreground/70">({comp.dates})</span>
                </div>
                <span className="text-foreground">{comp.qualifySlots} slots</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-warning uppercase tracking-wide">Total Qualified Slots</span>
            <span className="text-sm font-semibold text-foreground">{FINALE_DETAILS.qualifiedSlots}</span>
          </div>
        </Card>

        {/* FCFS Entry */}
        <Card className="p-5 border border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            FCFS Entry Slots
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            First-come, first-served entry for traders who didn't qualify through competitions.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Total FCFS Slots</span>
              <span className="text-xs text-foreground">{FINALE_DETAILS.fcfsSlots}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Starting Capital</span>
              <span className="text-xs text-foreground">{FINALE_DETAILS.startingCapital}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-xs text-muted-foreground">Registration Opens</span>
              <span className="text-xs text-foreground">{FINALE_DETAILS.regStart}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-muted-foreground">Registration Closes</span>
              <span className="text-xs text-foreground">{FINALE_DETAILS.regEnd}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-[10px] text-muted-foreground">
              All traders start with identical {FINALE_DETAILS.startingCapital} capital. No advantages given to qualified or FCFS entrants.
            </p>
          </div>
        </Card>
      </div>

      {/* Prize Distribution */}
      <Card className="p-5 border border-warning/20 bg-gradient-to-br from-warning/5 to-transparent mb-8">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          Prize Distribution
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-lg font-semibold text-warning">{FINALE_DETAILS.championPrize}</p>
                <p className="text-xs text-muted-foreground">Season 0 Champion</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sponsored by the Season 0 Title Sponsor. Highest ROI wins.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Star className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{FINALE_DETAILS.runnerUpPool}</p>
                <p className="text-xs text-muted-foreground">2nd - 5th Place</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Distributed among the top runners-up based on final ROI rankings.
            </p>
          </div>
        </div>
      </Card>

      {/* Finale Rules */}
      <Card className="p-5 border border-border mb-8">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Finale Rules
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              All traders start fresh with {FINALE_DETAILS.startingCapital}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              No carryover advantage from qualifiers
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Same markets: BTC, ETH, SOL perpetuals
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Winner determined by highest ROI
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Rankings include unrealized PnL
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Results on-chain verifiable
            </li>
          </ul>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate("/arena")}
          className="text-xs"
        >
          <ChevronRight className="w-3 h-3 mr-1 rotate-180" />
          Back to Arena
        </Button>
        <Button 
          variant="outline" 
          onClick={() => navigate("/arena/learn")}
          className="text-xs"
        >
          Learn More & FAQs
          <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </ArenaLayout>
  );
}
