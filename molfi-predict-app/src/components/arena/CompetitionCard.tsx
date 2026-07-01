import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface CompetitionCardProps {
  id: string;
  number: number;
  status: "UPCOMING" | "LIVE" | "COMPLETED";
  startDate: string;
  endDate: string;
  participantCount: number;
  qualifiedCount: number;
}

export function CompetitionCard({
  id,
  number,
  status,
  startDate,
  endDate,
  participantCount,
  qualifiedCount,
}: CompetitionCardProps) {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    switch (status) {
      case "LIVE":
        return <Badge variant="outline" className="text-[9px] text-warning border-warning/30">LIVE</Badge>;
      case "COMPLETED":
        return <Badge variant="outline" className="text-[9px] text-muted-foreground border-border">COMPLETED</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] text-muted-foreground border-border">UPCOMING</Badge>;
    }
  };

  return (
    <Card 
      className={`p-4 cursor-pointer transition-colors duration-150 hover:border-warning/50 ${
        status === "LIVE" ? 'border-warning/30' : 'border-border'
      }`}
      onClick={() => navigate(`/arena/competition/${id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Competition {number}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {startDate} — {endDate}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-muted-foreground uppercase tracking-wide">Participants</span>
          <p className="text-foreground font-medium mt-0.5">{participantCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wide">Qualified</span>
          <p className="text-warning font-medium mt-0.5">{qualifiedCount}/5</p>
        </div>
      </div>
    </Card>
  );
}
