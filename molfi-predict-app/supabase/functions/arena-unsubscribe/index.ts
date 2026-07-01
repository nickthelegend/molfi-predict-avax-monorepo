import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const generateUnsubscribeHTML = (success: boolean, email?: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} - Predifi Arena</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0a0a0a;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%);
      border: 1px solid #2a2a2a;
      border-radius: 24px;
      padding: 48px;
      max-width: 480px;
      text-align: center;
    }
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;
    }
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: #000;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
    }
    .icon.success { background: rgba(0, 212, 255, 0.1); }
    .icon.error { background: rgba(255, 100, 100, 0.1); }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    p {
      color: #888888;
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .email {
      color: #00d4ff;
      font-weight: 500;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
      color: #000;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #2a2a2a;
      color: #444444;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <div class="logo-icon">P</div>
      <span class="logo-text">Predifi</span>
    </div>
    
    ${success ? `
      <div class="icon success">✓</div>
      <h1>You've Been Unsubscribed</h1>
      <p>
        <span class="email">${email}</span> has been removed from Predifi Arena notifications. 
        You won't receive any more emails about Season 0 registration.
      </p>
      <a href="https://predifi.com/arena" class="btn">Visit Arena</a>
    ` : `
      <div class="icon error">✗</div>
      <h1>Something Went Wrong</h1>
      <p>
        We couldn't process your unsubscribe request. The link may be invalid or expired.
        Please try again or contact support.
      </p>
      <a href="https://predifi.com/arena" class="btn">Go to Arena</a>
    `}
    
    <div class="footer">
      © 2026 Predifi. All rights reserved.
    </div>
  </div>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email || !token) {
      return new Response(generateUnsubscribeHTML(false), {
        status: 400,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    // Simple token validation (base64 of email)
    const expectedToken = btoa(email.toLowerCase());
    if (token !== expectedToken) {
      console.error("Invalid unsubscribe token");
      return new Response(generateUnsubscribeHTML(false), {
        status: 400,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update the signup record
    const { error } = await supabase
      .from("arena_notification_signups")
      .update({ unsubscribed_at: new Date().toISOString() })
      .eq("email", email.toLowerCase());

    if (error) {
      console.error("Unsubscribe error:", error);
      return new Response(generateUnsubscribeHTML(false), {
        status: 500,
        headers: { "Content-Type": "text/html", ...corsHeaders },
      });
    }

    console.log(`Successfully unsubscribed: ${email}`);
    return new Response(generateUnsubscribeHTML(true, email), {
      status: 200,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Unsubscribe handler error:", error);
    return new Response(generateUnsubscribeHTML(false), {
      status: 500,
      headers: { "Content-Type": "text/html", ...corsHeaders },
    });
  }
};

serve(handler);
