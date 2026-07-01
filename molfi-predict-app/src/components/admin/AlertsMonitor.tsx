import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  market_title: string;
  target_price: number;
  condition: string;
  is_active: boolean;
  created_at: string;
  user_id: string;
}

interface AlertsMonitorProps {
  alerts: Alert[];
}

export function AlertsMonitor({ alerts }: AlertsMonitorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Alerts Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No price alerts found
              </p>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{alert.market_title}</p>
                    <p className="text-xs text-muted-foreground">
                      Target: ${alert.target_price} ({alert.condition})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge variant={alert.is_active ? "default" : "secondary"}>
                    {alert.is_active ? "Active" : "Triggered"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
