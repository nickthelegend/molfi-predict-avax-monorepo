import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PriceAlertsPanelProps {
  marketId: string;
  marketTitle: string;
  currentPrice: number;
}

export function PriceAlertsPanel({ marketId, marketTitle, currentPrice }: PriceAlertsPanelProps) {
  const { alerts, isLoading, createAlert, deleteAlert, toggleAlert } = usePriceAlerts(marketId);
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");

  const handleCreateAlert = async () => {
    const price = parseFloat(targetPrice);
    if (!price || price <= 0) {
      return;
    }
    await createAlert(marketId, marketTitle, price, condition);
    setTargetPrice("");
  };

  return (
    <Card className="p-3">
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        <Bell className="w-4 h-4" />
        Price Alerts
      </h3>

      <Tabs value={condition} onValueChange={(v) => setCondition(v as "above" | "below")} className="mb-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="above" className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            Above
          </TabsTrigger>
          <TabsTrigger value="below" className="text-xs">
            <TrendingDown className="w-3 h-3 mr-1" />
            Below
          </TabsTrigger>
        </TabsList>

        <TabsContent value={condition} className="mt-2 space-y-2">
          <div>
            <Label className="text-xs">Target Price</Label>
            <div className="flex gap-1 mt-1">
              <Input
                type="number"
                placeholder={`e.g., ${currentPrice.toFixed(2)}`}
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="h-8 text-sm"
                step="0.01"
              />
              <Button onClick={handleCreateAlert} size="sm" className="h-8 text-xs">
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current: ${currentPrice.toFixed(2)}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Active Alerts List */}
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-2">Loading alerts...</p>
        ) : alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">No alerts set</p>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-2 rounded bg-secondary/30 hover:bg-secondary/50"
            >
              <div className="flex items-center gap-2 flex-1">
                <Badge variant="outline" className="text-xs">
                  {alert.condition === "above" ? (
                    <TrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <TrendingDown className="w-3 h-3 mr-1" />
                  )}
                  ${alert.target_price}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {alert.condition === "above" ? "≥" : "≤"} target
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={(checked) => toggleAlert(alert.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAlert(alert.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
