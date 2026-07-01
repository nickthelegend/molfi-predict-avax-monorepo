import type { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface InfoPopoverProps {
  children: ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

export function InfoPopover({
  children,
  title,
  className,
  iconClassName,
  align = "center",
  side = "top",
}: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-sm text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
          aria-label={title ? `About ${title}` : "More information"}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <HelpCircle className={cn("h-3 w-3", iconClassName)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        className="w-64 space-y-1.5 text-sm leading-relaxed text-muted-foreground"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {title ? <p className="font-semibold text-foreground">{title}</p> : null}
        <div>{children}</div>
      </PopoverContent>
    </Popover>
  );
}

interface LabelWithInfoProps {
  label: ReactNode;
  info: ReactNode;
  infoTitle?: string;
  className?: string;
  labelClassName?: string;
}

export function LabelWithInfo({
  label,
  info,
  infoTitle,
  className,
  labelClassName,
}: LabelWithInfoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className={labelClassName}>{label}</span>
      <InfoPopover title={infoTitle}>{info}</InfoPopover>
    </span>
  );
}

interface HintWithInfoProps {
  summary: ReactNode;
  detail?: ReactNode;
  infoTitle?: string;
  className?: string;
}

/** Short visible line with longer detail in a popover. */
export function HintWithInfo({ summary, detail, infoTitle, className }: HintWithInfoProps) {
  return (
    <span className={cn("inline-flex items-start gap-1.5", className)}>
      <span>{summary}</span>
      {detail ? (
        <InfoPopover title={infoTitle} iconClassName="h-3.5 w-3.5" className="mt-0.5 shrink-0">
          {detail}
        </InfoPopover>
      ) : null}
    </span>
  );
}
