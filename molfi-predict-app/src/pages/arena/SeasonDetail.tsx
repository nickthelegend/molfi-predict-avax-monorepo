import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { SeasonTimeline } from "@/components/arena/SeasonTimeline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";
import { Lock, Unlock } from "lucide-react";

// Season 0 timeline phases - Q2 2026
const mockPhases = [
  { id: "reg", label: "Registration Opens", status: "UPCOMING" as const, dates: "Mar 30 — Apr 4, 2026" },
  { id: "comp-1", label: "Competition 1", status: "UPCOMING" as const, dates: "Apr 6 — Apr 13, 2026" },
  { id: "comp-2", label: "Competition 2", status: "UPCOMING" as const, dates: "Apr 20 — Apr 27, 2026" },
  { id: "comp-3", label: "Competition 3", status: "UPCOMING" as const, dates: "May 4 — May 11, 2026" },
  { id: "comp-4", label: "Competition 4", status: "UPCOMING" as const, dates: "May 18 — May 25, 2026" },
  { id: "comp-5", label: "Competition 5", status: "UPCOMING" as const, dates: "Jun 1 — Jun 8, 2026" },
  { id: "finale", label: "Grand Finale", status: "UPCOMING" as const, dates: "Jun 15 — Jun 22, 2026" },
];

// Mock qualified slots
const qualifiedSlots = Array(25).fill(null).map((_, i) => ({
  slot: i + 1,
  traderId: null,
  competition: null,
}));

export default function SeasonDetail() {
  const { id } = useParams();

  return (
    <ArenaLayout
      title={`Season ${id} Details | Arena | Molfi`}
      description="Season structure, timeline, and qualification status."
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-semibold text-foreground">Season {id === "0" || !id ? "0" : id}</h1>
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-muted-foreground/30 uppercase tracking-wide">
            PILOT
          </Badge>
          <Badge variant="outline" className="text-[10px] text-primary border-primary/30 uppercase tracking-wide">
            COMING SOON
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Season structure and progression overview
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Timeline */}
        <Card className="p-6 border border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-6">
            Season Timeline
          </h2>
          <SeasonTimeline phases={mockPhases} />
        </Card>

        {/* Qualification Status */}
        <Card className="p-6 border border-border">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
            Finale Qualification Slots
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            25 slots reserved for top 5 traders from each competition
          </p>

          <div className="grid grid-cols-5 gap-2">
            {qualifiedSlots.map((slot) => (
              <div 
                key={slot.slot}
                className={`aspect-square rounded-md border flex items-center justify-center ${
                  slot.traderId 
                    ? 'bg-warning/10 border-warning/30' 
                    : 'bg-muted border-border'
                }`}
              >
                {slot.traderId ? (
                  <Unlock className="w-3 h-3 text-warning" />
                ) : (
                  <Lock className="w-3 h-3 text-muted-foreground/50" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-warning/10 border border-warning/30" />
              <span className="text-muted-foreground">Qualified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-muted border border-border" />
              <span className="text-muted-foreground">Available</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Rules Summary */}
      <Card className="p-6 mt-8 border border-border">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
          Competition Rules
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xs text-warning uppercase tracking-wide mb-2">Capital</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Fixed $100 starting capital</li>
              <li>• No wallet top-ups allowed</li>
              <li>• Capital locked at competition start</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-warning uppercase tracking-wide mb-2">Trading</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• BTC, ETH, SOL perpetuals only</li>
              <li>• 7-day trading window</li>
              <li>• All trades publicly visible</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs text-warning uppercase tracking-wide mb-2">Ranking</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Ranked by ROI percentage</li>
              <li>• Top 5 qualify for finale</li>
              <li>• No re-entries mid-competition</li>
            </ul>
          </div>
        </div>
      </Card>
    </ArenaLayout>
  );
}
