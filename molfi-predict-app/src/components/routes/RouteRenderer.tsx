import { Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import { PageTransition, SlideTransition } from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  PageLoadingSkeleton,
  MarketDetailSkeleton,
  TableSkeleton,
  DashboardSkeleton,
} from "@/components/PageLoadingSkeleton";
import type { RouteConfig, SkeletonType, TransitionType } from "./routeConfig";

// ─────────────────────────────────────────────────────────────
// Suspense wrapper with appropriate skeleton
// ─────────────────────────────────────────────────────────────
function SuspenseWrapper({
  children,
  skeleton = "default",
}: {
  children: React.ReactNode;
  skeleton?: SkeletonType;
}) {
  const fallbacks: Record<SkeletonType, React.ReactNode> = {
    default: <PageLoadingSkeleton />,
    detail: <MarketDetailSkeleton />,
    table: <TableSkeleton />,
    dashboard: <DashboardSkeleton />,
  };

  return <Suspense fallback={fallbacks[skeleton]}>{children}</Suspense>;
}

// ─────────────────────────────────────────────────────────────
// Transition wrapper
// ─────────────────────────────────────────────────────────────
function TransitionWrapper({
  children,
  transition = "page",
}: {
  children: React.ReactNode;
  transition?: TransitionType;
}) {
  if (transition === "slide") {
    return <SlideTransition>{children}</SlideTransition>;
  }
  return <PageTransition>{children}</PageTransition>;
}

// ─────────────────────────────────────────────────────────────
// Route generators
// ─────────────────────────────────────────────────────────────
export function renderPublicRoutes(routes: RouteConfig[]) {
  return routes.map(({ path, component: Component, skeleton, transition }) => (
    <Route
      key={path}
      path={path}
      element={
        <TransitionWrapper transition={transition}>
          <SuspenseWrapper skeleton={skeleton}>
            <Component />
          </SuspenseWrapper>
        </TransitionWrapper>
      }
    />
  ));
}

export function renderGatedRoutes(routes: RouteConfig[]) {
  // Gating removed - all routes are now public
  return routes.map(({ path, component: Component, skeleton, transition }) => (
    <Route
      key={path}
      path={path}
      element={
        <TransitionWrapper transition={transition}>
          <SuspenseWrapper skeleton={skeleton}>
            <Component />
          </SuspenseWrapper>
        </TransitionWrapper>
      }
    />
  ));
}

export function renderProtectedRoutes(routes: RouteConfig[]) {
  return routes.map(({ path, component: Component, skeleton, transition }) => (
    <Route
      key={path}
      path={path}
      element={
        <ProtectedRoute>
          <TransitionWrapper transition={transition}>
            <SuspenseWrapper skeleton={skeleton}>
              <Component />
            </SuspenseWrapper>
          </TransitionWrapper>
        </ProtectedRoute>
      }
    />
  ));
}

export function renderArenaRoutes(routes: RouteConfig[]) {
  // Gating removed - all arena routes are now public
  return routes.map(({ path, component: Component, skeleton, transition }) => (
    <Route
      key={path}
      path={path}
      element={
        <TransitionWrapper transition={transition}>
          <SuspenseWrapper skeleton={skeleton}>
            <Component />
          </SuspenseWrapper>
        </TransitionWrapper>
      }
    />
  ));
}

export function renderNotFoundRoute(route: RouteConfig) {
  const { path, component: Component, skeleton, transition } = route;
  return (
    <Route
      key={path}
      path={path}
      element={
        <TransitionWrapper transition={transition}>
          <SuspenseWrapper skeleton={skeleton}>
            <Component />
          </SuspenseWrapper>
        </TransitionWrapper>
      }
    />
  );
}

// Arena admin redirect (special case)
export function renderArenaAdminRedirect() {
  return (
    <Route
      key="arena-admin-redirect"
      path="/arena/admin"
      element={<Navigate to="/admin?tab=arena" replace />}
    />
  );
}
