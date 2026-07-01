import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  email: string;
  walletAddress?: string;
}

const logoUrl = "https://predifi.com/assets/predifi-logo.png";

const getEmailTemplate = (type: "approval" | "welcome", email: string) => {
  if (type === "approval") {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                <!-- Header with Logo -->
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="https://predifi.com" style="text-decoration: none;">
                      <img src="${logoUrl}" alt="Predifi" style="height: 52px; width: auto;" />
                    </a>
                  </td>
                </tr>
                
                <!-- Main Content Card -->
                <tr>
                  <td style="background: linear-gradient(145deg, #18181b 0%, #0f0f12 100%); border-radius: 20px; padding: 48px 40px; border: 1px solid rgba(34, 197, 94, 0.2); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                    <!-- Celebration Icon -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <div style="display: inline-block; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%); border-radius: 50%; padding: 20px;">
                        <span style="font-size: 42px;">🎉</span>
                      </div>
                    </div>
                    
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                      You've Been Approved!
                    </h1>
                    
                    <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
                      Great news! Your access to <strong style="color: #ffffff;">Predifi</strong> has been approved. You can now explore our prediction markets platform and start trading.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 36px 0;">
                      <a href="https://predifi.com/markets" 
                         style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 30px rgba(139, 92, 246, 0.35); letter-spacing: 0.3px;">
                        🚀 Start Exploring
                      </a>
                    </div>
                    
                    <!-- What's Next Section -->
                    <div style="background: rgba(139, 92, 246, 0.08); border-radius: 14px; padding: 24px; margin-top: 28px; border: 1px solid rgba(139, 92, 246, 0.15);">
                      <h3 style="color: #a78bfa; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                        ⚡ What's Next?
                      </h3>
                      <ul style="color: #a1a1aa; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                        <li>Browse active prediction markets</li>
                        <li>Connect your wallet to start trading</li>
                        <li>Earn rewards through our referral program</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 36px 20px; text-align: center;">
                    <p style="color: #52525b; font-size: 13px; margin: 0 0 12px 0;">
                      Follow us for updates
                    </p>
                    <a href="https://x.com/predifi_com" style="color: #a78bfa; text-decoration: none; font-size: 15px; font-weight: 500;">@predifi_com</a>
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
                      <p style="color: #3f3f46; font-size: 12px; margin: 0;">
                        © 2026 Predifi. All rights reserved.
                      </p>
                      <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">
                        <a href="https://predifi.com/privacy-policy" style="color: #52525b; text-decoration: none;">Privacy Policy</a>
                        <span style="margin: 0 8px;">•</span>
                        <a href="https://predifi.com/terms-of-service" style="color: #52525b; text-decoration: none;">Terms of Service</a>
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
  
  // Welcome email for waitlist signup
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0b; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
              <!-- Header with Logo -->
              <tr>
                <td align="center" style="padding-bottom: 32px;">
                  <a href="https://predifi.com" style="text-decoration: none;">
                    <img src="${logoUrl}" alt="Predifi" style="height: 52px; width: auto;" />
                  </a>
                </td>
              </tr>
              
              <!-- Main Content Card -->
              <tr>
                <td style="background: linear-gradient(145deg, #18181b 0%, #0f0f12 100%); border-radius: 20px; padding: 48px 40px; border: 1px solid rgba(139, 92, 246, 0.15); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                  <!-- Welcome Icon -->
                  <div style="text-align: center; margin-bottom: 28px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%); border-radius: 50%; padding: 20px;">
                      <span style="font-size: 42px;">✨</span>
                    </div>
                  </div>
                  
                  <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                    Welcome to the Waitlist!
                  </h1>
                  
                  <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
                    Thank you for joining <strong style="color: #ffffff;">Predifi</strong>! We're building the next generation of prediction markets, and you're now part of our exclusive early access list.
                  </p>
                  
                  <!-- Referral Section -->
                  <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%); border-radius: 16px; padding: 28px; margin: 24px 0; text-align: center; border: 1px solid rgba(139, 92, 246, 0.25);">
                    <div style="display: inline-block; background: rgba(139, 92, 246, 0.2); border-radius: 20px; padding: 4px 14px; margin-bottom: 14px;">
                      <span style="color: #a78bfa; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">🚀 Move Up the Queue</span>
                    </div>
                    <p style="color: #a1a1aa; font-size: 14px; line-height: 1.7; margin: 0;">
                      Share your unique referral link with friends to earn priority access. Each successful referral moves you up in the queue!
                    </p>
                  </div>
                  
                  <!-- What to Expect Section -->
                  <div style="background: rgba(34, 197, 94, 0.08); border-radius: 14px; padding: 24px; margin-top: 20px; border: 1px solid rgba(34, 197, 94, 0.15);">
                    <h3 style="color: #4ade80; margin: 0 0 16px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">
                      What to Expect
                    </h3>
                    <ul style="color: #a1a1aa; font-size: 15px; line-height: 2; margin: 0; padding-left: 20px;">
                      <li>Priority access to our beta launch</li>
                      <li>Exclusive early bird rewards</li>
                      <li>First look at new features</li>
                    </ul>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 36px 20px; text-align: center;">
                  <p style="color: #52525b; font-size: 13px; margin: 0 0 12px 0;">
                    Stay tuned for updates
                  </p>
                  <a href="https://x.com/predifi_com" style="color: #a78bfa; text-decoration: none; font-size: 15px; font-weight: 500;">@predifi_com</a>
                  <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.05);">
                    <p style="color: #3f3f46; font-size: 12px; margin: 0;">
                      © 2026 Predifi. All rights reserved.
                    </p>
                    <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">
                      <a href="https://predifi.com/privacy-policy" style="color: #52525b; text-decoration: none;">Privacy Policy</a>
                      <span style="margin: 0 8px;">•</span>
                      <a href="https://predifi.com/terms-of-service" style="color: #52525b; text-decoration: none;">Terms of Service</a>
                    </p>
                  </div>
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, walletAddress }: ApprovalRequest = await req.json();

    // Validate required fields
    if (!email && !walletAddress) {
      throw new Error("Email or wallet address is required");
    }

    // Check if already whitelisted
    let alreadyWhitelisted = false;
    if (email) {
      const { data: existing } = await supabase
        .from("platform_whitelist")
        .select("id")
        .ilike("email", email)
        .maybeSingle();
      alreadyWhitelisted = !!existing;
    }
    
    if (!alreadyWhitelisted && walletAddress) {
      const { data: existing } = await supabase
        .from("platform_whitelist")
        .select("id")
        .ilike("wallet_address", walletAddress)
        .maybeSingle();
      alreadyWhitelisted = !!existing;
    }

    // Add to platform whitelist if not already there
    if (!alreadyWhitelisted) {
      const { error: whitelistError } = await supabase
        .from("platform_whitelist")
        .insert({
          email: email?.toLowerCase() || null,
          wallet_address: walletAddress?.toLowerCase() || null,
          added_by: "admin",
        });

      if (whitelistError) {
        console.error("Whitelist insert error:", whitelistError);
        // Continue anyway - might be race condition
      }
    }

    // Update waitlist signup as approved
    if (email) {
      await supabase
        .from("waitlist_signups")
        .update({ approved_at: new Date().toISOString() })
        .ilike("email", email);
    }

    // Send approval email if email is provided
    if (email) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Predifi <noreply@predifi.com>",
          to: [email],
          subject: "🎉 You're In! Welcome to Predifi",
          html: getEmailTemplate("approval", email),
        });

        console.log("Approval email sent successfully:", emailResponse);

        return new Response(
          JSON.stringify({ 
            success: true, 
            emailSent: true,
            emailResponse,
            alreadyWhitelisted,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (emailError: any) {
        console.error("Email sending error:", emailError);
        // Still return success - user was added to whitelist
        return new Response(
          JSON.stringify({ 
            success: true, 
            emailSent: false,
            emailError: emailError.message,
            alreadyWhitelisted,
            message: "User added to whitelist but email failed to send" 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent: false,
        message: "User added to whitelist (no email provided)" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-waitlist-approval function:", error);
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