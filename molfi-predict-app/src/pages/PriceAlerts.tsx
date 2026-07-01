import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, TrendingUp, TrendingDown, Trash2, Plus } from "lucide-react";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const PriceAlerts = () => {
  const { alerts, isLoading, deleteAlert, toggleAlert } = usePriceAlerts();

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
            Price Alerts
          </h1>
          <p className="text-muted-foreground">
            Manage your price alerts and get notified when markets reach your target prices
          </p>
        </div>

        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-semibold mb-2">No Price Alerts</h3>
            <p className="text-muted-foreground mb-6">
              Set alerts on markets to get notified when prices reach your targets
            </p>
            <Button onClick={() => (window.location.href = "/markets")}>
              <Plus className="w-4 h-4 mr-2" />
              Browse Markets
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`p-2 rounded-lg ${
                          alert.condition === "above"
                            ? "bg-success/10"
                            : "bg-destructive/10"
                        }`}
                      >
                        {alert.condition === "above" ? (
                          <TrendingUp className="w-5 h-5 text-success" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {alert.market_title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Target: </span>
                        <span className="font-semibold">
                          {alert.target_price.toFixed(1)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Condition: </span>
                        <Badge
                          variant={
                            alert.condition === "above" ? "default" : "outline"
                          }
                          className={
                            alert.condition === "above"
                              ? "bg-success"
                              : "bg-destructive"
                          }
                        >
                          {alert.condition === "above" ? "Above" : "Below"}
                        </Badge>
                      </div>
                      {alert.triggered_at && (
                        <div>
                          <Badge variant="secondary">
                            Triggered {new Date(alert.triggered_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.is_active}
                        onCheckedChange={(checked) =>
                          toggleAlert(alert.id, checked)
                        }
                        disabled={!!alert.triggered_at}
                      />
                      <span className="text-sm text-muted-foreground">
                        {alert.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default PriceAlerts;
