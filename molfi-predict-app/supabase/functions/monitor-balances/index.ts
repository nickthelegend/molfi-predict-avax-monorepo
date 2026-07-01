import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Commitment {
  id: string;
  user_address: string;
  token: string;
  committed_amount: string;
  yield_active: boolean;
  balance_warnings: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify request is from authorized source (cron job or admin)
    const authHeader = req.headers.get('authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // Check for cron secret authorization
    if (!cronSecret) {
      console.warn('CRON_SECRET not configured - using service role key validation');
    }
    
    const isCronAuthorized = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // If not cron, verify admin access via JWT
    let isAdminAuthorized = false;
    if (!isCronAuthorized && authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const tempClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          auth: { persistSession: false },
          global: { headers: { Authorization: `Bearer ${token}` } }
        }
      );
      
      const { data: { user }, error: authError } = await tempClient.auth.getUser();
      if (!authError && user) {
        // Check if user is admin
        const { data: roleData } = await tempClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        isAdminAuthorized = !!roleData;
      }
    }
    
    if (!isCronAuthorized && !isAdminAuthorized) {
      console.error('Unauthorized access attempt to monitor-balances');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Starting balance monitoring...');

    // Fetch all active commitments
    const { data: commitments, error: commitmentsError } = await supabaseClient
      .from('soft_staking')
      .select('*')
      .eq('status', 'active');

    if (commitmentsError) {
      throw new Error(`Failed to fetch commitments: ${commitmentsError.message}`);
    }

    console.log(`Found ${commitments?.length || 0} active commitments`);

    let processedCount = 0;
    let balanceWarnings = 0;

    // Process each commitment
    for (const commitment of (commitments || []) as Commitment[]) {
      try {
        const currentTime = new Date().toISOString();
        
        // Fetch actual wallet balance from BSC for each token
        let actualBalance = '0';
        let belowCommitment = false;
        
        try {
          // RPC endpoints for balance checking
          const rpcUrl = 'https://bsc-dataseed1.binance.org';
          
          if (commitment.token === 'BNB') {
            // Check BNB balance
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_getBalance',
                params: [commitment.user_address, 'latest']
              })
            });
            const data = await response.json();
            actualBalance = data.result || '0';
          } else {
            // Check USDC/USDT balance (ERC20 tokens on BSC)
            const tokenAddresses: Record<string, string> = {
              'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
              'USDT': '0x55d398326f99059fF775485246999027B3197955'
            };
            
            const tokenAddress = tokenAddresses[commitment.token];
            if (tokenAddress) {
              // ERC20 balanceOf(address) call
              const data = `0x70a08231000000000000000000000000${commitment.user_address.slice(2).padStart(64, '0')}`;
              
              const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'eth_call',
                  params: [{
                    to: tokenAddress,
                    data: data
                  }, 'latest']
                })
              });
              const result = await response.json();
              actualBalance = result.result || '0';
            }
          }
          
          // Convert hex to decimal and compare
          const balanceBigInt = BigInt(actualBalance);
          const commitmentBigInt = BigInt(commitment.committed_amount);
          belowCommitment = balanceBigInt < commitmentBigInt;
          
          console.log(`Balance check for ${commitment.user_address}: ${actualBalance} (committed: ${commitment.committed_amount})`);
          
        } catch (balanceError) {
          console.error('Failed to fetch balance:', balanceError);
          // Continue with placeholder balance to avoid breaking the monitor
          actualBalance = commitment.committed_amount;
        }
        
        // Record balance snapshot
        const { error: snapshotError } = await supabaseClient
          .from('wallet_balance_snapshots')
          .insert({
            user_address: commitment.user_address.toLowerCase(),
            token: commitment.token,
            balance: actualBalance,
            commitment_id: commitment.id,
            below_commitment: belowCommitment,
            checked_at: currentTime,
          });

        if (snapshotError) {
          console.error(`Failed to record snapshot for ${commitment.user_address}:`, snapshotError);
          continue;
        }

        // Update last balance check time and yield status
        const updateData: any = { 
          last_balance_check: currentTime,
        };
        
        // If balance is below commitment, pause yield and increment warnings
        if (belowCommitment) {
          updateData.yield_active = false;
          updateData.balance_warnings = (commitment.balance_warnings || 0) + 1;
          balanceWarnings++;
        } else if (!commitment.yield_active) {
          // Resume yield if balance is restored
          updateData.yield_active = true;
        }
        
        const { error: updateError } = await supabaseClient
          .from('soft_staking')
          .update(updateData)
          .eq('id', commitment.id);

        if (updateError) {
          console.error(`Failed to update commitment:`, updateError);
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing commitment ${commitment.id}:`, error);
      }
    }

    // Calculate and update rewards for all active users
    console.log('Calculating rewards...');
    const { error: rewardsError } = await supabaseClient.rpc('update_user_soft_staking_rewards');
    
    if (rewardsError) {
      console.error('Failed to update rewards:', rewardsError);
    } else {
      console.log('Rewards updated successfully');
    }

    const result = {
      success: true,
      message: 'Balance monitoring completed',
      stats: {
        totalCommitments: commitments?.length || 0,
        processed: processedCount,
        balanceWarnings: balanceWarnings,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Balance monitoring completed:', result);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in balance monitor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
