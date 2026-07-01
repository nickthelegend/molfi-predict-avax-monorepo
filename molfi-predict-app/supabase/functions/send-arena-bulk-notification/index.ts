import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkNotificationRequest {
  subject: string;
  notificationType: "registration_open" | "reminder" | "custom";
  customMessage?: string;
}

const generateEmailHTML = (
  email: string,
  notificationType: string,
  customMessage?: string,
  unsubscribeUrl?: string
) => {
  const contentMap: Record<string, { headline: string; body: string; cta: string; ctaLink: string }> = {
    registration_open: {
      headline: "Registration is NOW OPEN! 🎉",
      body: "The moment you've been waiting for is here! Season 0 registration is officially open. Secure your spot now and compete for your share of the $30,000 prize pool.",
      cta: "Register Now",
      ctaLink: "https://predifi.com/arena/register",
    },
    reminder: {
      headline: "Registration Closing Soon ⏰",
      body: "Don't miss out! Registration for Season 0 closes soon. This is your last chance to join the competition and compete for the $30,000 prize pool.",
      cta: "Register Before It's Too Late",
      ctaLink: "https://predifi.com/arena/register",
    },
    custom: {
      headline: "Important Arena Update",
      body: customMessage || "We have an important update for you regarding Predifi Arena Season 0.",
      cta: "View Arena",
      ctaLink: "https://predifi.com/arena",
    },
  };

  const content = contentMap[notificationType] || contentMap.custom;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Predifi Arena Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
          
          <!-- Header -->
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
              
              <!-- Hero -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 48px 40px 32px; text-align: center; background: linear-gradient(135deg, rgba(0, 212, 255, 0.15) 0%, rgba(0, 0, 0, 0) 50%);">
                    <table role="presentation" style="border-collapse: collapse; margin: 0 auto 24px;">
                      <tr>
                        <td style="background: rgba(0, 212, 255, 0.15); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 100px; padding: 8px 20px;">
                          <span style="color: #00d4ff; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">🏆 TRADING ARENA</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px; line-height: 1.2;">
                      ${content.headline}
                    </h1>
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 40px 32px;">
                    <p style="color: #cccccc; font-size: 16px; line-height: 1.7; margin: 0 0 32px; text-align: center;">
                      ${content.body}
                    </p>
                    
                    <!-- Prize Pool -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                      <tr>
                        <td style="background: linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 153, 204, 0.05) 100%); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 16px; padding: 24px; text-align: center;">
                          <p style="color: #888888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Season 0 Prize Pool</p>
                          <p style="color: #00d4ff; font-size: 42px; font-weight: 700; margin: 0;">$30,000</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Season Dates -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
                      <tr>
                        <td style="background: #1f1f1f; border-radius: 12px; padding: 20px;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 8px 0;">Competition Start</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 8px 0; text-align: right; font-weight: 600;">April 6, 2026</td>
                            </tr>
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 8px 0;">5 Bi-Weekly Rounds</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 8px 0; text-align: right; font-weight: 600;">$4,000 each</td>
                            </tr>
                            <tr>
                              <td style="color: #888888; font-size: 13px; padding: 8px 0;">Grand Finale</td>
                              <td style="color: #ffffff; font-size: 13px; padding: 8px 0; text-align: right; font-weight: 600;">$10,000</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center">
                          <a href="${content.ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%); color: #000000; font-size: 16px; font-weight: 600; text-decoration: none; padding: 16px 48px; border-radius: 8px;">
                            ${content.cta}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Footer -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 24px 40px; text-align: center; border-top: 1px solid #2a2a2a;">
                    <p style="color: #666666; font-size: 12px; margin: 0 0 12px;">Follow us for updates</p>
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

          <!-- Unsubscribe -->
          <tr>
            <td style="padding: 32px 20px; text-align: center;">
              <p style="color: #444444; font-size: 11px; margin: 0; line-height: 1.6;">
                You're receiving this because you signed up for Predifi Arena notifications.<br>
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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { subject, notificationType, customMessage }: BulkNotificationRequest = await req.json();

    if (!subject || !notificationType) {
      return new Response(
        JSON.stringify({ error: "Subject and notification type required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get all active signups (not unsubscribed)
    const { data: signups, error: signupsError } = await supabase
      .from("arena_notification_signups")
      .select("id, email")
      .is("unsubscribed_at", null);

    if (signupsError) {
      throw signupsError;
    }

    if (!signups || signups.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No active subscribers" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending bulk notification to ${signups.length} subscribers`);

    const functionsUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".functions.supabase.co");
    
    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Send emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < signups.length; i += batchSize) {
      const batch = signups.slice(i, i + batchSize);
      
      const promises = batch.map(async (signup) => {
        try {
          const unsubscribeToken = btoa(signup.email.toLowerCase());
          const unsubscribeUrl = `${functionsUrl}/arena-unsubscribe?email=${encodeURIComponent(signup.email)}&token=${unsubscribeToken}`;
          
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Predifi Arena <arena@resend.dev>",
              to: [signup.email],
              subject: subject,
              html: generateEmailHTML(signup.email, notificationType, customMessage, unsubscribeUrl),
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Failed to send to ${signup.email}: ${errorText}`);
          }

          // Update notified_at
          await supabase
            .from("arena_notification_signups")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", signup.id);

          return { success: true, email: signup.email };
        } catch (error: any) {
          console.error(`Error sending to ${signup.email}:`, error);
          return { success: false, email: signup.email, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push(result.error || `Failed: ${result.email}`);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < signups.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Log admin action
    await supabase.from("arena_admin_logs").insert({
      admin_user_id: user.id,
      action: "BULK_NOTIFICATION",
      target_type: "arena_notification_signups",
      details: {
        notification_type: notificationType,
        subject,
        total: signups.length,
        success: successCount,
        failures: failureCount,
      },
    });

    console.log(`Bulk notification complete: ${successCount} sent, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failureCount,
        total: signups.length,
        errors: errors.slice(0, 5), // Only return first 5 errors
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Bulk notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
