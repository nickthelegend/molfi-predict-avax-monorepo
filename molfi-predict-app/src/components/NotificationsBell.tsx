import { useState } from "react";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { useTradingStore } from "@/hooks/useTradingStore";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

export const NotificationsBell = () => {
  const [open, setOpen] = useState(false);
  const { notifications: dbNotifications, unreadCount: dbUnread, isLoading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const { notifications: tradeNotifs, unreadNotifCount: tradeUnread, markNotifRead } = useTradingStore();

  const totalUnread = dbUnread + tradeUnread;

  // Merge trade notifications into a unified list sorted by time
  const allNotifications = [
    ...tradeNotifs.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as string,
      read: n.read,
      created_at: new Date(n.createdAt).toISOString(),
      source: 'trade' as const,
    })),
    ...dbNotifications.map((n) => ({
      ...n,
      source: 'db' as const,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "alert": return "🔔";
      case "success": return "✅";
      case "warning": return "⚠️";
      default: return "ℹ️";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "alert": return "border-l-primary";
      case "success": return "border-l-success";
      case "warning": return "border-l-warning";
      default: return "border-l-muted";
    }
  };

  const handleMarkRead = (notif: typeof allNotifications[0]) => {
    if (notif.source === 'trade') {
      markNotifRead(notif.id);
    } else {
      markAsRead(notif.id);
    }
  };

  const handleDelete = (notif: typeof allNotifications[0]) => {
    if (notif.source === 'db') {
      deleteNotification(notif.id);
    }
    // Trade notifications persist in localStorage — just mark read
    if (notif.source === 'trade') {
      markNotifRead(notif.id);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 9 ? "9+" : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {totalUnread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  markAllAsRead();
                  tradeNotifs.forEach((n) => markNotifRead(n.id));
                }}
                className="text-xs"
              >
                <Check className="w-3 h-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading && allNotifications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : allNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {allNotifications.map((notification) => (
                <div
                  key={`${notification.source}-${notification.id}`}
                  className={cn(
                    "p-4 hover:bg-secondary/50 transition-colors border-l-4",
                    !notification.read && "bg-secondary/20",
                    getNotificationColor(notification.type)
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm line-clamp-2">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleMarkRead(notification)}
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDelete(notification)}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {allNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  window.location.href = "/notifications";
                }}
              >
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
