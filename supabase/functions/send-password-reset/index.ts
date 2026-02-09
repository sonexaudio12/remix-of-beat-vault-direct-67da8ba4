import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // Don't reveal if user exists or not
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Extract the hashed token from the action_link instead of using Supabase's /verify redirect
    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      console.error("No action link returned");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse the token_hash and type from the Supabase action link
    const actionUrl = new URL(actionLink);
    const tokenHash = actionUrl.searchParams.get("token") || actionUrl.searchParams.get("token_hash");
    const type = actionUrl.searchParams.get("type") || "recovery";

    // Build a direct link to the custom domain with the token
    const resetLink = `https://www.sonexbeats.shop/reset-password?token_hash=${encodeURIComponent(tokenHash!)}&type=${type}`;

    console.log("Built custom reset link for domain: www.sonexbeats.shop");

    const emailResponse = await resend.emails.send({
      from: "Sonex Studio <support@sonexbeats.shop>",
      to: [email],
      subject: "Reset Your Password - Sonex Beats",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">Sonex Beats</h1>
          </div>
          
          <h2 style="color: #fff; margin-bottom: 10px;">Password Reset Request</h2>
          
          <p style="color: #aaa; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: #22c55e; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #aaa; line-height: 1.6; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            &copy; Sonex Beats. All rights reserved.<br/>
            If you need help, contact us at support@sonexbeats.shop
          </p>
        </div>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
