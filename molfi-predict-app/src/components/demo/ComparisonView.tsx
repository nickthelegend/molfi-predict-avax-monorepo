import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";

interface ComparisonViewProps {
  onBack: () => void;
}

export function ComparisonView({ onBack }: ComparisonViewProps) {
  const features = [
    { name: "Order Placement", clob: "Off-chain signing", aggregator: "Off-chain signing", both: true },
    { name: "Settlement", clob: "On-chain batch", aggregator: "Cross-chain", both: false },
    { name: "Gas Cost", clob: "~40k per trade", aggregator: "~80k (2 chains)", both: false },
    { name: "Liquidity", clob: "Molfi markets", aggregator: "External venues", both: false },
    { name: "Markets", clob: "Molfi-created", aggregator: "Polymarket, Limitless", both: false },
    { name: "Oracle", clob: "Stork.network", aggregator: "Venue-specific", both: false },
    { name: "Best For", clob: "Price discovery", aggregator: "Market access", both: false },
    { name: "Speed", clob: "Fast (~2s)", aggregator: "Moderate (~6s)", both: false },
    { name: "Efficiency", clob: "80% gas savings", aggregator: "Unified liquidity", both: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button onClick={onBack} variant="ghost">← Back to Home</Button>
        <h2 className="text-3xl font-bold mt-2">Model Comparison</h2>
        <p className="text-muted-foreground">Side-by-side feature comparison</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Native CLOB vs Cross-Chain Aggregator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-left py-4 px-4 font-semibold text-primary">Native CLOB</th>
                  <th className="text-left py-4 px-4 font-semibold text-secondary">Aggregator</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <motion.tr
                    key={feature.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-4 font-medium">{feature.name}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {feature.both ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : null}
                        <span>{feature.clob}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {feature.both ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : null}
                        <span>{feature.aggregator}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">CLOB Advantages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Maximum Efficiency</div>
                <div className="text-sm text-muted-foreground">80% gas savings with batch settlement</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Zero Gas Orders</div>
                <div className="text-sm text-muted-foreground">Place orders off-chain with EIP-712</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Price Discovery</div>
                <div className="text-sm text-muted-foreground">True market-driven pricing</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Fast Settlement</div>
                <div className="text-sm text-muted-foreground">Complete trades in ~2 seconds</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="text-secondary">Aggregator Advantages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Unified Liquidity</div>
                <div className="text-sm text-muted-foreground">Access all major prediction markets</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Best Price Routing</div>
                <div className="text-sm text-muted-foreground">Automatic venue selection</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Wide Market Access</div>
                <div className="text-sm text-muted-foreground">Polymarket, Limitless, and more</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">LP Vault Integration</div>
                <div className="text-sm text-muted-foreground">Earn fees as a liquidity provider</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
