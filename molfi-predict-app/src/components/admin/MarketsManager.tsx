import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { CreateMarketDialog } from "./CreateMarketDialog";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/db";
import { toast } from "sonner";

interface Market {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  initial_probability: number;
}

interface MarketsManagerProps {
  markets: Market[];
}

export function MarketsManager({ markets }: MarketsManagerProps) {
  const handleDelete = async (marketId: string) => {
    try {
      const { error } = await supabase
        .from("custom_markets")
        .delete()
        .eq("id", marketId);

      if (error) throw error;
      toast.success("Market deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete market");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Custom Markets</CardTitle>
        <CreateMarketDialog />
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {markets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No custom markets created yet
              </p>
            ) : (
              markets.map((market) => (
                <div
                  key={market.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <p className="text-sm font-medium">{market.title}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline">{market.category}</Badge>
                      <Badge variant={market.status === "active" ? "default" : "secondary"}>
                        {market.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Initial probability: {(market.initial_probability * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(market.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(market.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
