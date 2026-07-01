import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SiteNavDropdown } from "@/lib/site-nav";
import { cn } from "@/lib/utils";

interface Props {
  entry: SiteNavDropdown;
  className?: string;
  triggerClassName?: string;
  onNavigate?: () => void;
  vertical?: boolean;
}

export function SiteNavEarnMenu({
  entry,
  className,
  triggerClassName,
  onNavigate,
  vertical,
}: Props) {
  const { location } = useRouterState();
  const pathname = location.pathname;
  const active = entry.isActive(pathname);

  if (vertical) {
    return (
      <div className={cn("flex flex-col gap-0.5", className)}>
        <span className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {entry.label}
        </span>
        {entry.items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "nav-tab rounded-sm px-3 py-2 pl-5",
              pathname.startsWith(item.to) && "nav-tab-active",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "nav-tab inline-flex items-center gap-1 outline-none focus-visible:ring-1 focus-visible:ring-ring",
          active && "nav-tab-active",
          triggerClassName,
          className,
        )}
      >
        {entry.label}
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[11rem]">
        {entry.items.map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link to={item.to} onClick={onNavigate} className="flex flex-col items-start gap-0.5">
              <span>{item.label}</span>
              {item.hint ? (
                <span className="text-[11px] font-normal text-muted-foreground">{item.hint}</span>
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
