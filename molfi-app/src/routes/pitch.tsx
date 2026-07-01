import { createFileRoute } from "@tanstack/react-router";
import { PitchDeck } from "@/components/pitch/PitchDeck";
import { APP_NAME, pageTitle } from "@/lib/brand";
import { routePendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/pitch")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Pitch") },
      {
        name: "description",
        content: `${APP_NAME} — animated pitch deck for leveraged prediction markets on DeepBook Predict.`,
      },
      { property: "og:title", content: pageTitle("Pitch") },
      {
        property: "og:description",
        content: "Trade prediction markets with leverage. Earn from the pool. Trade from your phone.",
      },
    ],
  }),
  component: PitchPage,
});

function PitchPage() {
  return <PitchDeck />;
}
