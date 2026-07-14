/**
 * Wallet generation on Avalanche Fuji. An agent calls `generateWallet()` to
 * mint a fresh EVM (secp256k1) keypair. Fuji has no friendbot — a freshly
 * generated wallet holds 0 AVAX and 0 mUSDC until it is funded. Gas (AVAX) is
 * funded via `MolfiAgent.onboard({ funderKey })` (see agent.ts); mUSDC comes
 * from the on-chain faucet.
 */
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import type { Hex } from "viem";

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
