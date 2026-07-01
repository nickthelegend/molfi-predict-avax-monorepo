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
  buildMintIntentMessage,
  buildRedeemIntentMessage,
  buildSettleIntentMessage,
  buildRecoverManagerIntentMessage,
  tradeIntentExpiryMs,
  type MintIntentFields,
  type RedeemIntentFields,
  type SettleIntentFields,
  type RecoverManagerIntentFields,
} from "@/lib/leverx/trade-intent-message";

export type SignedTradeIntent = {
  address: string;
  expires_at_ms: number;
  message_bytes: string;
  signature: string;
};

function walletChain() {
  return appConfig.suiNetwork === "testnet" ? SUI_TESTNET_CHAIN : SUI_MAINNET_CHAIN;
}

async function signIntentMessage(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  message: Uint8Array;
  address: string;
  expiresAtMs: number;
}): Promise<SignedTradeIntent> {
  const address = params.address.trim().toLowerCase();
  const feature = params.wallet.features[SuiSignPersonalMessage];
  if (!feature?.signPersonalMessage) {
    throw new Error("wallet_does_not_support_personal_message");
  }

  const { signature } = await feature.signPersonalMessage({
    message: params.message,
    account: params.account,
    chain: walletChain(),
  });

  return {
    address,
    expires_at_ms: params.expiresAtMs,
    message_bytes: toBase64(params.message),
    signature,
  };
}

export async function signMintTradeIntent(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<MintIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<SignedTradeIntent> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildMintIntentMessage({ ...params.intent, expiresAtMs });
  return signIntentMessage({
    wallet: params.wallet,
    account: params.account,
    message,
    address,
    expiresAtMs,
  });
}

export async function signRedeemTradeIntent(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<RedeemIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<SignedTradeIntent> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildRedeemIntentMessage({ ...params.intent, expiresAtMs });
  return signIntentMessage({
    wallet: params.wallet,
    account: params.account,
    message,
    address,
    expiresAtMs,
  });
}

export async function signSettleTradeIntent(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<SettleIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<SignedTradeIntent> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildSettleIntentMessage({ ...params.intent, expiresAtMs });
  return signIntentMessage({
    wallet: params.wallet,
    account: params.account,
    message,
    address,
    expiresAtMs,
  });
}

export async function signRecoverManagerTradeIntent(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<RecoverManagerIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<SignedTradeIntent> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildRecoverManagerIntentMessage({ ...params.intent, expiresAtMs });
  return signIntentMessage({
    wallet: params.wallet,
    account: params.account,
    message,
    address,
    expiresAtMs,
  });
}
