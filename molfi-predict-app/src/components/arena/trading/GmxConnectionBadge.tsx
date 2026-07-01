import { useGmxConnection } from '@/hooks/useGmxMarketStats';
import { cn } from '@/lib/utils';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GmxConnectionBadgeProps {
  className?: string;
  showLabel?: boolean;
}

export function GmxConnectionBadge({ className, showLabel = true }: GmxConnectionBadgeProps) {
  const { isConnected, isLoading } = useGmxConnection();

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <Activity className="w-3 h-3 text-muted-foreground animate-pulse" />
        {showLabel && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Connecting...
          </span>
        )}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-1.5 cursor-help",
          className
        )}>
          {isConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              {showLabel && (
                <span className="text-[10px] uppercase tracking-wider font-medium text-success">
                  GMX Live
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-muted-foreground" />
              {showLabel && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Offline
                </span>
              )}
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="text-xs">
          {isConnected 
            ? "Connected to GMX Arbitrum API. Prices and market data are live."
            : "Unable to connect to GMX API. Using cached data."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
