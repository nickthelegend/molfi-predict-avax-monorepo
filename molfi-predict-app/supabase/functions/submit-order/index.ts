import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Order {
  maker: string;
  marketId: string;
  outcome: "YES" | "NO";
  price: string;
  size: string;
  nonce: string;
  expiry: string;
}

interface SubmitOrderRequest {
  order: Order;
  signature: string;
}

// EIP-712 domain and types for order verification
const ORDER_DOMAIN = {
  name: "Predifi Orders",
  version: "1",
  chainId: 56, // BSC Mainnet
};

const ORDER_TYPES = {
  Order: [
    { name: "maker", type: "address" },
    { name: "marketId", type: "string" },
    { name: "outcome", type: "string" },
    { name: "price", type: "string" },
    { name: "size", type: "string" },
    { name: "nonce", type: "string" },
    { name: "expiry", type: "string" },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { order, signature }: SubmitOrderRequest = await req.json();

    console.log('Received order submission request');

    // Validate order fields
    if (!order.maker || !order.marketId || !order.outcome || !order.price || !order.size || !order.nonce || !order.expiry) {
      return new Response(
        JSON.stringify({ error: 'Missing required order fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing signature' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CRITICAL SECURITY: EIP-712 Signature Verification
    // ============================================
    const { ethers } = await import("https://esm.sh/ethers@6.7.0");

    // Create the order value for EIP-712 hashing
    const orderValue = {
      maker: order.maker,
      marketId: order.marketId,
      outcome: order.outcome,
      price: order.price,
      size: order.size,
      nonce: order.nonce,
      expiry: order.expiry,
    };

    // Compute the EIP-712 typed data hash
    const digest = ethers.TypedDataEncoder.hash(ORDER_DOMAIN, ORDER_TYPES, orderValue);

    // Recover the signer address from the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.recoverAddress(digest, signature);
    } catch (sigError) {
      console.error('Invalid signature format:', sigError);
      return new Response(
        JSON.stringify({ error: 'Invalid signature format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the recovered address matches the claimed maker address
    if (recoveredAddress.toLowerCase() !== order.maker.toLowerCase()) {
      console.error('Signature mismatch:', {
        recovered: recoveredAddress.toLowerCase(),
        claimed: order.maker.toLowerCase()
      });
      return new Response(
        JSON.stringify({ error: 'Invalid signature: signer does not match maker address' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Signature verified successfully for address:', recoveredAddress);
    // ============================================
    // END: Signature Verification
    // ============================================

    // Check if order is expired
    const now = Math.floor(Date.now() / 1000);
    if (Number(order.expiry) < now) {
      return new Response(
        JSON.stringify({ error: 'Order has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if nonce is already used
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('maker_address', order.maker.toLowerCase())
      .eq('nonce', order.nonce)
      .single();

    if (existingOrder) {
      return new Response(
        JSON.stringify({ error: 'Nonce already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate price and size are positive numbers
    const price = parseFloat(order.price);
    const size = parseFloat(order.size);
    
    if (isNaN(price) || price <= 0 || price >= 1) {
      return new Response(
        JSON.stringify({ error: 'Price must be between 0 and 1' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(size) || size <= 0) {
      return new Response(
        JSON.stringify({ error: 'Size must be positive' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert order into database
    const { data: insertedOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        maker_address: order.maker.toLowerCase(),
        market_id: order.marketId,
        outcome: order.outcome,
        price: order.price,
        size: order.size,
        nonce: order.nonce,
        expiry: order.expiry,
        signature,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting order:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to submit order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order submitted successfully:', insertedOrder.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        orderId: insertedOrder.id,
        message: 'Order submitted successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-order function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
