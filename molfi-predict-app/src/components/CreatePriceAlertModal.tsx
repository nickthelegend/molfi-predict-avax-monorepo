import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { Bell, TrendingUp, TrendingDown } from "lucide-react";
import { z } from "zod";

const alertSchema = z.object({
  targetPrice: z.number().min(0.01, "Price must be greater than 0").max(100, "Price must be less than 100"),
});

interface CreatePriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketId: string;
  marketTitle: string;
  currentPrice: number;
}

export const CreatePriceAlertModal = ({
  open,
  onOpenChange,
  marketId,
  marketTitle,
  currentPrice,
}: CreatePriceAlertModalProps) => {
  const [targetPrice, setTargetPrice] = useState("");
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [error, setError] = useState("");
  const { createAlert } = usePriceAlerts();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const priceValue = parseFloat(targetPrice);
      alertSchema.parse({ targetPrice: priceValue });

      await createAlert(marketId, marketTitle, priceValue, condition);
      onOpenChange(false);
      setTargetPrice("");
      setCondition("above");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("Failed to create alert");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Create Price Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when {marketTitle} reaches your target price
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Current Price: {currentPrice.toFixed(1)}%
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Target Price (%)</Label>
            <Input
              id="price"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              placeholder="Enter target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-3">
            <Label>Alert Condition</Label>
            <RadioGroup value={condition} onValueChange={(v) => setCondition(v as "above" | "below")}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value="above" id="above" />
                <Label htmlFor="above" className="flex items-center gap-2 cursor-pointer flex-1">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span>Alert when price goes above target</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-secondary/50 cursor-pointer">
                <RadioGroupItem value="below" id="below" />
                <Label htmlFor="below" className="flex items-center gap-2 cursor-pointer flex-1">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span>Alert when price goes below target</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Alert
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
