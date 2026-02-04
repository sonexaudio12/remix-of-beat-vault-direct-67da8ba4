import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OfferNotificationRequest {
  beatId: string;
  beatTitle: string;
  customerName: string;
  customerEmail: string;
  offerAmount: number;
  message?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { beatTitle, customerName, customerEmail, offerAmount, message }: OfferNotificationRequest = await req.json();

    console.log("Sending offer notification for:", beatTitle);

    // Get admin email from payment settings or use a default
    const adminEmail = Deno.env.get("ADMIN_EMAIL") || "admin@sonexbeats.shop";

    const emailResponse = await resend.emails.send({
      from: "Sonex Beats <noreply@sonexbeats.shop>",
      to: [adminEmail],
      subject: `New Exclusive Rights Offer: ${beatTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Exclusive Rights Offer</h1>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0; color: #333;">${beatTitle}</h2>
            <p style="margin: 5px 0; color: #666;">
              <strong>Offer Amount:</strong> 
              <span style="color: #22c55e; font-size: 24px; font-weight: bold;">$${offerAmount.toFixed(2)}</span>
            </p>
          </div>
          
          <h3 style="color: #333;">Customer Details</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${customerName}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
          
          ${message ? `
            <h3 style="color: #333;">Message</h3>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <p style="margin: 0; color: #333;">${message}</p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; color: #666;">
            Log in to your admin dashboard to accept, reject, or counter this offer.
          </p>
          
          <a href="https://www.sonexbeats.shop/admin" 
             style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
            View in Dashboard
          </a>
        </div>
      `,
    });

    console.log("Offer notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending offer notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
