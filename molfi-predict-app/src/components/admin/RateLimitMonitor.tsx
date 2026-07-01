import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiLimitInfo {
  name: string;
  requestsPerSecond?: number;
  requestsPerDay?: number;
  requestsPerMonth?: number;
  currentUsage?: number;
  maxUsage: number;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}

export function RateLimitMonitor() {
  // API limits configuration
  const apiLimits: ApiLimitInfo[] = [
    {
      name: "Groq API (Llama 3.1)",
      requestsPerDay: 14400,
      maxUsage: 14400,
      status: 'healthy',
      description: "Free tier with 14,400 requests per day for Llama 3.1 8B Instant model"
    },
    {
      name: "CryptoPanic API",
      requestsPerSecond: 2,
      requestsPerMonth: 100,
      maxUsage: 100,
      status: 'healthy',
      description: "Developer plan: 2 req/sec rate limit, 100 req/month quota. News data has 24h delay."
    },
    {
      name: "Google Gemini API",
      requestsPerDay: 1500,
      maxUsage: 1500,
      status: 'healthy',
      description: "Free tier with Gemini Pro and Gemini Flash models. Rate limits vary by model."
    },
    {
      name: "Binance Public API",
      requestsPerSecond: 1200,
      maxUsage: 1200,
      status: 'healthy',
      description: "Public endpoints: 1200 requests per minute (20 req/sec). No API key required."
    },
    {
      name: "Hugging Face Inference",
      maxUsage: Infinity,
      status: 'healthy',
      description: "No hard rate limit on free inference API, but may have queuing during high load."
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      healthy: 'default',
      warning: 'secondary',
      critical: 'destructive'
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              API Rate Limits & Usage
            </CardTitle>
            <CardDescription>
              Monitor third-party API quotas and rate limits
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Rate limits are enforced at the edge function level. The market-analysis function
            includes built-in rate limiting for CryptoPanic (2 req/sec, 100/month) with graceful
            fallbacks if limits are reached.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {apiLimits.map((api) => (
            <Card key={api.name} className="border border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(api.status)}
                      <div>
                        <h4 className="font-semibold">{api.name}</h4>
                        <p className="text-sm text-muted-foreground">{api.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(api.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {api.requestsPerSecond && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Rate Limit</p>
                        <p className="text-lg font-bold">{api.requestsPerSecond} req/sec</p>
                      </div>
                    )}
                    {api.requestsPerDay && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Daily Quota</p>
                        <p className="text-lg font-bold">{api.requestsPerDay.toLocaleString()} req/day</p>
                      </div>
                    )}
                    {api.requestsPerMonth && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Monthly Quota</p>
                        <p className="text-lg font-bold">{api.requestsPerMonth} req/month</p>
                      </div>
                    )}
                  </div>

                  {api.currentUsage !== undefined && api.maxUsage !== Infinity && (
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Usage</span>
                        <span className="font-medium">
                          {api.currentUsage} / {api.maxUsage}
                        </span>
                      </div>
                      <Progress 
                        value={(api.currentUsage / api.maxUsage) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Alert className="bg-muted/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Monitoring Tips:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Check edge function logs for rate limit warnings</li>
              <li>CryptoPanic usage resets monthly and is tracked in the edge function</li>
              <li>Groq and Gemini quotas reset daily</li>
              <li>Consider upgrading API plans if you hit limits frequently</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
