import { Outlet, useRouterState } from "@tanstack/react-router";
import { AppSiteShell } from "@/components/AppSiteShell";

export function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fullWidth = pathname === "/markets";

  return (
    <AppSiteShell fullWidth={fullWidth}>
      <Outlet />
    </AppSiteShell>
  );
}
