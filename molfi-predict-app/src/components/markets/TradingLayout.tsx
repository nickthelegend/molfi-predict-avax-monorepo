import { MarketChart } from "@/components/MarketChart";
import { OrderbookWidget } from "@/components/OrderbookWidget";
import { MarketCardSimple, type MarketCardSimpleProps } from "./MarketCardSimple";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketItem {
  id: string;
  title: string;
  yesPercentage: number;
  noPercentage: number;
  totalVolume: number;
  imageUrl?: string;
  endDate?: string;
  isDaily: boolean;
  resolutionBaseline?: number;
}

interface TradingLayoutProps {
  markets: MarketItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}

export function TradingLayout({ markets, selectedId, onSelect, onBack }: TradingLayoutProps) {
  const selected = markets.find((m) => m.id === selectedId);

  return (
    <div className="flex flex-1 h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left Column — Market List */}
      <div className="w-64 xl:w-72 border-r border-border flex-shrink-0 hidden md:flex flex-col">
        <div className="p-3 border-b border-border flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Markets</span>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {markets.map((m) => (
              <MarketCardSimple
                key={m.id}
                id={m.id}
                title={m.title}
                yesPercentage={m.yesPercentage}
                noPercentage={m.noPercentage}
                totalVolume={m.totalVolume}
                imageUrl={m.imageUrl}
                endDate={m.endDate}
                isSelected={m.id === selectedId}
                isDaily={m.isDaily}
                onClick={() => onSelect(m.id)}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Center Column — Chart */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selected && (
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-bold line-clamp-1">{selected.title}</h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs">
                Yes <span className="font-bold text-emerald-500">{selected.yesPercentage.toFixed(0)}%</span>
              </span>
              <span className="text-xs">
                No <span className="font-bold text-red-500">{(100 - selected.yesPercentage).toFixed(0)}%</span>
              </span>
            </div>
          </div>
        )}
        <div className="flex-1 p-4 overflow-auto">
          <MarketChart marketId={selectedId} height={380} />
          {/* Resolution baseline note */}
          {selected?.resolutionBaseline != null && (
            <div className="mt-3 px-3 py-2 rounded-md bg-muted/50 border border-border text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Resolution baseline:</span>{" "}
              Market resolves above/below <span className="font-bold text-primary">{selected.resolutionBaseline}%</span> threshold
            </div>
          )}
        </div>
        {/* Mobile back */}
        <div className="md:hidden p-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Markets
          </Button>
        </div>
      </div>

      {/* Right Column — Order Book */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-3 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Book</span>
        </div>
        <ScrollArea className="flex-1 p-3">
          <OrderbookWidget marketId={selectedId} compact />
        </ScrollArea>
      </div>
    </div>
  );
}
