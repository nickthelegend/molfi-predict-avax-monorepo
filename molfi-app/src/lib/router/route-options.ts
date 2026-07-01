import {
  AppShellRoutePending,
  DetailShellRoutePending,
  RoutePending,
} from "@/components/RoutePending";

/** Leaf route pending — pair with a route `loader` on file routes under a layout. */
export const routePendingOptions = {
  pendingComponent: RoutePending,
} as const;

/** `_app` layout pending — preserve `SiteShell` while the layout loader runs. */
export const appShellPendingOptions = {
  pendingComponent: AppShellRoutePending,
} as const;

/** `_detail` layout pending — preserve full-width `SiteShell` while the layout loader runs. */
export const detailShellPendingOptions = {
  pendingComponent: DetailShellRoutePending,
} as const;
