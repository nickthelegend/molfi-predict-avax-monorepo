import { Outlet } from "@tanstack/react-router";
import { SiteShell } from "@/components/SiteShell";

/** Trade terminal — full-width layout inside SiteShell. */
export function DetailLayout() {
  return (
    <SiteShell fullWidth>
      <Outlet />
    </SiteShell>
  );
}
