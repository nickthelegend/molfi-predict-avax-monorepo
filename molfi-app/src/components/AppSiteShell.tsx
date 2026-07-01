import { type ReactNode } from "react";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SiteShell } from "@/components/SiteShell";
import { useJarvisUnreadCount } from "@/hooks/useJarvis";

/** Main column padding so content clears the fixed mobile bottom nav. */
export const APP_SHELL_MAIN_CLASS =
  "pb-[calc(50px+env(safe-area-inset-bottom,0px))] md:pb-[var(--page-py)]";

export function AppSiteShell({ children, fullWidth }: { children: ReactNode; fullWidth?: boolean }) {
  const jarvisUnread = useJarvisUnreadCount();

  return (
    <SiteShell
      fullWidth={fullWidth}
      jarvisUnread={jarvisUnread}
      fixedChrome={<MobileBottomNav jarvisUnread={jarvisUnread} />}
      mainClassName={APP_SHELL_MAIN_CLASS}
    >
      {children}
    </SiteShell>
  );
}
