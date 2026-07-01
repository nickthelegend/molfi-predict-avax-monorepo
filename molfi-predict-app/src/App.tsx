import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SEO } from "@/components/SEO";
import { CookieConsent } from "@/components/CookieConsent";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AlphaBanner } from "@/components/AlphaBanner";
import { PlatformProvider } from "@/components/PlatformProvider";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { AdminFloatingButton } from "@/components/AdminFloatingButton";
import { MolfiWalletProvider } from "@/contexts/MolfiWalletContext";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useEffect } from "react";

const queryClient = new QueryClient();

function AppContent() {
  usePageTracking();

  // Catch unhandled promise rejections (e.g. MetaMask connection failures)
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn("Unhandled rejection caught:", event.reason);
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);
  
  return (
    <>
      <SEO />
      <AlphaBanner />
      <CookieConsent />
      <AnimatedRoutes />
      <AdminFloatingButton />
      <MobileBottomNav />
    </>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PlatformProvider>
          {/* Stellar Wallets Kit is a singleton — no React provider needed. */}
          <TooltipProvider>
            <MolfiWalletProvider>
              <WebSocketProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </WebSocketProvider>
            </MolfiWalletProvider>
          </TooltipProvider>
        </PlatformProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;