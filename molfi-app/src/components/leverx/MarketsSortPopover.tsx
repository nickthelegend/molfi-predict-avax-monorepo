import { ArrowUpDown, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  MARKET_SORT_OPTIONS,
  marketSortLabel,
  type MarketSortId,
  type MarketSortOptionId,
} from "@/lib/leverx/market-sort";
import { cn } from "@/lib/utils";

interface Props {
  value: MarketSortId;
  onChange: (value: MarketSortOptionId) => void;
  className?: string;
}

export function MarketsSortPopover({ value, onChange, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors",
            "hover:bg-hover/55 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            className,
          )}
          aria-label={`Sort markets: ${marketSortLabel(value)}`}
        >
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
          <span className="max-w-36 truncate sm:max-w-none">{marketSortLabel(value)}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        <p className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Sort by
        </p>
        {MARKET_SORT_OPTIONS.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                active && "font-medium text-foreground",
              )}
              onClick={() => onChange(option.id)}
            >
              <Check
                className={cn("h-4 w-4 shrink-0", active ? "opacity-100" : "opacity-0")}
                aria-hidden
              />
              <span>{option.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
