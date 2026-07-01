import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Activity, TrendingUp, Users } from "lucide-react";

interface AdminStatsProps {
  totalAlerts: number;
  totalActivity: number;
  totalMarkets: number;
}

export function AdminStats({ totalAlerts, totalActivity, totalMarkets }: AdminStatsProps) {
  const stats = [
    {
      title: "Total Alerts",
      value: totalAlerts,
      icon: Bell,
      description: "Active price alerts",
    },
    {
      title: "User Activity",
      value: totalActivity,
      icon: Activity,
      description: "Recorded events",
    },
    {
      title: "Custom Markets",
      value: totalMarkets,
      icon: TrendingUp,
      description: "Created markets",
    },
    {
      title: "Active Users",
      value: "N/A",
      icon: Users,
      description: "Last 24 hours",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
