import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: Props) {
  return (
    <div
      className={cn("lx-empty", compact && "lx-empty--compact", className)}
      role="status"
    >
      {Icon ? (
        <span className="lx-empty-icon" aria-hidden>
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </span>
      ) : null}
      <p className="lx-empty-title">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
