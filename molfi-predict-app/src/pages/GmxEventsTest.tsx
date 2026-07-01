/**
 * GMX Events Test Page
 * Demonstrates real-time WebSocket event system
 * Navigate to /gmx-events-test to see it in action
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GmxEventFeed } from '@/components/gmx/GmxEventFeed';
import { GmxEventNotifications } from '@/components/gmx/GmxEventNotifications';
import { useGmxEvents } from '@/hooks/useGmxEvents';
import { Wifi, WifiOff, Activity, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function GmxEventsTestPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [testAddress, setTestAddress] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const { events, isConnected, error, lastEventTime } = useGmxEvents(
    testAddress || undefined,
    {
      onEvent: (event) => {
        console.log('[GMX Event Test]', event);
      },
    }
  );
  
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">GMX Real-Time Events Test</h1>
          <p className="text-muted-foreground mt-2">
            WebSocket-based event notifications for GMX trading on Arbitrum
          </p>
        </div>
        
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-500" />
                  <span>Connected to Arbitrum WebSocket</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-500" />
                  <span>Connecting...</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isConnected ? (
                <span className="text-green-600">
                  Listening for events from GMX EventEmitter (0xC8ee...2Fb)
                </span>
              ) : error ? (
                <span className="text-destructive">{error}</span>
              ) : (
                <span>Establishing WebSocket connection...</span>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Connection Status</p>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? '🟢 Live' : '🔴 Offline'}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Event</p>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {lastEventTime 
                      ? formatDistanceToNow(lastEventTime, { addSuffix: true })
                      : 'None yet'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">WebSocket Endpoint</p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                wss://arb1.arbitrum.io/rpc
              </code>
            </div>
          </CardContent>
        </Card>
        
        {/* User Address Input */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Events by User</CardTitle>
            <CardDescription>
              Enter a wallet address to see events only for that user (leave empty for all events)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="0x... (Arbitrum address)"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                className="font-mono text-sm"
              />
              <Button
                onClick={() => setTestAddress(userAddress)}
                disabled={!userAddress || userAddress === testAddress}
              >
                Apply Filter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUserAddress('');
                  setTestAddress('');
                }}
                disabled={!testAddress}
              >
                Clear
              </Button>
            </div>
            
            {testAddress && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded">
                <Activity className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  Filtering events for: <code className="font-mono">{testAddress}</code>
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm">
                Enable toast notifications (will show popup alerts for events)
              </label>
            </div>
          </CardContent>
        </Card>
        
        {/* Event Feed */}
        <GmxEventFeed
          userAddress={testAddress || undefined}
          maxHeight="600px"
          showConnectionStatus={false}
        />
        
        {/* Toast Notifications Handler */}
        {notificationsEnabled && (
          <GmxEventNotifications
            userAddress={testAddress || undefined}
            enabled={notificationsEnabled}
          />
        )}
        
        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">1. Watch All Events (Default)</h4>
              <p className="text-sm text-muted-foreground">
                Leave the address field empty to see all GMX events on Arbitrum. You'll see orders being executed, positions changing, etc.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">2. Filter by Your Address</h4>
              <p className="text-sm text-muted-foreground">
                Enter your wallet address to see only your events. Then go place a trade on GMX:
              </p>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Navigate to Arena Trading Terminal</li>
                <li>Place an order (e.g., buy BTC-USD)</li>
                <li>Watch this page for real-time events</li>
                <li>You should see: OrderCreated → OrderExecuted</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">3. Test Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Enable toast notifications and place a trade. You'll see popup alerts when orders execute.
              </p>
            </div>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded">
              <p className="text-sm">
                <strong>Note:</strong> Events only appear when real trades happen on GMX. 
                Sandbox mode trades won't trigger events because they're not on-chain.
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Details</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold mb-1">Event Contract</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  0xC8ee91A54287DB53897056e12D9819156D3822Fb
                </code>
              </div>
              
              <div>
                <p className="font-semibold mb-1">Event Type</p>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  EventLog1
                </code>
              </div>
              
              <div>
                <p className="font-semibold mb-1">Cost</p>
                <Badge variant="outline" className="text-green-600">
                  $0 gas (read-only)
                </Badge>
              </div>
              
              <div>
                <p className="font-semibold mb-1">Latency</p>
                <Badge variant="outline">
                  ~0.3-1s (block time)
                </Badge>
              </div>
            </div>
            
            <div className="pt-3 border-t">
              <p className="font-semibold mb-2">Supported Events</p>
              <div className="grid grid-cols-3 gap-2">
                <Badge variant="secondary">OrderCreated</Badge>
                <Badge variant="secondary">OrderExecuted</Badge>
                <Badge variant="secondary">OrderCancelled</Badge>
                <Badge variant="secondary">PositionIncrease</Badge>
                <Badge variant="secondary">PositionDecrease</Badge>
                <Badge variant="secondary">PositionLiquidated</Badge>
                <Badge variant="secondary">DepositExecuted</Badge>
                <Badge variant="secondary">WithdrawalExecuted</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
