/**
 * Wallet generation + funding on Avalanche Fuji. An agent calls
 * `generateWallet()` to mint a fresh EVM (secp256k1) keypair. Fuji has no
 * friendbot — the operator/faucet funds gas + mUSDC (see the demo) — so
 * `fundWithFriendbot` is retained only as a no-op stub for import compatibility.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";
import { TESTNET, type MolfiConfig } from "./config.js";

export interface MolfiWallet {
  /** 0x… EVM address. */
  publicKey: string;
  address: string;
  /** 0x… private key. Keep private; this is the signing key. */
  secret: Hex;
  privateKey: Hex;
}

/** Create a brand-new EVM keypair (a secp256k1 key). */
export function generateWallet(): MolfiWallet {
  const secret = generatePrivateKey();
  const account = privateKeyToAccount(secret);
  return { publicKey: account.address, address: account.address, secret, privateKey: secret };
}

/** Restore a wallet object from a 0x… private key. */
export function walletFromSecret(secret: string): MolfiWallet {
  const key = (secret.startsWith("0x") ? secret : `0x${secret}`) as Hex;
  const account = privateKeyToAccount(key);
  return { publicKey: account.address, address: account.address, secret: key, privateKey: key };
}

/**
 * No-op on Fuji (there is no friendbot; gas comes from an operator faucet).
 * Kept so existing agent onboarding code compiles. Always resolves false.
 */
export async function fundWithFriendbot(
  _publicKey: string,
  _config: MolfiConfig = TESTNET,
): Promise<boolean> {
  return false;
}
