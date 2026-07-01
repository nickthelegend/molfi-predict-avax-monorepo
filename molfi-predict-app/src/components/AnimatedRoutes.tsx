import { Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  publicRoutes,
  gatedRoutes,
  protectedRoutes,
  arenaRoutes,
  notFoundRoute,
} from "./routes/routeConfig";
import {
  renderPublicRoutes,
  renderGatedRoutes,
  renderProtectedRoutes,
  renderArenaRoutes,
  renderNotFoundRoute,
  renderArenaAdminRedirect,
} from "./routes/RouteRenderer";

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes - no auth required */}
        {renderPublicRoutes(publicRoutes)}

        {/* Gated routes - waitlist required (admins bypass) */}
        {renderGatedRoutes(gatedRoutes)}

        {/* Protected routes - wallet connection required */}
        {renderProtectedRoutes(protectedRoutes)}

        {/* Arena routes - gated access */}
        {renderArenaRoutes(arenaRoutes)}

        {/* Arena admin redirect */}
        {renderArenaAdminRedirect()}

        {/* Catch-all 404 */}
        {renderNotFoundRoute(notFoundRoute)}
      </Routes>
    </AnimatePresence>
  );
};
