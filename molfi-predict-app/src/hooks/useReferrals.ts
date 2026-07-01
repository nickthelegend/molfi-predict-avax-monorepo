import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/db";
import { useWallet } from "./useWallet";
import { toast } from "sonner";

export function useReferrals() {
  const { address } = useWallet();
  const [referralCode, setReferralCode] = useState<string>("");
  const [referralCount, setReferralCount] = useState(0);
  const [referralRewards, setReferralRewards] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address) {
      loadReferralData();
    }
  }, [address]);

  const generateReferralCode = (address: string): string => {
    // Generate a unique 8-character code from address
    return address.slice(2, 10).toUpperCase();
  };

  const loadReferralData = async () => {
    if (!address) return;

    try {
      setIsLoading(true);

      // Check if user has a referral code
      let { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('referral_code')
        .eq('user_address', address)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        throw codeError;
      }

      if (!codeData) {
        // Create a referral code
        const code = generateReferralCode(address);
        const { error: insertError } = await supabase
          .from('referral_codes')
          .insert({ user_address: address, referral_code: code });

        if (insertError) throw insertError;
        setReferralCode(code);
      } else {
        setReferralCode(codeData.referral_code);
      }

      // Get referral count
      const { data: referrals, error: refError } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_address', address)
        .eq('status', 'completed');

      if (refError) throw refError;
      setReferralCount(referrals?.length || 0);

      // Get referral rewards
      const { data: rewards, error: rewardError } = await supabase
        .from('rewards')
        .select('amount')
        .eq('user_address', address)
        .eq('reward_type', 'referral');

      if (rewardError) throw rewardError;
      const total = rewards?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      setReferralRewards(total);

    } catch (error) {
      console.error("Failed to load referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyReferralCode = async (code: string) => {
    if (!address) {
      toast.error("Please connect your wallet");
      return false;
    }

    try {
      // Check if code exists
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('user_address')
        .eq('referral_code', code)
        .single();

      if (codeError || !codeData) {
        toast.error("Invalid referral code");
        return false;
      }

      if (codeData.user_address === address) {
        toast.error("You cannot use your own referral code");
        return false;
      }

      // Check if user already used a referral code
      const { data: existing } = await supabase
        .from('referrals')
        .select('*')
        .eq('referee_address', address)
        .single();

      if (existing) {
        toast.error("You have already used a referral code");
        return false;
      }

      // Create referral
      const { error: refError } = await supabase
        .from('referrals')
        .insert({
          referrer_address: codeData.user_address,
          referee_address: address,
          referral_code: code,
          status: 'pending'
        });

      if (refError) throw refError;

      toast.success("Referral code applied! You'll receive bonus rewards when you commit.");
      return true;
    } catch (error) {
      console.error("Failed to apply referral code:", error);
      toast.error("Failed to apply referral code");
      return false;
    }
  };

  const getReferralLink = () => {
    if (!referralCode) return "";
    // Use molfi.com domain for referral links
    return `https://molfi.com/vaults?ref=${referralCode}`;
  };

  const copyReferralLink = async () => {
    const link = getReferralLink();
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied!");
      
      // Award share reward
      if (address) {
        await supabase.from('rewards').insert({
          user_address: address,
          reward_type: 'share',
          amount: 10,
          description: 'Shared referral link'
        });
      }
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  return {
    referralCode,
    referralCount,
    referralRewards,
    referralLink: getReferralLink(),
    isLoading,
    applyReferralCode,
    copyReferralLink,
    refreshData: loadReferralData
  };
}
