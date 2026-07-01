import { useState, useEffect } from "react";
import { fetchVaultStats, fetchUserCommitments, commitSoftStaking, withdrawCommitment, fetchUserRewards } from "@/services/vault-api";
import { useWallet } from "./useWallet";
import { toast } from "sonner";
import { signSoftStakingCommitment, type SoftStakingCommitment } from "@/lib/soft-staking-signature";

export interface UseVaultResult {
  vaultStats: any[];
  commitments: any[];
  userRewards: number;
  isLoading: boolean;
  isCommitting: boolean;
  createCommitment: (token: 'USDC' | 'USDT' | 'BNB', amount: string) => Promise<boolean>;
  withdraw: (commitmentId: string) => Promise<boolean>;
  refreshStats: () => Promise<void>;
  refreshRewards: () => Promise<void>;
}

export function useVault(): UseVaultResult {
  const { address, getSigner } = useWallet();
  const [vaultStats, setVaultStats] = useState<any[]>([]);
  const [commitments, setCommitments] = useState<any[]>([]);
  const [userRewards, setUserRewards] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  useEffect(() => {
    loadVaultStats();
  }, []);

  useEffect(() => {
    if (address) {
      loadUserCommitments();
      loadUserRewards();
    }
  }, [address]);

  const loadVaultStats = async () => {
    try {
      setIsLoading(true);
      const stats = await fetchVaultStats();
      setVaultStats(stats);
    } catch (error) {
      console.error("Failed to load vault stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserCommitments = async () => {
    if (!address) return;
    
    try {
      const data = await fetchUserCommitments(address);
      setCommitments(data);
    } catch (error) {
      console.error("Failed to load commitments:", error);
    }
  };

  const loadUserRewards = async () => {
    if (!address) return;
    
    try {
      const { totalRewards } = await fetchUserRewards(address);
      setUserRewards(totalRewards);
    } catch (error) {
      console.error("Failed to load rewards:", error);
    }
  };

  const createCommitment = async (token: 'USDC' | 'USDT' | 'BNB', amount: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      setIsCommitting(true);
      
      // Get signer from wallet
      const signer = await getSigner();
      if (!signer) {
        toast.error("Unable to access wallet signer");
        return false;
      }

      // Create commitment message
      const nonce = Date.now().toString();
      const commitment: SoftStakingCommitment = {
        userAddress: address,
        token,
        amount,
        nonce,
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Sign the commitment
      toast.info("Please sign the commitment message...");
      const signature = await signSoftStakingCommitment(commitment, signer);
      
      // Submit to backend with timestamp for verification
      await commitSoftStaking({
        userAddress: address,
        token,
        amount,
        signature,
        nonce,
        timestamp: commitment.timestamp,
      });
      
      toast.success(`${token} soft staking commitment created!`);
      await loadUserCommitments();
      return true;
    } catch (error: any) {
      console.error("Failed to create commitment:", error);
      toast.error(error.message || "Failed to create commitment");
      return false;
    } finally {
      setIsCommitting(false);
    }
  };

  const withdraw = async (commitmentId: string) => {
    try {
      await withdrawCommitment(commitmentId);
      toast.success("Commitment withdrawn");
      await loadUserCommitments();
      return true;
    } catch (error: any) {
      console.error("Failed to withdraw:", error);
      toast.error(error.message || "Failed to withdraw commitment");
      return false;
    }
  };

  return {
    vaultStats,
    commitments,
    userRewards,
    isLoading,
    isCommitting,
    createCommitment,
    withdraw,
    refreshStats: loadVaultStats,
    refreshRewards: loadUserRewards,
  };
}
