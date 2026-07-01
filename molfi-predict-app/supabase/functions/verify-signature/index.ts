import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SoftStakingCommitment {
  userAddress: string;
  token: string;
  amount: string;
  nonce: string;
  timestamp: number;
}

const SOFT_STAKING_DOMAIN = {
  name: "Predifi Soft Staking",
  version: "1",
  chainId: 56, // BSC Mainnet
  verifyingContract: "0x0000000000000000000000000000000000000000"
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { commitment, signature } = await req.json();

    if (!commitment || !signature) {
      return new Response(
        JSON.stringify({ error: 'Missing commitment or signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying signature for commitment:', commitment);

    // Import ethers for signature verification
    const { ethers } = await import("https://esm.sh/ethers@6.7.0");

    // Create the typed data hash
    const domain = SOFT_STAKING_DOMAIN;
    const types = SOFT_STAKING_TYPES;
    const value: SoftStakingCommitment = commitment;

    // Compute the digest
    const digest = ethers.TypedDataEncoder.hash(domain, types, value);

    // Recover the address from the signature
    const recoveredAddress = ethers.recoverAddress(digest, signature);

    // Verify the signature matches the commitment user address
    const isValid = recoveredAddress.toLowerCase() === commitment.userAddress.toLowerCase();

    console.log('Signature verification result:', {
      isValid,
      recoveredAddress,
      expectedAddress: commitment.userAddress,
    });

    if (!isValid) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Signature does not match user address',
          recoveredAddress 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Additional validations
    const now = Date.now() / 1000;
    const timeDiff = Math.abs(now - commitment.timestamp);
    
    // Signature must be recent (within 5 minutes)
    if (timeDiff > 300) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Signature timestamp is too old or invalid' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check amount is positive
    const amount = BigInt(commitment.amount);
    if (amount <= 0n) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Commitment amount must be positive' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check maximum commitment limit (150k tokens in wei: 150000 * 10^18)
    const MAX_COMMITMENT = BigInt('150000000000000000000000'); // 150k * 10^18
    if (amount > MAX_COMMITMENT) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'Maximum commitment is 150,000 tokens' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        recoveredAddress,
        message: 'Signature verified successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error verifying signature:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error.message || 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
