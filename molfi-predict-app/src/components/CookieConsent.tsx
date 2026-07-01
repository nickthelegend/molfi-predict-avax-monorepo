import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShow(true);
    } else {
      const saved = localStorage.getItem("cookie-preferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = { necessary: true, analytics: true, marketing: true };
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-preferences", JSON.stringify(allAccepted));
    setPreferences(allAccepted);
    setShow(false);
  };

  const declineAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false };
    localStorage.setItem("cookie-consent", "declined");
    localStorage.setItem("cookie-preferences", JSON.stringify(onlyNecessary));
    setPreferences(onlyNecessary);
    setShow(false);
  };

  const savePreferences = () => {
    localStorage.setItem("cookie-consent", "custom");
    localStorage.setItem("cookie-preferences", JSON.stringify(preferences));
    setShowPreferences(false);
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl"
          >
            <div className="container mx-auto">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold mb-1 text-foreground">Cookie Preferences</p>
                    <p className="text-muted-foreground">
                      We use cookies to enhance your experience, analyze site traffic, and personalize content.{" "}
                      <Link to="/privacy-policy" className="text-primary hover:underline inline-flex items-center gap-1">
                        Learn more
                      </Link>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Button 
                    onClick={() => setShowPreferences(true)} 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Button>
                  <Button onClick={declineAll} variant="outline" size="sm">
                    Decline
                  </Button>
                  <Button onClick={acceptAll} size="sm" className="bg-primary hover:bg-primary/90">
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="w-5 h-5 text-primary" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Manage your cookie preferences. You can enable or disable different types of cookies below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="necessary" className="font-semibold">
                  Necessary Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Essential for the website to function properly. Cannot be disabled.
                </p>
              </div>
              <Switch
                id="necessary"
                checked={preferences.necessary}
                disabled
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="analytics" className="font-semibold">
                  Analytics Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us understand how visitors interact with our website.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
            
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor="marketing" className="font-semibold">
                  Marketing Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to deliver personalized advertisements and track campaign performance.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Cancel
            </Button>
            <Button onClick={savePreferences}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
