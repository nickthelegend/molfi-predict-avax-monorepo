import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

interface WalletBalanceProps {
  usdcBalance: number;
  yesTokens: number;
  noTokens?: number;
}

export function WalletBalance({ usdcBalance, yesTokens, noTokens = 0 }: WalletBalanceProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Demo Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">USDC Balance:</span>
          <motion.span
            key={usdcBalance}
            initial={{ scale: 1.2, color: "hsl(var(--success))" }}
            animate={{ scale: 1, color: "hsl(var(--foreground))" }}
            className="font-bold text-lg"
          >
            ${usdcBalance.toFixed(2)}
          </motion.span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">YES Tokens:</span>
          <motion.span
            key={yesTokens}
            initial={{ scale: 1.2, color: "hsl(var(--success))" }}
            animate={{ scale: 1, color: "hsl(var(--foreground))" }}
            className="font-bold text-lg text-success"
          >
            {yesTokens}
          </motion.span>
        </div>
        {noTokens > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">NO Tokens:</span>
            <motion.span
              key={noTokens}
              initial={{ scale: 1.2, color: "hsl(var(--destructive))" }}
              animate={{ scale: 1, color: "hsl(var(--foreground))" }}
              className="font-bold text-lg text-destructive"
            >
              {noTokens}
            </motion.span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
