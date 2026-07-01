import { createRouter } from "@tanstack/react-router";

import { RoutePending } from "@/components/RoutePending";
import { queryClient } from "@/lib/query-client";
import { routeTree } from "./routeTree.gen";

export { queryClient };

export const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultStaleTime: 60_000,
  defaultPreloadStaleTime: 30_000,
  defaultPendingComponent: RoutePending,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
