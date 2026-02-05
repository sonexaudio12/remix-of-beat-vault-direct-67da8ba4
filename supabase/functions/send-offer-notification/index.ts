import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

 // Rate limiting
 const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
 const RATE_LIMIT_MAX = 5;
 const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
 
 function checkRateLimit(key: string): boolean {
   const now = Date.now();
   const entry = rateLimitMap.get(key);
   
   if (!entry || now > entry.resetTime) {
     rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
     return true;
   }
   
   if (entry.count >= RATE_LIMIT_MAX) {
     return false;
   }
   
   entry.count++;
   return true;
 }
 
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
     const { beatId, beatTitle, customerName, customerEmail, offerAmount, message }: OfferNotificationRequest = await req.json();
 
     // Validate required fields
     if (!beatId || !customerEmail || !offerAmount) {
       return new Response(
         JSON.stringify({ error: "Missing required fields" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Rate limit by email (prevent spam from same email)
     if (!checkRateLimit(customerEmail.toLowerCase())) {
       console.warn(`Rate limit exceeded for offer notifications: ${customerEmail}`);
       return new Response(
         JSON.stringify({ error: "Too many offers submitted. Please try again later." }),
         { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Verify the beat exists and is available for exclusive offers
     const supabase = createClient(
       Deno.env.get("SUPABASE_URL")!,
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
     );
 
     const { data: beat, error: beatError } = await supabase
       .from("beats")
       .select("id, title, is_exclusive_available")
       .eq("id", beatId)
       .single();
 
     if (beatError || !beat) {
       console.warn(`Beat not found: ${beatId}`);
       return new Response(
         JSON.stringify({ error: "Beat not found" }),
         { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     if (!beat.is_exclusive_available) {
       return new Response(
         JSON.stringify({ error: "This beat is not available for exclusive purchase" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }

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
