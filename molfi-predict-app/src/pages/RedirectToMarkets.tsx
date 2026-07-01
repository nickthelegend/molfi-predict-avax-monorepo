import { Navigate } from "react-router-dom";

/**
 * Inherited (non-Molfi) screens that still render mock data are routed here so a
 * demo or repo review never lands on fake content. They'll be wired to the
 * contracts or removed; until then every path resolves to the real markets view.
 */
export default function RedirectToMarkets() {
  return <Navigate to="/markets" replace />;
}
