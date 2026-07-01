/**
 * GMX Event Feed Component
 * Shows recent GMX events in a scrollable feed
 * Useful for debugging and user activity tracking
 */

import { useGmxEvents, useGmxEventMessages } from '@/hooks/useGmxEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface GmxEventFeedProps {
  userAddress?: string;
  maxHeight?: string;
  showConnectionStatus?: boolean;
}

export function GmxEventFeed({
  userAddress,
  maxHeight = '400px',
  showConnectionStatus = true,
}: GmxEventFeedProps) {
  const { events, isConnected, error, lastEventTime } = useGmxEvents(userAddress, undefined, {
    maxEvents: 50,
  });
  
  const messages = useGmxEventMessages(events);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          {showConnectionStatus && (
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-muted-foreground">Disconnected</span>
                </>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive mt-1">{error}</p>
        )}
      </CardHeader>
      
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No recent activity</p>
            {!isConnected && (
              <p className="text-xs mt-2">Connecting to live feed...</p>
            )}
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div
                  key={`${msg.event.transactionHash}-${msg.event.logIndex}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Badge
                    variant={
                      msg.severity === 'success'
                        ? 'default'
                        : msg.severity === 'error'
                        ? 'destructive'
                        : msg.severity === 'warning'
                        ? 'secondary'
                        : 'outline'
                    }
                    className="mt-0.5"
                  >
                    {msg.event.eventName}
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{msg.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`https://arbiscan.io/tx/${msg.event.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary truncate"
                      >
                        {msg.event.transactionHash.slice(0, 10)}...{msg.event.transactionHash.slice(-8)}
                      </a>
                      {lastEventTime && (
                        <span className="text-xs text-muted-foreground">
                          •
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Block {msg.event.blockNumber.toString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for small spaces
 */
export function GmxEventFeedCompact({
  userAddress,
  maxEvents = 5,
}: {
  userAddress?: string;
  maxEvents?: number;
}) {
  const { events, isConnected } = useGmxEvents(userAddress, undefined, {
    maxEvents,
  });
  
  const messages = useGmxEventMessages(events);
  
  if (events.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        {isConnected ? 'No recent activity' : 'Connecting...'}
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {messages.slice(0, maxEvents).map((msg, index) => (
        <div
          key={`${msg.event.transactionHash}-${index}`}
          className="flex items-center gap-2 p-2 rounded text-xs border"
        >
          <span>{msg.message}</span>
          <a
            href={`https://arbiscan.io/tx/${msg.event.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-muted-foreground hover:text-primary"
          >
            View
          </a>
        </div>
      ))}
    </div>
  );
}
