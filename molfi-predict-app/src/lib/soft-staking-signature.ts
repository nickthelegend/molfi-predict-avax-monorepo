import { ethers } from "ethers";

export interface SoftStakingCommitment {
  userAddress: string;
  token: string;
  amount: string;
  nonce: string;
  timestamp: number;
}

const SOFT_STAKING_DOMAIN = {
  name: "Molfi Soft Staking",
  version: "1",
  chainId: 56, // BSC Mainnet
  verifyingContract: "0x0000000000000000000000000000000000000000" // Placeholder
};

const SOFT_STAKING_TYPES = {
  SoftStakingCommitment: [
    { name: "userAddress", type: "address" },
    { name: "token", type: "string" },
    { name: "amount", type: "string" },
    { name: "nonce", type: "string" },
    { name: "timestamp", type: "uint256" },
  ],
};

// Human-readable description for the signature
export const SOFT_STAKING_MESSAGE = {
  title: "Soft Staking Commitment",
  description: "You are signing a commitment to soft stake tokens with Molfi. Your funds will remain in your wallet, and your balance will be monitored to ensure you maintain the committed amount.",
  warnings: [
    "Keep the committed amount in your wallet",
    "Balance is checked every 4 hours",
    "Rewards distributed after TGE"
  ]
};

/**
 * Sign a soft staking commitment using EIP-712
 */
export async function signSoftStakingCommitment(
  commitment: SoftStakingCommitment,
  signer: ethers.Signer
): Promise<string> {
  try {
    const domain = SOFT_STAKING_DOMAIN;
    const types = SOFT_STAKING_TYPES;
    const value = commitment;

    // Sign the typed data
    const signature = await signer.signTypedData(domain, types, value);
    
    // Security: Do not log sensitive commitment data or signatures
    return signature;
  } catch (error) {
    // Security: Log error type only, not sensitive data
    console.error("Error signing soft staking commitment");
    throw error;
  }
}

/**
 * Verify a soft staking commitment signature
 */
export function verifySoftStakingSignature(
  commitment: SoftStakingCommitment,
  signature: string
): { isValid: boolean; recoveredAddress?: string } {
  try {
    const digest = ethers.TypedDataEncoder.hash(
      SOFT_STAKING_DOMAIN,
      SOFT_STAKING_TYPES,
      commitment
    );

    const recoveredAddress = ethers.recoverAddress(digest, signature);
    const isValid = recoveredAddress.toLowerCase() === commitment.userAddress.toLowerCase();

    return { isValid, recoveredAddress };
  } catch (error) {
    // Security: Log error type only, not sensitive data
    console.error("Error verifying soft staking signature");
    return { isValid: false };
  }
}
