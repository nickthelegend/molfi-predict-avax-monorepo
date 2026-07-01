interface TimelinePhase {
  id: string;
  label: string;
  status: "COMPLETED" | "ACTIVE" | "UPCOMING";
  dates: string;
}

interface SeasonTimelineProps {
  phases: TimelinePhase[];
}

export function SeasonTimeline({ phases }: SeasonTimelineProps) {
  const getPhaseStyles = (status: TimelinePhase["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-muted-foreground/20 border-muted-foreground/30 text-muted-foreground";
      case "ACTIVE":
        return "bg-warning/10 border-warning/50 text-warning";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const getDotStyles = (status: TimelinePhase["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-muted-foreground";
      case "ACTIVE":
        return "bg-warning";
      default:
        return "bg-border";
    }
  };

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-3 top-4 bottom-4 w-px bg-border" />

      {/* Phases */}
      <div className="space-y-3">
        {phases.map((phase, index) => (
          <div key={phase.id} className="relative flex items-start gap-4">
            {/* Dot */}
            <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              phase.status === "ACTIVE" ? "border-warning bg-background" : "border-transparent"
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full ${getDotStyles(phase.status)}`} />
            </div>

            {/* Phase Card */}
            <div className={`flex-1 p-3 rounded-md border ${getPhaseStyles(phase.status)}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide">
                  {phase.label}
                </span>
                {phase.status === "ACTIVE" && (
                  <span className="text-[9px] uppercase tracking-wide text-warning">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {phase.dates}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
