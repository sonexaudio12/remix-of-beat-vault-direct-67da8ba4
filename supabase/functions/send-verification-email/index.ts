import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const { email, name } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const siteUrl = "https://www.sonexbeats.shop";

    const emailResponse = await resend.emails.send({
      from: "Sonex Studio <no-reply@sonexbeats.shop>",
      to: [email],
      subject: "Welcome to Sonex Beats!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">Sonex Beats</h1>
          </div>
          
          <h2 style="color: #fff; margin-bottom: 10px;">Welcome${name ? `, ${name}` : ''}! 🎵</h2>
          
          <p style="color: #aaa; line-height: 1.6;">
            Your account has been successfully created. You're now part of the Sonex Beats community!
          </p>
          
          <p style="color: #aaa; line-height: 1.6;">
            Browse our catalog of premium beats, sound kits, and exclusive offers.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/beats" 
               style="display: inline-block; background: #22c55e; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Browse Beats
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            © Sonex Beats. All rights reserved.<br/>
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("Verification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
