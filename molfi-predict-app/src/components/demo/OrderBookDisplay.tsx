import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Order } from "@/types/demo";

interface OrderBookDisplayProps {
  buyOrders: Order[];
  sellOrders: Order[];
  currentPrice?: number;
  outcome?: "YES" | "NO";
  onOutcomeChange?: (outcome: "YES" | "NO") => void;
}

export function OrderBookDisplay({ buyOrders, sellOrders, currentPrice, outcome = "YES", onOutcomeChange }: OrderBookDisplayProps) {
  const spread = sellOrders[0]?.price - buyOrders[0]?.price;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Order Book</CardTitle>
          {onOutcomeChange && (
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <button
                onClick={() => onOutcomeChange("YES")}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  outcome === "YES" 
                    ? "bg-success text-success-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                YES
              </button>
              <button
                onClick={() => onOutcomeChange("NO")}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  outcome === "NO" 
                    ? "bg-destructive text-destructive-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                NO
              </button>
            </div>
          )}
        </div>
        {currentPrice && (
          <motion.div
            key={currentPrice}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-sm"
          >
            <span className="text-muted-foreground">Mid Price ({outcome}): </span>
            <span className="text-primary font-bold">${currentPrice.toFixed(2)}</span>
          </motion.div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Bids (Buy Orders) */}
          <div className="space-y-1">
            <div className="font-semibold text-success text-sm mb-2">BIDS</div>
            <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2 mb-1 px-2">
              <span>Price</span>
              <span>Size</span>
              <span>Total</span>
            </div>
            {buyOrders.map((order, i) => (
              <motion.div
                key={`buy-${order.price}-${order.size}-${i}`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`text-sm grid grid-cols-3 gap-2 p-2 rounded hover:bg-success/5 transition-colors ${
                  i === 0 ? 'bg-success/10 border border-success/20' : 'bg-muted/20'
                }`}
              >
                <motion.span
                  key={`price-${order.price}`}
                  initial={{ color: 'hsl(var(--success))' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="text-success font-medium"
                >
                  ${order.price.toFixed(2)}
                </motion.span>
                <motion.span
                  key={`size-${order.size}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}
                  className="font-mono"
                >
                  {order.size}
                </motion.span>
                <span className="text-muted-foreground text-xs">${order.total.toFixed(1)}</span>
              </motion.div>
            ))}
          </div>

          {/* Asks (Sell Orders) */}
          <div className="space-y-1">
            <div className="font-semibold text-destructive text-sm mb-2">ASKS</div>
            <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2 mb-1 px-2">
              <span>Price</span>
              <span>Size</span>
              <span>Total</span>
            </div>
            {sellOrders.map((order, i) => (
              <motion.div
                key={`sell-${order.price}-${order.size}-${i}`}
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className={`text-sm grid grid-cols-3 gap-2 p-2 rounded hover:bg-destructive/5 transition-colors ${
                  i === 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/20'
                }`}
              >
                <motion.span
                  key={`price-${order.price}`}
                  initial={{ color: 'hsl(var(--destructive))' }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3 }}
                  className="text-destructive font-medium"
                >
                  ${order.price.toFixed(2)}
                </motion.span>
                <motion.span
                  key={`size-${order.size}`}
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.3 }}
                  className="font-mono"
                >
                  {order.size}
                </motion.span>
                <span className="text-muted-foreground text-xs">${order.total.toFixed(1)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Spread Indicator */}
        {spread && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-xs text-muted-foreground"
          >
            Spread: ${spread.toFixed(3)} • {((spread / buyOrders[0]?.price) * 100).toFixed(2)}%
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
