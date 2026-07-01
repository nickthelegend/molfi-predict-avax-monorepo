import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationSignupRequest {
  email: string;
  walletAddress?: string;
}

const generateEmailHTML = (email: string, walletAddress?: string) => {
  const hasWallet = walletAddress && walletAddress.trim().length > 0;
  const maskedWallet = hasWallet 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;
  
  // Generate unsubscribe URL
  const unsubscribeToken = btoa(email.toLowerCase());
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const functionsUrl = supabaseUrl.replace(".supabase.co", ".functions.supabase.co");
  const unsubscribeUrl = `${functionsUrl}/arena-unsubscribe?email=${encodeURIComponent(email)}&token=${unsubscribeToken}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Predifi Arena</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <table role="presentation" style="border-collapse: collapse;">
                <tr>
                  <td style="width: 48px; height: 48px; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #000; font-size: 24px; font-weight: bold;">P</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Predifi</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background: linear-gradient(180deg, #1a1a1a 0%, #141414 100%); border-radius: 24px; border: 1px solid #2a2a2a; overflow: hidden;">
              
              <!-- Hero Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(0, 0, 0, 0) 50%);">
                    <table role="presentation" style="border-collapse: collapse; margin: 0 auto 24px;">
                      <tr>
                        <td style="background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 100px; padding: 8px 20px;">
                          <span style="color: #00d4ff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">🎯 SEASON 0 — PILOT</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px; line-height: 1.2;">
                      You're on the List!
                    </h1>
                    <p style="color: #888888; font-size: 16px; margin: 0; line-height: 1.6;">
                      Welcome to the Predifi Trading Arena waitlist
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent);"></div>
                  </td>
                </tr>
              </table>

              <!-- Content Section -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 32px 40px;">
                    <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                      You've secured your spot for Season 0 of the <strong style="color: #ffffff;">Predifi Trading Arena</strong> — our competitive, league-style perpetual trading competition.
                    </p>
                    
                    <!-- Prize Pool Highlight -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 153, 204, 0.05) 100%); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 16px; padding: 24px; text-align: center;">
                          <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Total Prize Pool</p>
                          <p style="color: #00d4ff; font-size: 36px; font-weight: 700; margin: 0;">$30,000</p>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                      We'll notify you as soon as registration opens so you can be among the first to compete.
                    </p>

                    <!-- Key Dates -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                      <tr>
                        <td style="background: #1f1f1f; border-radius: 12px; padding: 20px;">
                          <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 16px;">📅 Key Dates</p>
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 6px 0;">Season Start</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 6px 0; text-align: right; font-weight: 500;">April 6, 2026</td>
                            </tr>
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 6px 0;">Bi-Weekly Competitions</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 6px 0; text-align: right; font-weight: 500;">5 Rounds</td>
                            </tr>
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 6px 0;">Grand Finale</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 6px 0; text-align: right; font-weight: 500;">June 15-22, 2026</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${hasWallet ? `
                    <!-- Wallet Badge -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                      <tr>
                        <td style="background: rgba(0, 212, 255, 0.05); border: 1px solid rgba(0, 212, 255, 0.15); border-radius: 8px; padding: 12px 16px;">
                          <span style="color: #888888; font-size: 13px;">Wallet linked: </span>
                          <code style="color: #00d4ff; font-size: 13px; font-family: monospace; background: rgba(0, 212, 255, 0.1); padding: 4px 8px; border-radius: 4px;">${maskedWallet}</code>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <a href="https://predifi.com/arena/learn" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                            Learn More About Arena
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 40px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #2a2a2a, transparent);"></div>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 24px 40px; text-align: center;">
                    <p style="color: #666666; font-size: 12px; margin: 0 0 12px;">
                      Follow us for updates
                    </p>
                    <p style="margin: 0;">
                      <a href="https://twitter.com/predifi" style="color: #00d4ff; text-decoration: none; font-size: 12px; margin: 0 8px;">Twitter</a>
                      <span style="color: #333333;">•</span>
                      <a href="https://discord.gg/predifi" style="color: #00d4ff; text-decoration: none; font-size: 12px; margin: 0 8px;">Discord</a>
                      <span style="color: #333333;">•</span>
                      <a href="https://t.me/predifi" style="color: #00d4ff; text-decoration: none; font-size: 12px; margin: 0 8px;">Telegram</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bottom Text -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="color: #444444; font-size: 11px; margin: 0; line-height: 1.6;">
                You're receiving this email because you signed up for Predifi Arena notifications.<br>
                <a href="${unsubscribeUrl}" style="color: #666666; text-decoration: underline;">Unsubscribe from these emails</a>
              </p>
              <p style="color: #333333; font-size: 10px; margin: 16px 0 0;">
                © 2026 Predifi. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, walletAddress }: NotificationSignupRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending Arena notification confirmation to: ${email}`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Predifi Arena <arena@resend.dev>",
        to: [email],
        subject: "🎯 You're on the Predifi Arena Waitlist!",
        html: generateEmailHTML(email, walletAddress),
      }),
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const data = await res.json();
    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
