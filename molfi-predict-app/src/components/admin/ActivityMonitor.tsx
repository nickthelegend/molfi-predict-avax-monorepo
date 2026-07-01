import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  activity_type: string;
  details: any;
  created_at: string;
  user_id: string;
}

interface ActivityMonitorProps {
  activities: Activity[];
}

export function ActivityMonitor({ activities }: ActivityMonitorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity recorded
              </p>
            ) : (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{activity.activity_type}</p>
                    {activity.details && (
                      <p className="text-xs text-muted-foreground">
                        {JSON.stringify(activity.details)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
