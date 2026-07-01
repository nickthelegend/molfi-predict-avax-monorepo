import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    if (!email || !resetUrl) {
      throw new Error("Email and reset URL are required");
    }

    const logoUrl = "https://predifi.com/assets/predifi-logo.png";

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
                    <!-- Lock Icon -->
                    <div style="text-align: center; margin-bottom: 28px;">
                      <div style="display: inline-block; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%); border-radius: 50%; padding: 20px;">
                        <span style="font-size: 42px;">🔐</span>
                      </div>
                    </div>
                    
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.5px;">
                      Reset Your Password
                    </h1>
                    
                    <p style="color: #a1a1aa; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
                      We received a request to reset your password for your <strong style="color: #ffffff;">Predifi</strong> account. Click the button below to create a new password.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 36px 0;">
                      <a href="${resetUrl}" 
                         style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 14px; font-weight: 600; font-size: 16px; box-shadow: 0 8px 30px rgba(139, 92, 246, 0.35); letter-spacing: 0.3px;">
                        🔑 Reset Password
                      </a>
                    </div>
                    
                    <!-- Warning Box -->
                    <div style="background: rgba(239, 68, 68, 0.08); border-radius: 14px; padding: 20px; margin-top: 28px; border: 1px solid rgba(239, 68, 68, 0.2);">
                      <p style="color: #f87171; font-size: 14px; margin: 0; text-align: center; font-weight: 500;">
                        ⚠️ This link expires in 1 hour
                      </p>
                    </div>
                    
                    <p style="color: #52525b; font-size: 14px; text-align: center; margin: 28px 0 0 0; line-height: 1.6;">
                      If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 36px 20px; text-align: center;">
                    <p style="color: #52525b; font-size: 13px; margin: 0 0 12px 0;">
                      Need help? Reach out on X
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
      subject: "🔐 Reset Your Predifi Password",
      html: emailHtml,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
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