import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { molfiApi } from "@/services/molfi-api";

interface ServiceStatus {
  name: string;
  status: "ok" | "degraded" | "error";
  lastChecked?: string;
  details?: any;
}

export function ApiHealthMonitor() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Backend API", status: "ok" },
    { name: "WebSocket Service", status: "ok" },
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    const newStatuses: ServiceStatus[] = [];

    // Check Backend API
    try {
      const health = await molfiApi.healthCheck();
      newStatuses.push({
        name: "Backend API",
        status: health.status === "ok" ? "ok" : "degraded",
        lastChecked: new Date().toLocaleTimeString(),
        details: { service: health.service },
      });
    } catch {
      newStatuses.push({
        name: "Backend API",
        status: "error",
        lastChecked: new Date().toLocaleTimeString(),
      });
    }

    // Check WebSocket Service
    try {
      const wsHealth = await molfiApi.websocketHealth();
      newStatuses.push({
        name: "WebSocket Service",
        status: wsHealth.status === "healthy" ? "ok" : "degraded",
        lastChecked: new Date().toLocaleTimeString(),
        details: {
          connections: wsHealth.metrics.activeConnections,
          clobConnected: wsHealth.clobClient.connected,
        },
      });
    } catch {
      newStatuses.push({
        name: "WebSocket Service",
        status: "error",
        lastChecked: new Date().toLocaleTimeString(),
      });
    }

    setServices(newStatuses);
    setIsChecking(false);
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ok":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Degraded</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            API Health Monitor
          </CardTitle>
          <button
            onClick={checkHealth}
            disabled={isChecking}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isChecking ? "Checking..." : "Refresh"}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between p-4 rounded-lg bg-card border"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium">{service.name}</p>
                  {service.lastChecked && (
                    <p className="text-sm text-muted-foreground">
                      Last checked: {service.lastChecked}
                    </p>
                  )}
                  {service.details && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {Object.entries(service.details).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(service.status)}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
