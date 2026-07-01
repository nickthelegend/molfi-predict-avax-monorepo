import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings, Layers, Zap } from "lucide-react";

interface MarketFiltersSettingsProps {
  animationsEnabled: boolean;
  onAnimationsChange: (enabled: boolean) => void;
  minVolume?: number;
  onMinVolumeChange: (value: number | undefined) => void;
  density: 'compact' | 'comfortable' | 'spacious';
  onDensityChange: (density: 'compact' | 'comfortable' | 'spacious') => void;
}

export function MarketFiltersSettings({
  animationsEnabled,
  onAnimationsChange,
  minVolume,
  onMinVolumeChange,
  density,
  onDensityChange,
}: MarketFiltersSettingsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full border-2">
          <Settings className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Display Settings</SheetTitle>
          <SheetDescription>
            Customize how markets are displayed
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Card Density */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Card Density</Label>
            </div>
            <Select value={density} onValueChange={(v) => onDensityChange(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact - More cards per row</SelectItem>
                <SelectItem value="comfortable">Comfortable - Balanced view</SelectItem>
                <SelectItem value="spacious">Spacious - Larger cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animations */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <Label className="text-base font-semibold">Animations</Label>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="text-sm cursor-pointer">
                Enable card animations
              </Label>
              <Switch
                id="animations"
                checked={animationsEnabled}
                onCheckedChange={onAnimationsChange}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Turn off animations for better performance on slower devices
            </p>
          </div>

          {/* Min Volume Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Minimum Volume Filter</Label>
            <div className="space-y-2">
              <Input
                type="number"
                placeholder="e.g., 1000"
                value={minVolume || ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  onMinVolumeChange(val);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Only show markets with volume above this amount
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
