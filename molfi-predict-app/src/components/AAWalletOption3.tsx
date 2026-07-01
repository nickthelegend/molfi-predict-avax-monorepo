import { motion } from "framer-motion";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const AAWalletOption3 = () => {
  const [viewMode, setViewMode] = useState<"user" | "technical">("user");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    
    const steps = ["Intent signed", "Solver selected", "Cross-chain execution", "Settlement complete"];
    
    steps.forEach((step, i) => {
      setTimeout(() => {
        setSimulationStep(i + 1);
        toast.success(step, {
          description: `Step ${i + 1} of ${steps.length}`,
        });
      }, (i + 1) * 1000);
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationStep(0);
      toast.success("🎉 Trade executed successfully!", {
        description: "Total time: 4.2 seconds",
      });
    }, steps.length * 1000 + 500);
  };

  const traditionalSteps = [
    "1. Connect wallet",
    "2. Switch to target network",
    "3. Bridge tokens",
    "4. Approve token spending",
    "5. Execute trade",
    "6. Switch back to original network",
  ];

  const molfiSteps = [
    "1. One-click trade",
    "",
    "[Done! 🎉]",
  ];

  return (
    <div className="space-y-8">

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex rounded-lg border border-border p-1 bg-card">
          <Button
            variant={viewMode === "user" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("user")}
          >
            User View
          </Button>
          <Button
            variant={viewMode === "technical" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("technical")}
          >
            Technical View
          </Button>
        </div>
      </div>

      {/* Split Screen Comparison */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative overflow-hidden rounded-xl border border-border"
      >
        <div className="grid md:grid-cols-2 divide-x divide-border min-h-[500px]">
          {/* Traditional Side */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="p-8 bg-gradient-to-br from-destructive/5 to-destructive/10 relative"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yMCA4YzYuNjI3IDAgMTIgNS4zNzMgMTIgMTJzLTUuMzczIDEyLTEyIDEyUzggMjYuNjI3IDggMjBzNS4zNzMtMTIgMTItMTJ6IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9nPjwvc3ZnPg==')] opacity-20" />
            
            <div className="relative">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-destructive">
                <X className="w-6 h-6" />
                Traditional Wallets
              </h3>
              <p className="text-sm text-muted-foreground mb-6">Multiple steps, high friction</p>

              <div className="space-y-3 mb-8">
                {traditionalSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 p-3 bg-card/50 rounded-lg border border-destructive/20"
                  >
                    <div className="w-6 h-6 rounded-full bg-destructive/20 flex items-center justify-center text-destructive text-sm font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm text-foreground">{step}</span>
                  </motion.div>
                ))}
              </div>

              {viewMode === "user" && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">⏱️ Average time:</span>
                    <span className="font-bold">~2 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔗 Transactions:</span>
                    <span className="font-bold">4 separate txs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">⛓️ Network switches:</span>
                    <span className="font-bold">Multiple</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🧠 Complexity:</span>
                    <span className="font-bold text-destructive">High</span>
                  </div>
                </div>
              )}

              {viewMode === "technical" && (
                <div className="space-y-3 text-sm">
                  <Card className="p-3 bg-card/50">
                    <p className="font-semibold mb-1">Network Switching</p>
                    <p className="text-xs text-muted-foreground">Manual RPC changes, wallet popups</p>
                  </Card>
                  <Card className="p-3 bg-card/50">
                    <p className="font-semibold mb-1">Token Bridges</p>
                    <p className="text-xs text-muted-foreground">3rd party bridges with trust assumptions</p>
                  </Card>
                  <Card className="p-3 bg-card/50">
                    <p className="font-semibold mb-1">Approvals</p>
                    <p className="text-xs text-muted-foreground">Separate approval transactions required</p>
                  </Card>
                </div>
              )}
            </div>
          </motion.div>

          {/* Molfi Side */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="p-8 bg-gradient-to-br from-success/5 to-primary/10 relative"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yMCA4YzYuNjI3IDAgMTIgNS4zNzMgMTIgMTJzLTUuMzczIDEyLTEyIDEyUzggMjYuNjI3IDggMjBzNS4zNzMtMTIgMTItMTJ6IiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLW9wYWNpdHk9Ii4xIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
            
            <div className="relative">
          <h3 className="text-2xl font-bold mb-2 flex items-center gap-2 text-success">
            <Check className="w-6 h-6" />
            Molfi AA Wallet
          </h3>
          <p className="text-sm text-muted-foreground mb-6">Trade from any chain. Stay on your chain. We handle everything.</p>

              <div className="space-y-3 mb-8">
                {molfiSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step ? "bg-success/10 border-success/20" : ""
                    }`}
                  >
                    {step && (
                      <>
                        <Check className="w-6 h-6 text-success" />
                        <span className="text-sm text-foreground font-medium">{step}</span>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>

              {viewMode === "user" && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">⏱️ Average time:</span>
                    <span className="font-bold text-success">~2 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔗 Transactions:</span>
                    <span className="font-bold text-success">1 signature</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🧠 Complexity:</span>
                    <span className="font-bold text-success">Zero</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">⛓️ Stay on your chain:</span>
                    <span className="font-bold text-success">Always</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">🔄 Cross-chain handling:</span>
                    <span className="font-bold text-success">Automated</span>
                  </div>
                </div>
              )}

              {viewMode === "technical" && (
                <div className="space-y-3 text-sm">
                  <Card className="p-3 bg-success/10">
                    <p className="font-semibold mb-1">ERC6900 Intent</p>
                    <p className="text-xs text-muted-foreground">Single signed message for entire flow</p>
                  </Card>
                  <Card className="p-3 bg-success/10">
                    <p className="font-semibold mb-1">Solver Network</p>
                    <p className="text-xs text-muted-foreground">Automated routing and execution</p>
                  </Card>
                  <Card className="p-3 bg-success/10">
                    <p className="font-semibold mb-1">TTE Settlement</p>
                    <p className="text-xs text-muted-foreground">Atomic, trustless execution</p>
                  </Card>
                </div>
              )}

              <Button
                className="w-full mt-6"
                onClick={startSimulation}
                disabled={isSimulating}
              >
                {isSimulating ? (
                  <>Simulating... Step {simulationStep}/4</>
                ) : (
                  <>
                    Simulate Trade
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Glowing Divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent -translate-x-1/2 hidden md:block" />
      </motion.div>

      {/* Powered By */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h3 className="text-center text-lg font-semibold mb-6 text-muted-foreground">Powered by</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { 
              title: "ERC6900", 
              desc: "Smart accounts with intent-based execution", 
              icon: "🔧",
              benefit: "Never switch networks manually"
            },
            { 
              title: "Solver Network", 
              desc: "Automated cross-chain routing & execution", 
              icon: "⚡",
              benefit: "Best prices across all venues"
            },
            { 
              title: "TTE Escrow", 
              desc: "Trustless atomic settlement", 
              icon: "🔒",
              benefit: "Your funds never leave your control"
            },
          ].map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 text-center bg-gradient-to-br from-card to-primary/5 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{tech.icon}</div>
                <h4 className="font-bold text-foreground mb-1">{tech.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{tech.desc}</p>
                <p className="text-xs text-success font-medium">✓ {tech.benefit}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
