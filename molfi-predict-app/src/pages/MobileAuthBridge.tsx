import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";

export default function MobileAuthBridge() {
  const { address, connect } = useWallet();
  const [params] = useSearchParams();

  const callbackUrl = useMemo(() => {
    const raw = params.get("callbackUrl") ?? "";
    if (!raw) return "";

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "molfi:") return "";
      return parsed.toString();
    } catch {
      return "";
    }
  }, [params]);

  useEffect(() => {
    if (!callbackUrl) return;

    if (!address) {
      connect();
      return;
    }

    const url = new URL(callbackUrl);
    url.searchParams.set("address", address);
    url.searchParams.set("provider", "stellar");
    window.location.replace(url.toString());
  }, [callbackUrl, address, connect]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-bold">Mobile Wallet Sign-in</h1>
        {!callbackUrl ? (
          <p className="text-muted-foreground">Missing or invalid callback URL.</p>
        ) : address ? (
          <p className="text-muted-foreground">Completing sign-in and returning to app...</p>
        ) : (
          <p className="text-muted-foreground">Please connect your wallet to continue.</p>
        )}
      </div>
    </main>
  );
}
