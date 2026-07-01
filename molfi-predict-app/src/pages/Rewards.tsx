import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Zap, Target, Star, Clock, CheckCircle } from "lucide-react";

const Rewards = () => {
  const activeRewards = [
    {
      title: "Daily Streak",
      description: "Trade for 7 consecutive days",
      progress: 4,
      total: 7,
      reward: "50 PRED",
      icon: Zap,
      color: "text-yellow-500"
    },
    {
      title: "First Win",
      description: "Win your first market prediction",
      progress: 0,
      total: 1,
      reward: "25 PRED",
      icon: Target,
      color: "text-green-500"
    },
    {
      title: "Volume Master",
      description: "Trade $10,000 in total volume",
      progress: 6420,
      total: 10000,
      reward: "200 PRED",
      icon: Star,
      color: "text-blue-500"
    },
  ];

  const completedRewards = [
    {
      title: "Welcome Bonus",
      reward: "10 PRED",
      completedAt: "2 days ago"
    },
    {
      title: "First Trade",
      reward: "5 PRED",
      completedAt: "3 days ago"
    },
  ];

  const calculateProgress = (current: number, total: number) => {
    return Math.min((current / total) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="px-3 py-8 max-w-6xl mx-auto">
        {/* Beta Banner */}
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <p className="text-sm text-center text-muted-foreground">
            <span className="font-semibold text-primary">Preview Mode:</span> Rewards program launching soon
          </p>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Rewards</h1>
          <p className="text-muted-foreground">Complete challenges and earn PRED tokens</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Your Balance</p>
                <p className="text-5xl font-bold text-foreground">1,247 <span className="text-3xl text-primary">PRED</span></p>
              </div>
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <Gift className="w-10 h-10 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Challenges */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Active Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeRewards.map((reward, index) => {
              const Icon = reward.icon;
              const progress = calculateProgress(reward.progress, reward.total);
              
              return (
                <Card key={index} className="overflow-hidden hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center ${reward.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <Badge variant="secondary" className="font-bold">
                        {reward.reward}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">
                          {reward.progress}/{reward.total}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Completed Rewards */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Completed</h2>
          <Card>
            <div className="divide-y divide-border">
              {completedRewards.map((reward, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-accent/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{reward.title}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {reward.completedAt}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-success border-success/50">
                    +{reward.reward}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Rewards;
