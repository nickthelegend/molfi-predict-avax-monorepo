import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  className?: string;
  compact?: boolean;
}

export function LoadingState({ label = "Loading…", className, compact }: Props) {
  return (
    <div
      className={cn("lx-loading", compact && "lx-loading--compact", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="lx-loading-spinner h-5 w-5" aria-hidden />
      <span className="lx-loading-label">{label}</span>
    </div>
  );
}
