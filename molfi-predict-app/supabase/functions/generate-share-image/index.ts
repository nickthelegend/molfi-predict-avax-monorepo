import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - require valid authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { userAddress, commitment, rank, badge, apy, rewards } = body;
    
    // Input validation
    if (!commitment || typeof commitment !== 'number' || commitment <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid commitment amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (commitment > 10000000) { // 10M max
      return new Response(
        JSON.stringify({ error: 'Commitment amount exceeds maximum' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (rank && (typeof rank !== 'number' || rank < 1)) {
      return new Response(
        JSON.stringify({ error: 'Invalid rank' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Generate image using OpenAI DALL-E
    const prompt = `Create a vibrant social media share card for Predifi soft staking achievement. 
    Style: Modern, playful, crypto-themed with gradients
    Layout:
    - Top: "Predifi Soft Staking" title with the Predifi logo (a stylized rocket/spaceship icon in white/cream color with playful curved design)
    - Center: Large bold "$${commitment.toLocaleString()}" commitment amount 
    ${apy ? `- "APY: ${apy}%" in accent color below commitment` : ''}
    ${rewards ? `- "Rewards: ${rewards.toLocaleString()} PREDIFI" below APY` : ''}
    ${rank ? `- "Rank #${rank}" in prominent display` : ''}
    ${badge ? `- Badge: "${badge}" with special icon` : ''}
    - Bottom: "Join me at predifi.com/earn" call-to-action
    - Background: Gradient from purple (#8B5CF6) to orange (#F97316) with subtle crypto patterns
    - Decorative elements: floating coins, stars, trophy icons in corners
    - Overall aesthetic: Playful, energetic, premium, web3-themed, similar to modern DeFi platforms
    - Color scheme: Purple, orange, with accents of pink and yellow
    - IMPORTANT: Include the Predifi logo prominently at the top - it's a cute playful rocket/spaceship design
    Dimensions: 1200x630px (optimal for Twitter/Discord)`;

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1792x1024" // Closest to 1200x630 aspect ratio
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating share image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
