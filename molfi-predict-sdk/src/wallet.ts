/**
 * Wallet generation + funding. An agent calls `generateWallet()` to mint a
 * fresh Stellar keypair, then `fundWithFriendbot()` to get testnet XLM for fees.
 */
import { Keypair } from "@stellar/stellar-sdk";
import { TESTNET, type MolfiConfig } from "./config.js";

export interface MolfiWallet {
  publicKey: string;
  /** S... secret seed. Keep private; this is the signing key. */
  secret: string;
}

/** Create a brand-new Stellar keypair (an ed25519 key). */
export function generateWallet(): MolfiWallet {
  const kp = Keypair.random();
  return { publicKey: kp.publicKey(), secret: kp.secret() };
}

/** Restore a wallet object from a secret seed. */
export function walletFromSecret(secret: string): MolfiWallet {
  const kp = Keypair.fromSecret(secret);
  return { publicKey: kp.publicKey(), secret };
}

/** Fund a testnet account with XLM via Friendbot. Idempotent-ish (errors if
 * already funded are swallowed). Returns true if the account is funded. */
export async function fundWithFriendbot(
  publicKey: string,
  config: MolfiConfig = TESTNET,
): Promise<boolean> {
  const res = await fetch(`${config.friendbotUrl}/?addr=${encodeURIComponent(publicKey)}`);
  if (res.ok) return true;
  // 400 usually means "account already funded" — treat as success.
  const body = await res.text().catch(() => "");
  if (res.status === 400 && /already funded|op_already_exists|exists/i.test(body)) return true;
  return false;
}
