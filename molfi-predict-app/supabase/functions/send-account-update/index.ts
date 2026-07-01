import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AccountUpdateRequest {
  email: string;
  updateType: "email_changed" | "profile_updated" | "security_alert" | "wallet_linked";
  details?: {
    newEmail?: string;
    walletAddress?: string;
    changedFields?: string[];
  };
}

const getUpdateContent = (updateType: string, details?: AccountUpdateRequest["details"]) => {
  switch (updateType) {
    case "email_changed":
      return {
        emoji: "📧",
        title: "Email Address Updated",
        description: `Your Predifi account email has been changed${details?.newEmail ? ` to <strong style="color: #ffffff;">${details.newEmail}</strong>` : ""}.`,
        alertType: "warning",
        alertMessage: "If you didn't make this change, please secure your account immediately.",
      };
    case "profile_updated":
      return {
        emoji: "✏️",
        title: "Profile Updated",
        description: `Your profile has been successfully updated.${details?.changedFields?.length ? ` Changed: ${details.changedFields.join(", ")}.` : ""}`,
        alertType: "success",
        alertMessage: "Your changes are now live on your Predifi profile.",
      };
    case "security_alert":
      return {
        emoji: "🚨",
        title: "Security Alert",
        description: "We detected unusual activity on your account. Please review your recent activity.",
        alertType: "error",
        alertMessage: "If this wasn't you, please reset your password immediately.",
      };
    case "wallet_linked":
      return {
        emoji: "🔗",
        title: "Wallet Connected",
        description: `A new wallet has been linked to your Predifi account${details?.walletAddress ? `: <code style="background: rgba(139, 92, 246, 0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${details.walletAddress.slice(0, 6)}...${details.walletAddress.slice(-4)}</code>` : ""}.`,
        alertType: "success",
        alertMessage: "You can now use this wallet to trade on Predifi.",
      };
    default:
      return {
        emoji: "📢",
        title: "Account Update",
        description: "There's been an update to your Predifi account.",
        alertType: "info",
        alertMessage: "Please review your account settings.",
      };
  }
};

const getAlertStyles = (alertType: string) => {
  switch (alertType) {
    case "success":
      return { bg: "rgba(34, 197, 94, 0.08)", border: "rgba(34, 197, 94, 0.15)", color: "#4ade80" };
    case "warning":
      return { bg: "rgba(234, 179, 8, 0.08)", border: "rgba(234, 179, 8, 0.15)", color: "#facc15" };
    case "error":
      return { bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.15)", color: "#f87171" };
    default:
      return { bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, updateType, details }: AccountUpdateRequest = await req.json();

    if (!email || !updateType) {
      throw new Error("Email and update type are required");
    }

    const logoUrl = "https://predifi.com/assets/predifi-logo.png";
    const content = getUpdateContent(updateType, details);
    const alertStyles = getAlertStyles(content.alertType);

    const emailHtml = `
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
                    <!-- Icon -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <div style="display: inline-block; background: ${alertStyles.bg}; border-radius: 50%; padding: 20px; border: 1px solid ${alertStyles.border};">
                        <span style="font-size: 42px;">${content.emoji}</span>
                      </div>
                    </div>
                    
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                      ${content.title}
                    </h1>
                    
                    <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0; text-align: center;">
                      ${content.description}
                    </p>
                    
                    <!-- Alert Box -->
                    <div style="background: ${alertStyles.bg}; border-radius: 14px; padding: 20px; margin-top: 24px; border: 1px solid ${alertStyles.border};">
                      <p style="color: ${alertStyles.color}; font-size: 14px; margin: 0; text-align: center; font-weight: 500;">
                        ${content.alertMessage}
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin-top: 32px;">
                      <a href="https://predifi.com/settings" 
                         style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-weight: 600; font-size: 14px; box-shadow: 0 8px 30px rgba(139, 92, 246, 0.35);">
                        Review Account Settings
                      </a>
                    </div>
                    
                    <p style="color: #52525b; font-size: 12px; text-align: center; margin: 28px 0 0 0;">
                      This notification was sent on ${new Date().toLocaleDateString("en-US", { 
                        weekday: "long", 
                        year: "numeric", 
                        month: "long", 
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 36px 20px; text-align: center;">
                    <p style="color: #52525b; font-size: 13px; margin: 0 0 12px 0;">
                      Questions? Reach out on X
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

    const emailResponse = await resend.emails.send({
      from: "Predifi <noreply@predifi.com>",
      to: [email],
      subject: `${content.emoji} ${content.title} - Predifi`,
      html: emailHtml,
    });

    console.log("Account update email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-account-update function:", error);
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