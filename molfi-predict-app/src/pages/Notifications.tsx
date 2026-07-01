import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Trash2, Check, CheckCheck, AlertCircle, Info, CheckCircle } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { cn } from "@/lib/utils";

const Notifications = () => {
  const { notifications, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert":
        return <AlertCircle className="w-5 h-5 text-primary" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-warning" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case "alert":
        return "border-l-primary";
      case "success":
        return "border-l-success";
      case "warning":
        return "border-l-warning";
      default:
        return "border-l-muted";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Stay updated with price alerts and important updates
          </p>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all">
                All Notifications ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({notifications.filter((n) => !n.read).length})
              </TabsTrigger>
            </TabsList>

            {notifications.some((n) => !n.read) && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All as Read
              </Button>
            )}
          </div>

          <TabsContent value={filter} className="space-y-4 mt-0">
            {filteredNotifications.length === 0 ? (
              <Card className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-xl font-semibold mb-2">
                  {filter === "unread" ? "No Unread Notifications" : "No Notifications"}
                </h3>
                <p className="text-muted-foreground">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "You'll see notifications here when they arrive"}
                </p>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={cn(
                    "p-6 border-l-4 transition-all hover:shadow-md",
                    !notification.read && "bg-secondary/20",
                    getNotificationBorderColor(notification.type)
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                          {new Date(notification.created_at).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>

                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
};

export default Notifications;
