import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useVault } from "@/hooks/useVault";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { formatDistanceToNow } from "date-fns";
import { shortenAddress } from "@/lib/wallet-utils";
import { supabase } from "@/integrations/supabase/db";
import { toast } from "sonner";
import { CommitmentHistory } from "@/components/CommitmentHistory";
import { SEO } from "@/components/SEO";
import {
  Activity,
  TrendingUp,
  Bell,
  Eye,
  LogOut,
  Gift,
  Settings,
  Clock,
} from "lucide-react";

const Profile = () => {
  const { address, disconnect } = useWallet();
  const { profile, user_activity, user_preferences, orders, trading_stats, isLoading, updateProfile } = useProfile();
  const { userRewards, commitments } = useVault();
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // User preferences state
  const [notificationsEnabled, setNotificationsEnabled] = useState(user_preferences?.notifications_enabled ?? true);
  const [emailNotifications, setEmailNotifications] = useState(user_preferences?.email_notifications ?? true);
  
  // Initialize state from profile data when it loads
  useEffect(() => {
    if (profile && !isEditing) {
      setDisplayName(profile.full_name || "");
      setBio(profile.bio || "");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, isEditing]);

  // Calculate total rewards with resilient decimal handling
  const totalCommitmentValue = commitments.reduce((sum, c) => {
    const rawAmount = Number(c.committed_amount);
    // USDC and USDT use 6 decimals, BNB uses 18 decimals
    const decimals = c.token === 'BNB' ? 18 : 6;
    
    // Handle legacy incorrectly stored values (if value is unreasonably large, it was stored with wrong decimals)
    // Legacy USDC/USDT values were stored with 18 decimals instead of 6, causing 10^12 inflation
    if (rawAmount > 10_000_000_000 && c.token !== 'BNB') {
      // Legacy value - divide by 10^12 extra to correct for the error
      return sum + (rawAmount / Math.pow(10, 18));
    }
    
    return sum + (rawAmount / Math.pow(10, decimals));
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const handleEdit = () => {
    setDisplayName(profile?.full_name || "");
    setBio(profile?.bio || "");
    setAvatarPreview(profile?.avatar_url || null);
    setIsEditing(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !address) return null;
    
    try {
      setIsUploadingAvatar(true);
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${address.toLowerCase()}/avatar.${fileExt}`;
      
      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([fileName]);
      
      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    let avatarUrl = profile?.avatar_url;
    
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar();
      if (uploadedUrl) avatarUrl = uploadedUrl;
    }
    
    updateProfile({ 
      full_name: displayName, 
      bio,
      avatar_url: avatarUrl 
    });
    setIsEditing(false);
    setAvatarFile(null);
  };
  
  const handleUpdatePreferences = async () => {
    if (!address) return;
    
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: address.toLowerCase(),
          wallet_address: address.toLowerCase(),
          notifications_enabled: notificationsEnabled,
          email_notifications: emailNotifications,
        });
      
      if (error) throw error;
      toast.success("Preferences updated successfully");
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error("Failed to update preferences");
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "alert_created":
        return <Bell className="w-4 h-4 text-blue-500" />;
      case "market_viewed":
        return <Eye className="w-4 h-4 text-green-500" />;
      case "trade_executed":
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      alert_created: "Alert Created",
      alert_deleted: "Alert Deleted",
      market_viewed: "Market Viewed",
      trade_executed: "Trade Executed",
      page_viewed: "Page Viewed",
      search_performed: "Search",
      filter_applied: "Filter Applied",
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="My Profile - Trading Stats & Rewards | Molfi"
        description="View your prediction market trading activity, soft staking commitments, rewards, and profile settings. Track your open positions, closed trades, and earned rewards on Molfi."
      />
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-2xl">
                        {address?.charAt(2).toUpperCase() || "W"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">{profile?.full_name || "Anonymous"}</h2>
                    <p className="text-muted-foreground">{shortenAddress(address || "")}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => disconnect()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trading_stats.totalActivities}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alerts Created
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trading_stats.alertsCreated}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Markets Viewed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trading_stats.marketsViewed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Trades Executed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{trading_stats.tradesExecuted}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Total Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">${userRewards.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">From ${totalCommitmentValue.toFixed(2)} committed</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="trades" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trades">Trades</TabsTrigger>
              <TabsTrigger value="commitments">
                <Clock className="w-4 h-4 mr-2" />
                Commitments
              </TabsTrigger>
              <TabsTrigger value="rewards">
                <Gift className="w-4 h-4 mr-2" />
                Rewards
              </TabsTrigger>
              <TabsTrigger value="profile">Edit Profile</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trades" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Open Trades */}
                <Card>
                  <CardHeader>
                    <CardTitle>Open Trades</CardTitle>
                    <CardDescription>Your active orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {orders.open.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          No open trades
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.open.map((order: any) => (
                            <div
                              key={order.id}
                              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="default">Pending</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Outcome:</span>
                                  <span className="text-sm font-medium">{order.outcome}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Price:</span>
                                  <span className="text-sm font-medium">{order.price}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Size:</span>
                                  <span className="text-sm font-medium">{order.size}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Closed Trades */}
                <Card>
                  <CardHeader>
                    <CardTitle>Closed Trades</CardTitle>
                    <CardDescription>Your completed or cancelled orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                      {orders.closed.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          No closed trades
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {orders.closed.map((order: any) => (
                            <div
                              key={order.id}
                              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant={order.status === 'filled' ? 'default' : 'secondary'}>
                                  {order.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(order.updated_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Outcome:</span>
                                  <span className="text-sm font-medium">{order.outcome}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Price:</span>
                                  <span className="text-sm font-medium">{order.price}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-muted-foreground">Filled:</span>
                                  <span className="text-sm font-medium">{order.filled_size || '0'}/{order.size}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Commitment History Tab */}
            <TabsContent value="commitments" className="mt-6">
              {address && <CommitmentHistory userAddress={address} />}
            </TabsContent>

            <TabsContent value="rewards" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Soft Staking Rewards
                  </CardTitle>
                  <CardDescription>Track your rewards from soft staking commitments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                        <p className="text-sm text-muted-foreground mb-1">Total Committed</p>
                        <p className="text-3xl font-bold text-primary">${totalCommitmentValue.toFixed(2)}</p>
                      </div>
                      <div className="p-6 rounded-lg bg-gradient-to-br from-secondary/10 to-accent/10 border border-secondary/20">
                        <p className="text-sm text-muted-foreground mb-1">Estimated Rewards</p>
                        <p className="text-3xl font-bold text-secondary">${userRewards.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-4">Active Commitments</h4>
                      {commitments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          No commitments yet. Visit the Earn page to start earning rewards!
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {commitments.map((commitment: any) => {
                            const rawAmount = Number(commitment.committed_amount);
                            const decimals = commitment.token === 'BNB' ? 18 : 6;
                            
                            // Handle legacy incorrectly stored values
                            let amount;
                            if (rawAmount > 10_000_000_000 && commitment.token !== 'BNB') {
                              // Legacy value - stored with 18 decimals instead of 6
                              amount = rawAmount / Math.pow(10, 18);
                            } else {
                              amount = rawAmount / Math.pow(10, decimals);
                            }
                            
                            return (
                              <div 
                                key={commitment.id}
                                className="flex items-center justify-between p-4 border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">{commitment.token}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Started {formatDistanceToNow(new Date(commitment.created_at), { addSuffix: true })}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-lg">${amount.toFixed(2)}</p>
                                  <Badge variant={commitment.status === 'active' ? 'default' : 'secondary'}>
                                    {commitment.status}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Profile Picture</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="w-20 h-20">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="text-2xl">
                            {address?.charAt(2).toUpperCase() || "W"}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {isEditing && (
                        <div className="flex-1">
                          <Input
                            id="avatar"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={isUploadingAvatar}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Upload a profile picture (JPG, PNG, or WEBP)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display Name</Label>
                    <Input
                      id="display-name"
                      value={isEditing ? displayName : profile?.full_name || ""}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <Input id="wallet" value={address || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={isEditing ? bio : profile?.bio || ""}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={!isEditing}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} disabled={isUploadingAvatar}>
                          {isUploadingAvatar ? "Uploading..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isUploadingAvatar}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit}>Edit Profile</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    User Preferences
                  </CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications about price alerts and market updates
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={notificationsEnabled}
                        onCheckedChange={(checked) => {
                          setNotificationsEnabled(checked);
                          handleUpdatePreferences();
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get email updates about your account activity
                        </p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={emailNotifications}
                        onCheckedChange={(checked) => {
                          setEmailNotifications(checked);
                          handleUpdatePreferences();
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wallet Address:</span>
                        <span className="font-mono">{shortenAddress(address || "")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Member Since:</span>
                        <span>
                          {profile?.created_at 
                            ? formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })
                            : "Recently"
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;