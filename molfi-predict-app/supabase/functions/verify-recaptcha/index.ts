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
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'No token provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Note: For production, you'd verify the token with Google's API
    // For now, we'll implement a basic check
    const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');
    
    if (!RECAPTCHA_SECRET_KEY) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      // For now, allow through if not configured (development mode)
      return new Response(
        JSON.stringify({ success: true, score: 1.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const verifyData = await verifyResponse.json();
    
    // For reCAPTCHA v3, check the score (0.0 - 1.0)
    // A score of 0.5 or higher is generally considered human
    const isValid = verifyData.success && verifyData.score >= 0.5;

    return new Response(
      JSON.stringify({ 
        success: isValid,
        score: verifyData.score || 0,
        action: verifyData.action || ''
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Verification failed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
