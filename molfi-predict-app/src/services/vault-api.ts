import { supabase } from "@/integrations/supabase/db";

/**
 * Fetch vault statistics
 */
export async function fetchVaultStats() {
  try {
    const { data, error } = await supabase
      .from('vault_stats')
      .select('*')
      .order('token', { ascending: true });

    if (error) {
      console.error('Error fetching vault stats:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchVaultStats:', error);
    throw error;
  }
}

/**
 * Create or update soft staking commitment with signature verification
 */
export async function commitSoftStaking(params: {
  userAddress: string;
  token: 'USDC' | 'USDT' | 'BNB';
  amount: string; // In wei
  signature: string;
  nonce: string;
  timestamp: number;
}) {
  try {
    // First, verify the signature
    const verificationResponse = await supabase.functions.invoke('verify-signature', {
      body: {
        commitment: {
          userAddress: params.userAddress,
          token: params.token,
          amount: params.amount,
          nonce: params.nonce,
          timestamp: params.timestamp,
        },
        signature: params.signature,
      },
    });

    if (verificationResponse.error) {
      console.error('Signature verification failed:', verificationResponse.error);
      throw new Error('Signature verification failed');
    }

    const verificationData = verificationResponse.data;
    if (!verificationData?.valid) {
      console.error('Invalid signature:', verificationData?.error);
      throw new Error(verificationData?.error || 'Invalid signature');
    }

    console.log('Signature verified successfully:', verificationData);

    // If signature is valid, proceed with commitment
    const { data, error } = await supabase
      .from('soft_staking')
      .upsert({
        user_address: params.userAddress.toLowerCase(),
        token: params.token,
        committed_amount: params.amount,
        signature: params.signature,
        nonce: params.nonce,
        status: 'active',
      }, {
        onConflict: 'user_address,token,status'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating soft staking commitment:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error('Error in commitSoftStaking:', error);
    throw error;
  }
}

/**
 * Fetch user's soft staking commitments
 */
export async function fetchUserCommitments(userAddress: string) {
  try {
    const { data, error } = await supabase
      .from('soft_staking')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching commitments:', error);
      throw new Error(error.message);
    }

    return data || [];
  } catch (error: any) {
    console.error('Error in fetchUserCommitments:', error);
    throw error;
  }
}

/**
 * Withdraw soft staking commitment
 */
export async function withdrawCommitment(commitmentId: string) {
  try {
    const { error } = await supabase
      .from('soft_staking')
      .update({ status: 'withdrawn' })
      .eq('id', commitmentId);

    if (error) {
      console.error('Error withdrawing commitment:', error);
      throw new Error(error.message);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in withdrawCommitment:', error);
    throw error;
  }
}

/**
 * Fetch user's accumulated rewards
 */
export async function fetchUserRewards(userAddress: string) {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('user_address', userAddress.toLowerCase())
      .eq('reward_type', 'soft_staking');

    if (error) {
      console.error('Error fetching rewards:', error);
      throw new Error(error.message);
    }

    // Sum up all rewards
    const totalRewards = data?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;
    return { totalRewards, rewards: data || [] };
  } catch (error: any) {
    console.error('Error in fetchUserRewards:', error);
    throw error;
  }
}
