import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LIMITLESS_API_BASE = "https://api.limitless.exchange";
const LIMITLESS_WS_BASE = "wss://api.limitless.exchange";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  // Handle WebSocket upgrade for real-time updates
  if (upgradeHeader.toLowerCase() === "websocket") {
    console.log("WebSocket upgrade requested");
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to Limitless WebSocket
    const limitlessWs = new WebSocket(`${LIMITLESS_WS_BASE}/ws`);
    
    limitlessWs.onopen = () => {
      console.log("Connected to Limitless WebSocket");
      // Subscribe to market updates
      limitlessWs.send(JSON.stringify({
        type: 'subscribe',
        channels: ['markets', 'prices']
      }));
    };

    limitlessWs.onmessage = (event) => {
      console.log("Received from Limitless:", event.data);
      // Forward to client
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(event.data);
      }
    };

    limitlessWs.onerror = (error) => {
      console.error("Limitless WS error:", error);
    };

    limitlessWs.onclose = () => {
      console.log("Limitless WS closed");
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };

    socket.onmessage = (event) => {
      console.log("Received from client:", event.data);
      // Forward to Limitless
      if (limitlessWs.readyState === WebSocket.OPEN) {
        limitlessWs.send(event.data);
      }
    };

    socket.onclose = () => {
      console.log("Client WS closed");
      if (limitlessWs.readyState === WebSocket.OPEN) {
        limitlessWs.close();
      }
    };

    return response;
  }

  // Handle REST API proxy
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace('/limitless-proxy', '');
    const apiUrl = `${LIMITLESS_API_BASE}${path}${url.search}`;

    console.log(`Proxying request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? await req.text() : undefined,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
