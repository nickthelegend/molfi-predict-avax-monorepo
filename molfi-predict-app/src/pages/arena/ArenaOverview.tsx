import { useState } from "react";
import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { ArenaCountdown } from "@/components/arena/ArenaCountdown";
import { NotifySignupModal } from "@/components/arena/NotifySignupModal";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Clock, Users, Trophy, AlertCircle, ChevronRight, Calendar, Bell } from "lucide-react";

// Season 0 Competition Schedule - Q2 2026
const SEASON_0_COMPETITIONS = [
  {
    id: "comp-1",
    number: 1,
    status: "UPCOMING" as const,
    regStart: "Mar 30, 2026",
    regEnd: "Apr 4, 2026",
    compStart: "Apr 6, 2026",
    compEnd: "Apr 13, 2026",
    prizePool: "$4,000",
  },
  {
    id: "comp-2",
    number: 2,
    status: "UPCOMING" as const,
    regStart: "Apr 13, 2026",
    regEnd: "Apr 18, 2026",
    compStart: "Apr 20, 2026",
    compEnd: "Apr 27, 2026",
    prizePool: "$4,000",
  },
  {
    id: "comp-3",
    number: 3,
    status: "UPCOMING" as const,
    regStart: "Apr 27, 2026",
    regEnd: "May 2, 2026",
    compStart: "May 4, 2026",
    compEnd: "May 11, 2026",
    prizePool: "$4,000",
  },
  {
    id: "comp-4",
    number: 4,
    status: "UPCOMING" as const,
    regStart: "May 11, 2026",
    regEnd: "May 16, 2026",
    compStart: "May 18, 2026",
    compEnd: "May 25, 2026",
    prizePool: "$4,000",
  },
  {
    id: "comp-5",
    number: 5,
    status: "UPCOMING" as const,
    regStart: "May 25, 2026",
    regEnd: "May 30, 2026",
    compStart: "Jun 1, 2026",
    compEnd: "Jun 8, 2026",
    prizePool: "$4,000",
  },
];

// Season 0 start date: April 6, 2026, 17:00 UTC
const SEASON_0_START = new Date("2026-04-06T17:00:00Z");

export default function ArenaOverview() {
  const navigate = useNavigate();
  const [showNotifyModal, setShowNotifyModal] = useState(false);

  return (
    <ArenaLayout
      title="Arena - Season 0 Pilot | Molfi"
      description="Competitive trading arena. Fixed capital. Observable performance."
    >
      {/* Season Status Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold text-foreground">Season 0</h1>
            <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30 uppercase tracking-wide">
              PILOT
            </Badge>
            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 uppercase tracking-wide">
              COMING SOON
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/arena/pit")}
              className="text-xs bg-warning text-warning-foreground hover:bg-warning/90"
            >
              <Trophy className="w-3 h-3 mr-1" />
              Enter The Pit
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowNotifyModal(true)}
              className="text-xs"
            >
              <Bell className="w-3 h-3 mr-1" />
              Get Notified
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/arena/learn")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Learn More & FAQs
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          12-week competitive trading season starting Q2 2026. 5 bi-weekly competitions + Grand Finale.
        </p>
      </div>

      {/* Countdown Timer */}
      <div className="mb-8">
        <ArenaCountdown targetDate={SEASON_0_START} label="Season 0 Begins In" />
      </div>

      {/* Notification Modal */}
      <NotifySignupModal open={showNotifyModal} onOpenChange={setShowNotifyModal} />

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Season Start</span>
          </div>
          <p className="text-lg font-semibold text-foreground">Apr 6, 2026</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Traders/Comp</span>
          </div>
          <p className="text-lg font-semibold text-foreground">50</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Prize Pool</span>
          </div>
          <p className="text-lg font-semibold text-warning">$30,000</p>
        </Card>
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Starting Capital</span>
          </div>
          <p className="text-lg font-semibold text-foreground">$100</p>
        </Card>
      </div>

      {/* Competition Schedule */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Competition Schedule
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {SEASON_0_COMPETITIONS.map((comp) => (
            <Card 
              key={comp.id}
              className="p-4 border border-border hover:border-primary/30 transition-colors cursor-pointer group"
              onClick={() => navigate(`/arena/competition/${comp.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-foreground">
                  Competition {comp.number}
                </span>
                <Badge 
                  variant="outline" 
                  className="text-[9px] border-muted-foreground/30 text-muted-foreground uppercase"
                >
                  {comp.status}
                </Badge>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{comp.compStart.replace(", 2026", "")} — {comp.compEnd.replace(", 2026", "")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-3 h-3 text-warning" />
                  <span className="text-warning font-medium">{comp.prizePool}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Reg: {comp.regStart.replace(", 2026", "")} — {comp.regEnd.replace(", 2026", "")}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Grand Finale Card */}
      <Card 
        className="p-6 border border-warning/30 cursor-pointer hover:border-warning/50 transition-colors duration-150"
        onClick={() => navigate("/arena/finale")}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">Grand Finale</h3>
              <Badge variant="outline" className="text-[9px] border-warning/30 text-warning">
                JUN 15-22, 2026
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Top 25 qualified traders + 25 FCFS wildcards compete for the championship.
            </p>
            <div className="flex gap-6 text-xs">
              <div>
                <span className="text-muted-foreground uppercase tracking-wide">Qualified Slots</span>
                <p className="text-foreground font-medium mt-0.5">25</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase tracking-wide">FCFS Slots</span>
                <p className="text-foreground font-medium mt-0.5">25</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase tracking-wide">Prize Pool</span>
                <p className="text-warning font-medium mt-0.5">$10,000</p>
              </div>
            </div>
          </div>
          <Trophy className="w-8 h-8 text-warning/50" />
        </div>
      </Card>

      {/* Entry Rules */}
      <Card className="p-5 mt-8 border border-border">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Entry Rules
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Fixed starting capital: $100 (no top-ups)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Trading period: 7 days per competition
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Markets: BTC, ETH, SOL perpetuals
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Top 5 by ROI qualify for finale
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              No re-entries mid-competition
            </li>
            <li className="flex items-start gap-2">
              <span className="text-warning">•</span>
              Performance is publicly observable
            </li>
          </ul>
        </div>
      </Card>
    </ArenaLayout>
  );
}
