import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface TraderCardProps {
  id: string;
  rank: number;
  address: string;
  startingCapital: number;
  currentPnL: number;
  roi: number;
  status: "ACTIVE" | "ELIMINATED" | "QUALIFIED";
  isSelected?: boolean;
  onClick?: () => void;
}

export function TraderCard({ 
  id, 
  rank, 
  address, 
  startingCapital, 
  currentPnL, 
  roi, 
  status,
  isSelected,
  onClick 
}: TraderCardProps) {
  const navigate = useNavigate();
  
  const getStatusColor = () => {
    switch (status) {
      case "QUALIFIED": return "text-success border-success/30";
      case "ELIMINATED": return "text-destructive border-destructive/30";
      default: return "text-muted-foreground border-border";
    }
  };

  const getRoiColor = () => {
    if (roi > 0) return "text-success";
    if (roi < 0) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <Card 
      className={`p-4 cursor-pointer transition-colors duration-150 hover:border-warning/50 ${
        isSelected ? 'border-warning bg-warning/5' : 'border-border'
      }`}
      onClick={onClick || (() => navigate(`/arena/trader/${id}`))}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Rank */}
        <div className="w-8 text-center">
          <span className={`text-lg font-bold ${rank <= 5 ? 'text-warning' : 'text-muted-foreground'}`}>
            {rank}
          </span>
        </div>

        {/* Trader Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            <Badge variant="outline" className={`text-[9px] ${getStatusColor()}`}>
              {status}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Capital: ${startingCapital.toFixed(0)}
          </div>
        </div>

        {/* PnL & ROI */}
        <div className="text-right">
          <div className={`text-sm font-semibold ${getRoiColor()}`}>
            {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
          </div>
          <div className={`text-xs ${currentPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
            {currentPnL >= 0 ? '+' : ''}${currentPnL.toFixed(2)}
          </div>
        </div>
      </div>
    </Card>
  );
}
