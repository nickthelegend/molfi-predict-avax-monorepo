/**
 * GMX API Health Check Component
 * Shows real-time status of GMX API endpoints
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { testGmxApi, testPriceData } from '@/utils/gmx-debug';

interface ApiStatus {
  isHealthy: boolean;
  lastCheck: Date;
  error?: string;
}

export function GmxApiHealthCheck() {
  const [status, setStatus] = useState<ApiStatus>({
    isHealthy: true,
    lastCheck: new Date(),
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      await testGmxApi();
      await testPriceData();
      setStatus({
        isHealthy: true,
        lastCheck: new Date(),
      });
    } catch (error: any) {
      setStatus({
        isHealthy: false,
        lastCheck: new Date(),
        error: error.message || 'API health check failed',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">GMX API Status</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
            className="h-7 px-2"
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Connection Status</span>
          {status.isHealthy ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Operational
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              <AlertCircle className="w-3 h-3 mr-1" />
              Degraded
            </Badge>
          )}
        </div>

        {status.error && (
          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
            {status.error}
          </div>
        )}

        <div className="text-[10px] text-muted-foreground">
          Last checked: {status.lastCheck.toLocaleTimeString()}
        </div>

        <div className="pt-2 border-t border-border/50">
          <a
            href="https://status.gmx.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View GMX Status Page
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
