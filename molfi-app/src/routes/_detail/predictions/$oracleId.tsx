import { createFileRoute } from "@tanstack/react-router";
import { StellarMarketDetail } from "@/components/StellarMarketDetail";
import { pageTitle } from "@/lib/brand";
import { routePendingOptions } from "@/lib/router/route-options";

export const Route = createFileRoute("/_detail/predictions/$oracleId")({
  ...routePendingOptions,
  loader: () => null,
  head: () => ({
    meta: [
      { title: pageTitle("Market") },
      { name: "description", content: "A live on-chain prediction market on Avalanche." },
    ],
  }),
  component: OracleTradePage,
});

function OracleTradePage() {
  const { oracleId } = Route.useParams();
  return <StellarMarketDetail oracleId={oracleId} />;
}
