import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/db";
import { toast } from "@/hooks/use-toast";

interface NotifySignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotifySignupModal({ open, onOpenChange }: NotifySignupModalProps) {
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedWallet = walletAddress.trim() || null;

      // Insert into database
      const { error } = await supabase
        .from("arena_notification_signups")
        .insert({
          email: normalizedEmail,
          wallet_address: normalizedWallet,
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - already signed up
          toast({
            title: "Already signed up!",
            description: "This email is already registered for notifications.",
          });
          setIsSuccess(true);
          return;
        } else {
          throw error;
        }
      }

      // Send confirmation email via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke("send-arena-notification", {
          body: { email: normalizedEmail, walletAddress: normalizedWallet },
        });

        if (emailError) {
          console.error("Email sending failed:", emailError);
          // Don't fail the signup if email fails - they're still registered
        }
      } catch (emailErr) {
        console.error("Email service error:", emailErr);
      }

      setIsSuccess(true);
      toast({
        title: "You're on the list!",
        description: "Check your inbox for a confirmation email.",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after close animation
    setTimeout(() => {
      setEmail("");
      setWalletAddress("");
      setIsSuccess(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Get Notified
          </DialogTitle>
          <DialogDescription>
            Be the first to know when Season 0 registration opens.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">You're all set!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              We'll send you an email when registration opens for Season 0.
            </p>
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet" className="flex items-center gap-2">
                Wallet Address 
                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="wallet"
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Add your wallet address to get priority notifications.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Notify Me
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
