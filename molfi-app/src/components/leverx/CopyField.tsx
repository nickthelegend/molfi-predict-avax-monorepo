import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { pillIconBtn, pillToggleIdle } from "@/lib/leverx/tw";
import { cn } from "@/lib/utils";

export function shortAddress(value: string, head = 8, tail = 6): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

interface Props {
  label: string;
  value: string;
  displayHead?: number;
  displayTail?: number;
  hint?: string;
  className?: string;
}

/** Truncated display with one-click copy of the full value. */
export function CopyField({
  label,
  value,
  displayHead = 12,
  displayTail = 8,
  hint,
  className,
}: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-md border border-border/80 bg-muted/30 px-3 py-2",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-mono text-sm text-foreground" title={value}>
          {shortAddress(value, displayHead, displayTail)}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <button
        type="button"
        className={cn(pillIconBtn, pillToggleIdle, "shrink-0 px-2 py-1.5 text-[11px]")}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            /* clipboard unavailable */
          }
        }}
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
