import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/db";
import { 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock,
  Loader2,
  AlertTriangle,
  FileText,
  Bell,
  Download,
  Mail,
} from "lucide-react";

interface Competition {
  id: string;
  competition_number: number;
  is_finale: boolean;
  status: string;
  is_whitelist_only: boolean;
}

interface WhitelistEntry {
  id: string;
  competition_id: string;
  wallet_address: string;
  added_at: string;
}

interface Registration {
  id: string;
  wallet_address: string;
  arena_wallet_address: string | null;
  deposit_amount: number;
  status: string;
  admission_type: string;
}

interface AdminLog {
  id: string;
  action: string;
  target_type: string;
  details: any;
  created_at: string;
}

interface NotificationSignup {
  id: string;
  email: string;
  wallet_address: string | null;
  created_at: string;
  notified_at: string | null;
  unsubscribed_at: string | null;
}

export function ArenaAdminTab() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [notificationSignups, setNotificationSignups] = useState<NotificationSignup[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Bulk notification state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("🎯 Registration is NOW OPEN for Molfi Arena Season 0!");
  const [bulkType, setBulkType] = useState<"registration_open" | "reminder" | "custom">("registration_open");
  const [bulkCustomMessage, setBulkCustomMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  useEffect(() => {
    fetchCompetitions();
    fetchLogs();
    fetchNotificationSignups();
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      fetchWhitelist();
      fetchRegistrations();
    }
  }, [selectedCompetition]);

  const fetchCompetitions = async () => {
    const { data } = await supabase
      .from("arena_competitions")
      .select("*")
      .order("competition_number", { ascending: true });
    setCompetitions((data || []) as Competition[]);
    if (data && data.length > 0 && !selectedCompetition) {
      setSelectedCompetition(data[0].id);
    }
    setLoading(false);
  };

  const fetchWhitelist = async () => {
    if (!selectedCompetition) return;
    const { data } = await supabase
      .from("arena_whitelist")
      .select("*")
      .eq("competition_id", selectedCompetition)
      .order("added_at", { ascending: false });
    setWhitelist((data || []) as WhitelistEntry[]);
  };

  const fetchRegistrations = async () => {
    if (!selectedCompetition) return;
    const { data } = await supabase
      .from("arena_registrations")
      .select("*")
      .eq("competition_id", selectedCompetition)
      .order("registered_at", { ascending: false });
    setRegistrations((data || []) as Registration[]);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("arena_admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLogs((data || []) as AdminLog[]);
  };

  const fetchNotificationSignups = async () => {
    const { data } = await supabase
      .from("arena_notification_signups")
      .select("*")
      .order("created_at", { ascending: false });
    setNotificationSignups((data || []) as NotificationSignup[]);
  };

  const addToWhitelist = async () => {
    if (!newAddress || !selectedCompetition) return;
    
    if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid wallet address format");
      return;
    }

    setAddingAddress(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("arena_whitelist").insert({
        competition_id: selectedCompetition,
        wallet_address: newAddress.toLowerCase(),
        added_by: user?.id || null,
      });

      if (error) throw error;

      await supabase.from("arena_admin_logs").insert({
        admin_user_id: user?.id,
        action: "ADD_WHITELIST",
        target_type: "arena_whitelist",
        details: { wallet_address: newAddress.toLowerCase(), competition_id: selectedCompetition },
      });

      toast.success("Address added to whitelist");
      setNewAddress("");
      fetchWhitelist();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Address already whitelisted");
      } else {
        toast.error("Failed to add address");
      }
    } finally {
      setAddingAddress(false);
    }
  };

  const removeFromWhitelist = async (id: string, address: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("arena_whitelist").delete().eq("id", id);
      if (error) throw error;

      await supabase.from("arena_admin_logs").insert({
        admin_user_id: user?.id,
        action: "REMOVE_WHITELIST",
        target_type: "arena_whitelist",
        details: { wallet_address: address, competition_id: selectedCompetition },
      });

      toast.success("Address removed");
      setWhitelist(whitelist.filter(w => w.id !== id));
    } catch (error) {
      toast.error("Failed to remove address");
    }
    setDeleteConfirm(null);
  };

  const updateCompetitionStatus = async (compId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("arena_competitions")
        .update({ status: newStatus as any })
        .eq("id", compId);

      if (error) throw error;

      await supabase.from("arena_admin_logs").insert({
        admin_user_id: user?.id,
        action: "UPDATE_COMPETITION_STATUS",
        target_type: "arena_competitions",
        target_id: compId,
        details: { new_status: newStatus },
      });

      toast.success(`Competition status updated to ${newStatus}`);
      fetchCompetitions();
    } catch (error) {
      toast.error("Failed to update competition");
    }
  };

  const exportSignupsToCSV = () => {
    setExportingCSV(true);
    try {
      const headers = ["Email", "Wallet Address", "Signed Up", "Notified", "Unsubscribed"];
      const rows = notificationSignups.map(signup => [
        signup.email,
        signup.wallet_address || "",
        new Date(signup.created_at).toISOString(),
        signup.notified_at ? new Date(signup.notified_at).toISOString() : "",
        signup.unsubscribed_at ? new Date(signup.unsubscribed_at).toISOString() : ""
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `arena-notification-signups-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setExportingCSV(false);
    }
  };

  const sendBulkNotification = async () => {
    if (!bulkSubject.trim()) {
      toast.error("Subject is required");
      return;
    }

    const activeCount = notificationSignups.filter(s => !s.unsubscribed_at).length;
    if (activeCount === 0) {
      toast.error("No active subscribers");
      return;
    }

    setSendingBulk(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-arena-bulk-notification", {
        body: {
          subject: bulkSubject,
          notificationType: bulkType,
          customMessage: bulkType === "custom" ? bulkCustomMessage : undefined,
        },
      });

      if (error) throw error;

      toast.success(`Sent to ${data.sent} subscribers${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
      setShowBulkModal(false);
      fetchNotificationSignups();
    } catch (error: any) {
      toast.error(error.message || "Failed to send notifications");
    } finally {
      setSendingBulk(false);
    }
  };

  const maskAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const selectedComp = competitions.find(c => c.id === selectedCompetition);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Competition Selector */}
      <Card className="p-4 border border-border">
        <div className="flex items-center gap-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Competition</label>
          <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.is_finale ? "Grand Finale" : `Competition ${comp.competition_number}`}
                  {" — "}
                  <span className="text-muted-foreground">{comp.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedComp && (
            <Badge variant="outline" className={`text-[9px] uppercase ${
              selectedComp.status === "LIVE" ? "text-warning border-warning/30" :
              selectedComp.status === "REGISTERING" ? "text-green-400 border-green-400/30" :
              "text-muted-foreground border-border"
            }`}>
              {selectedComp.status}
            </Badge>
          )}
        </div>
      </Card>

      <Tabs defaultValue="whitelist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whitelist" className="gap-2">
            <Users className="w-4 h-4" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-2">
            <Shield className="w-4 h-4" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="control" className="gap-2">
            <Settings className="w-4 h-4" />
            Control
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Signups
          </TabsTrigger>
        </TabsList>

        {/* Whitelist Tab */}
        <TabsContent value="whitelist">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">Arena Whitelist</h2>
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="font-mono"
              />
              <Button onClick={addToWhitelist} disabled={addingAddress || !newAddress}>
                {addingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Address</TableHead>
                  <TableHead className="text-[10px] uppercase">Added</TableHead>
                  <TableHead className="text-[10px] uppercase w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No addresses whitelisted
                    </TableCell>
                  </TableRow>
                ) : (
                  whitelist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell><code className="text-xs">{entry.wallet_address}</code></TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.added_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(entry.id)} className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">Registered Competitors</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase">Arena Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase">Deposit</TableHead>
                  <TableHead className="text-[10px] uppercase">Admission</TableHead>
                  <TableHead className="text-[10px] uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell><code className="text-xs">{maskAddress(reg.wallet_address)}</code></TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {reg.arena_wallet_address ? maskAddress(reg.arena_wallet_address) : "—"}
                        </code>
                      </TableCell>
                      <TableCell className="font-mono text-sm">${reg.deposit_amount.toFixed(2)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] uppercase">{reg.admission_type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] uppercase ${
                          reg.status === "ACTIVE" ? "text-warning border-warning/30" :
                          reg.status === "QUALIFIED" ? "text-green-400 border-green-400/30" :
                          reg.status === "ELIMINATED" ? "text-destructive border-destructive/30" :
                          "text-muted-foreground border-border"
                        }`}>
                          {reg.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Control Tab */}
        <TabsContent value="control">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">Competition Control</h2>
            {selectedComp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Current Status</p>
                    <p className="text-lg font-semibold">{selectedComp.status}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Whitelist Only</p>
                    <p className="text-lg font-semibold">{selectedComp.is_whitelist_only ? "Yes" : "No"}</p>
                  </div>
                </div>
                <div className="p-4 border border-warning/30 rounded bg-warning/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-xs font-medium text-warning uppercase">Status Control</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => updateCompetitionStatus(selectedCompetition, "UPCOMING")} disabled={selectedComp.status === "UPCOMING"}>
                      <Lock className="w-3 h-3 mr-1" />Set Upcoming
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateCompetitionStatus(selectedCompetition, "REGISTERING")} disabled={selectedComp.status === "REGISTERING"}>
                      <Unlock className="w-3 h-3 mr-1" />Open Registration
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateCompetitionStatus(selectedCompetition, "LIVE")} disabled={selectedComp.status === "LIVE"}>
                      Go Live
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateCompetitionStatus(selectedCompetition, "FINALIZED")} disabled={selectedComp.status === "FINALIZED"}>
                      Finalize
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="logs">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">Admin Audit Log</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Time</TableHead>
                  <TableHead className="text-[10px] uppercase">Action</TableHead>
                  <TableHead className="text-[10px] uppercase">Target</TableHead>
                  <TableHead className="text-[10px] uppercase">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No actions logged
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] uppercase">{log.action}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.target_type}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{JSON.stringify(log.details)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Notification Signups Tab */}
        <TabsContent value="notifications">
          <Card className="p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide">Arena Notification Signups</h2>
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={() => setShowBulkModal(true)} disabled={notificationSignups.filter(s => !s.unsubscribed_at).length === 0}>
                  <Mail className="w-4 h-4 mr-2" />Send Bulk
                </Button>
                <Button variant="outline" size="sm" onClick={exportSignupsToCSV} disabled={exportingCSV}>
                  {exportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Export
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{notificationSignups.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{notificationSignups.filter(s => s.wallet_address).length}</p>
                <p className="text-xs text-muted-foreground">With Wallet</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold">{notificationSignups.filter(s => !s.unsubscribed_at).length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase">Email</TableHead>
                  <TableHead className="text-[10px] uppercase">Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase">Signed Up</TableHead>
                  <TableHead className="text-[10px] uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationSignups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No signups yet
                    </TableCell>
                  </TableRow>
                ) : (
                  notificationSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="text-xs">{signup.email}</TableCell>
                      <TableCell>
                        {signup.wallet_address ? (
                          <code className="text-xs text-muted-foreground">{maskAddress(signup.wallet_address)}</code>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(signup.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] uppercase ${signup.unsubscribed_at ? "text-destructive border-destructive/30" : "text-green-400 border-green-400/30"}`}>
                          {signup.unsubscribed_at ? "Unsubscribed" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Whitelist</AlertDialogTitle>
            <AlertDialogDescription>This action will be logged.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const entry = whitelist.find(w => w.id === deleteConfirm);
              if (entry) removeFromWhitelist(entry.id, entry.wallet_address);
            }} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Notification Modal */}
      <AlertDialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />Send Bulk Notification
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send to {notificationSignups.filter(s => !s.unsubscribed_at).length} active subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase">Type</label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as typeof bulkType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration_open">🎉 Registration Open</SelectItem>
                  <SelectItem value="reminder">⏰ Reminder</SelectItem>
                  <SelectItem value="custom">✏️ Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase">Subject</label>
              <Input value={bulkSubject} onChange={(e) => setBulkSubject(e.target.value)} />
            </div>
            {bulkType === "custom" && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase">Message</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={bulkCustomMessage}
                  onChange={(e) => setBulkCustomMessage(e.target.value)}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingBulk}>Cancel</AlertDialogCancel>
            <Button onClick={sendBulkNotification} disabled={sendingBulk || !bulkSubject.trim()}>
              {sendingBulk ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
              Send
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
