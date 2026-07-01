import { createFileRoute, redirect } from "@tanstack/react-router";

// Removed in the Stellar migration: Jarvis (the LeverX automation bot) has no
// equivalent in Molfi's contracts. Redirect to Markets.
export const Route = createFileRoute("/_app/jarvis")({
  beforeLoad: () => {
    throw redirect({ to: "/markets" });
  },
});
