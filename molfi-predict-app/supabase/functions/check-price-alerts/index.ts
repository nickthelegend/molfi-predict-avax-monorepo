import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking price alerts...');

    // Get all active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) {
      throw alertsError;
    }

    console.log(`Found ${alerts?.length || 0} active alerts`);

    // Fetch current prices from Limitless API through proxy
    const pricesMap = new Map<string, number>();
    
    for (const alert of alerts || []) {
      try {
        // Fetch market data from Limitless proxy
        const marketResponse = await fetch(
          `${supabaseUrl}/functions/v1/limitless-proxy/markets/${alert.market_id}`,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (marketResponse.ok) {
          const marketData = await marketResponse.json();
          const currentPrice = marketData.prices?.[0]; // YES price
          
          if (currentPrice !== undefined) {
            pricesMap.set(alert.market_id, currentPrice);

            // Check if alert should trigger
            const shouldTrigger =
              (alert.condition === 'above' && currentPrice >= alert.target_price) ||
              (alert.condition === 'below' && currentPrice <= alert.target_price);

            if (shouldTrigger) {
              console.log(`Alert triggered for market ${alert.market_id}`);

              // Update alert as triggered
              await supabase
                .from('price_alerts')
                .update({
                  triggered_at: new Date().toISOString(),
                  is_active: false,
                })
                .eq('id', alert.id);

              // Create notification
              await supabase.from('notifications').insert({
                user_id: alert.user_id,
                title: 'Price Alert Triggered',
                message: `${alert.market_title} has reached ${currentPrice}% (${alert.condition} ${alert.target_price}%)`,
                type: 'alert',
              });

              console.log(`Created notification for user ${alert.user_id}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        // Continue with next alert
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checked: alerts?.length || 0,
        triggered: alerts?.filter(a => pricesMap.has(a.market_id))?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Price monitoring error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
