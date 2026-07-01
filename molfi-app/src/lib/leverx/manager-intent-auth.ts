import {
  SUI_MAINNET_CHAIN,
  SUI_TESTNET_CHAIN,
  SuiSignPersonalMessage,
  type WalletWithRequiredFeatures,
} from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";
import { toBase64 } from "@mysten/sui/utils";
import { appConfig } from "@/lib/config";
import {
  buildManagerCreateMessage,
  managerIntentExpiryMs,
} from "@/lib/leverx/manager-intent-message";

export type SignedManagerCreateIntent = {
  address: string;
  expires_at_ms: number;
  message_bytes: string;
  signature: string;
};

function walletChain() {
  return appConfig.suiNetwork === "testnet" ? SUI_TESTNET_CHAIN : SUI_MAINNET_CHAIN;
}

export async function signManagerCreateIntent(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  address: string;
  expiresAtMs?: number;
}): Promise<SignedManagerCreateIntent> {
  const address = params.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? managerIntentExpiryMs();
  const message = buildManagerCreateMessage({ address, expiresAtMs });

  const feature = params.wallet.features[SuiSignPersonalMessage];
  if (!feature?.signPersonalMessage) {
    throw new Error("wallet_does_not_support_personal_message");
  }

  const { signature } = await feature.signPersonalMessage({
    message,
    account: params.account,
    chain: walletChain(),
  });

  return {
    address,
    expires_at_ms: expiresAtMs,
    message_bytes: toBase64(message),
    signature,
  };
}
