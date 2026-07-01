import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { APP_NAME } from "../lib/brand";
import { AppStreamProvider } from "../context/AppStreamContext";
import { MarketFavoritesProvider } from "../context/MarketFavoritesContext";
import { PredictOracleProvider } from "../context/PredictOracleContext";
import { TradeNavigationProvider } from "../context/TradeNavigationContext";
import { Toaster } from "@/components/ui/sonner";
import { EnokiWalletsRegistrar } from "@/components/EnokiWalletsRegistrar";
import { GsapMotionProvider } from "@/components/motion/GsapMotionProvider";
import { WalletProvider } from "../context/WalletContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/markets">Go to markets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  if (import.meta.env.DEV) {
    console.error("[LeverX]", error);
  }
  const router = useRouter();

  const devMessage =
    import.meta.env.DEV && error?.message ? error.message : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        {devMessage ? (
          <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-left text-sm text-destructive">
            {devMessage}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          <Button asChild variant="outline">
            <a href="/">Go home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Trade price predictions with dUSDC margin at up to 10× leverage on the LeverX demo.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content:
          "Trade price predictions with dUSDC margin at up to 10× leverage on the LeverX demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  return (
    <>
      <HeadContent />
      <PredictOracleProvider>
        <TradeNavigationProvider>
          <MarketFavoritesProvider>
            <EnokiWalletsRegistrar />
            <WalletProvider>
              <AppStreamProvider>
                <GsapMotionProvider>
                  <div className="app-outlet flex min-h-dvh flex-col">
                    <Outlet />
                  </div>
                </GsapMotionProvider>
                <Toaster position="bottom-right" richColors closeButton />
              </AppStreamProvider>
            </WalletProvider>
          </MarketFavoritesProvider>
        </TradeNavigationProvider>
      </PredictOracleProvider>
    </>
  );
}
