import { useEffect } from "react";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { appConfig } from "@/lib/config";
import { suiClient } from "@/lib/sui/client";

/** Registers the Enoki Google zkLogin wallet into Wallet Standard. */
export function EnokiWalletsRegistrar() {
  useEffect(() => {
    const apiKey = appConfig.enokiApiKey;
    const googleClientId = appConfig.enokiGoogleClientId;
    if (!apiKey || !googleClientId) return;

    const network = appConfig.suiNetwork;
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey,
      providers: {
        google: {
          clientId: googleClientId,
          redirectUrl: window.location.origin,
        },
      },
      client: suiClient,
      network,
    });

    return unregister;
  }, []);

  return null;
}
