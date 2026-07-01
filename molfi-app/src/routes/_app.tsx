import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { loadAppShell } from "@/lib/router/route-loaders";
import { appShellPendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/_app")({
  ...appShellPendingOptions,
  loader: ({ context }) => loadAppShell(context.queryClient),
  component: AppLayout,
});
