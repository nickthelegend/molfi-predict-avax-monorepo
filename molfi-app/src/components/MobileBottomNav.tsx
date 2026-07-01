import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { MOBILE_BOTTOM_NAV } from "@/lib/mobile-nav";

export function MobileBottomNav({ jarvisUnread = 0 }: { jarvisUnread?: number }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="mobile-bottom-nav md:hidden"
      aria-label="Main navigation"
    >
      <ul className="mx-auto flex h-[50px] max-w-lg items-center justify-between px-1">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          const showBadge = item.featured && jarvisUnread > 0;

          return (
            <li key={item.to} className="flex min-w-0 flex-1 justify-center">
              <Link
                to={item.to}
                className={cn(
                  "relative flex h-full min-w-[3rem] flex-col items-center justify-center gap-0.5 rounded-md px-1.5",
                  "text-muted-foreground transition-colors",
                  active && "font-semibold text-foreground",
                )}
              >
                <span className="relative flex items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0",
                      active && "text-accent",
                    )}
                  />
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold leading-none text-accent-foreground">
                      {jarvisUnread > 9 ? "9+" : jarvisUnread}
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-[9px] font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
