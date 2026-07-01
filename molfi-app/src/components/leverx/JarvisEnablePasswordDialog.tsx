import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { ResponsiveModal } from "@/components/leverx/ResponsiveModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isJarvisEnablePasswordValid } from "@/lib/leverx/jarvis-access";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  busy?: boolean;
  onConfirm: () => void;
};

export function JarvisEnablePasswordDialog({
  open,
  onOpenChange,
  busy = false,
  onConfirm,
}: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isJarvisEnablePasswordValid(password)) {
      setError("Incorrect password.");
      return;
    }
    setError(null);
    onConfirm();
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Enable Jarvis"
      description="Jarvis uses real Anthropic API tokens. Enter the testing password to turn it on."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Jarvis costs real API tokens. DM admin on Telegram{" "}
          <a
            href="https://t.me/arogundadeibrahim"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            @arogundadeibrahim
          </a>{" "}
          for the password for testing purposes.
        </p>

        <div className="space-y-2">
          <label htmlFor="jarvis-enable-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="jarvis-enable-password"
            type="password"
            autoComplete="off"
            placeholder="Enter password"
            value={password}
            disabled={busy}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !password.trim()}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Enabling…
              </>
            ) : (
              "Enable Jarvis"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
