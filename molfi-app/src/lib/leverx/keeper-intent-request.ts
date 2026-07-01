import { toBase64 } from "@mysten/sui/utils";
import {
  buildManagerCreateMessage,
  managerIntentExpiryMs,
} from "@/lib/leverx/manager-intent-message";
import { getKeeperAuthToken } from "@/lib/leverx/keeper-auth-store";
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
import {
  signMintTradeIntent,
  signRedeemTradeIntent,
  signSettleTradeIntent,
  signRecoverManagerTradeIntent,
  type SignedTradeIntent,
} from "@/lib/leverx/trade-intent-auth";
import {
  signManagerCreateIntent,
  type SignedManagerCreateIntent,
} from "@/lib/leverx/manager-intent-auth";
import type { WalletWithRequiredFeatures } from "@mysten/wallet-standard";
import type { WalletAccount } from "@wallet-standard/core";

/** Keeper request body: signed intent, or unsigned intent when a session token is available. */
export type KeeperIntentRequest = {
  address: string;
  expires_at_ms: number;
  message_bytes: string;
  signature?: string;
  token?: string;
};

export type KeeperManagerCreateRequest = KeeperIntentRequest;

function buildUnsignedIntentRequest(params: {
  address: string;
  message: Uint8Array;
  expiresAtMs: number;
  token: string;
}): KeeperIntentRequest {
  return {
    address: params.address.trim().toLowerCase(),
    expires_at_ms: params.expiresAtMs,
    message_bytes: toBase64(params.message),
    token: params.token,
  };
}

export async function prepareMintTradeRequest(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<MintIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<KeeperIntentRequest> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildMintIntentMessage({ ...params.intent, expiresAtMs });
  const token = getKeeperAuthToken(address);
  if (token) {
    return buildUnsignedIntentRequest({ address, message, expiresAtMs, token });
  }
  return signMintTradeIntent({ ...params, expiresAtMs });
}

export async function prepareRedeemTradeRequest(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<RedeemIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<KeeperIntentRequest> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildRedeemIntentMessage({ ...params.intent, expiresAtMs });
  const token = getKeeperAuthToken(address);
  if (token) {
    return buildUnsignedIntentRequest({ address, message, expiresAtMs, token });
  }
  return signRedeemTradeIntent({ ...params, expiresAtMs });
}

export async function prepareSettleTradeRequest(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<SettleIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<KeeperIntentRequest> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildSettleIntentMessage({ ...params.intent, expiresAtMs });
  const token = getKeeperAuthToken(address);
  if (token) {
    return buildUnsignedIntentRequest({ address, message, expiresAtMs, token });
  }
  return signSettleTradeIntent({ ...params, expiresAtMs });
}

export async function prepareRecoverManagerTradeRequest(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  intent: Omit<RecoverManagerIntentFields, "expiresAtMs">;
  expiresAtMs?: number;
}): Promise<KeeperIntentRequest> {
  const address = params.intent.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? tradeIntentExpiryMs();
  const message = buildRecoverManagerIntentMessage({ ...params.intent, expiresAtMs });
  const token = getKeeperAuthToken(address);
  if (token) {
    return buildUnsignedIntentRequest({ address, message, expiresAtMs, token });
  }
  return signRecoverManagerTradeIntent({ ...params, expiresAtMs });
}

export async function prepareManagerCreateRequest(params: {
  wallet: WalletWithRequiredFeatures;
  account: WalletAccount;
  address: string;
  expiresAtMs?: number;
}): Promise<KeeperManagerCreateRequest> {
  const address = params.address.trim().toLowerCase();
  const expiresAtMs = params.expiresAtMs ?? managerIntentExpiryMs();
  const message = buildManagerCreateMessage({ address, expiresAtMs });
  const token = getKeeperAuthToken(address);
  if (token) {
    return buildUnsignedIntentRequest({ address, message, expiresAtMs, token });
  }
  return signManagerCreateIntent({ ...params, expiresAtMs });
}

export function isSignedTradeIntent(
  request: KeeperIntentRequest,
): request is SignedTradeIntent {
  return Boolean(request.signature?.trim());
}

export function isSignedManagerCreateIntent(
  request: KeeperManagerCreateRequest,
): request is SignedManagerCreateIntent {
  return Boolean(request.signature?.trim());
}
