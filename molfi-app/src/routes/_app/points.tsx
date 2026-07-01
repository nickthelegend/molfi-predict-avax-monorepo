import { createFileRoute, redirect } from "@tanstack/react-router";

// Removed in the Stellar migration: the points/leaderboard program is a LeverX
// feature with no equivalent in Molfi's contracts. Redirect to Markets.
export const Route = createFileRoute("/_app/points")({
  beforeLoad: () => {
    throw redirect({ to: "/markets" });
  },
});
