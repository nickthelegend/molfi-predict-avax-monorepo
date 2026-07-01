import { Link, useRouterState } from "@tanstack/react-router";
import { isNavDropdown, SITE_NAV_ENTRIES } from "@/lib/site-nav";
import { SiteNavEarnMenu } from "@/components/SiteNavEarnMenu";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  onNavigate?: () => void;
  vertical?: boolean;
  jarvisUnread?: number;
}

function JarvisUnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -right-2.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-0.5 text-[8px] font-bold leading-none text-accent-foreground"
      aria-label={`${count} unread Jarvis message${count === 1 ? "" : "s"}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function SiteHeaderNav({ className, onNavigate, vertical, jarvisUnread = 0 }: Props) {
  const { location } = useRouterState();
  const pathname = location.pathname;

  return (
    <nav
      className={cn(
        vertical
          ? "flex flex-col gap-1"
          : "flex min-w-0 items-center gap-3 md:gap-4 lg:gap-5 xl:gap-8",
        className,
      )}
      aria-label="Main navigation"
    >
      {SITE_NAV_ENTRIES.map((entry) => {
        if (isNavDropdown(entry)) {
          return (
            <SiteNavEarnMenu
              key={entry.label}
              entry={entry}
              onNavigate={onNavigate}
              vertical={vertical}
            />
          );
        }

        const active = entry.isActive(pathname);
        const cls = cn(
          "nav-tab",
          vertical && "rounded-sm px-3 py-2",
          active && "nav-tab-active",
        );

        if (entry.external) {
          return (
            <a
              key={entry.label}
              href={entry.to}
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
              className={cls}
            >
              {entry.label}
            </a>
          );
        }

        const showJarvisBadge = entry.to === "/jarvis" && jarvisUnread > 0;

        return (
          <Link key={entry.label} to={entry.to} onClick={onNavigate} className={cls}>
            <span className="relative inline-flex items-center">
              {entry.label}
              {showJarvisBadge ? <JarvisUnreadBadge count={jarvisUnread} /> : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
