import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

 // Input validation schema
 const offerResponseSchema = z.object({
   offerId: z.string().uuid(),
   customerEmail: z.string().email().max(255),
   customerName: z.string().max(255),
   beatTitle: z.string().max(255),
   status: z.enum(['accepted', 'rejected', 'countered']),
   adminResponse: z.string().max(5000).optional(),
   counterAmount: z.number().min(1).max(999999).optional(),
   originalAmount: z.number().min(0).max(999999),
 });
 
 // Sanitize text to prevent XSS in emails
 function sanitizeHtml(text: string): string {
   return text
     .replace(/&/g, '&amp;')
     .replace(/</g, '&lt;')
     .replace(/>/g, '&gt;')
     .replace(/"/g, '&quot;')
     .replace(/'/g, '&#39;');
 }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
      const body = await req.json();
 
      // Validate input with zod
      const parseResult = offerResponseSchema.safeParse(body);
      if (!parseResult.success) {
        const errorMessage = parseResult.error.issues.map(i => i.message).join(', ');
        console.warn("Input validation failed:", errorMessage);
       return new Response(
          JSON.stringify({ error: "Invalid input" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
      const { offerId, customerEmail, customerName, beatTitle, status, adminResponse, counterAmount, originalAmount } = parseResult.data;
 
      // Validate counter amount is required for countered status
      if (status === 'countered' && !counterAmount) {
        return new Response(
          JSON.stringify({ error: "Counter amount is required for counter offers" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
 
      // Sanitize inputs for email
      const safeBeatTitle = sanitizeHtml(beatTitle);
      const safeCustomerName = sanitizeHtml(customerName);
      const safeAdminResponse = adminResponse ? sanitizeHtml(adminResponse) : undefined;
 
     // Authenticate the request - only admins can send offer responses
     const authHeader = req.headers.get("Authorization");
     if (!authHeader?.startsWith("Bearer ")) {
       return new Response(
         JSON.stringify({ error: "Unauthorized" }),
         { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
     const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
 
     // Validate user is authenticated and is an admin
     const userClient = createClient(supabaseUrl, supabaseAnonKey, {
       global: { headers: { Authorization: authHeader } }
     });
     
     const token = authHeader.replace("Bearer ", "");
     const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
     
     if (claimsError || !claimsData?.claims?.sub) {
       return new Response(
         JSON.stringify({ error: "Invalid authentication token" }),
         { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     const userId = claimsData.claims.sub;
 
     // Check if user is admin
     const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
     const { data: adminRole, error: roleError } = await serviceClient
       .from("user_roles")
       .select("role")
       .eq("user_id", userId)
       .eq("role", "admin")
       .single();
 
     if (roleError || !adminRole) {
       console.warn(`Non-admin user ${userId} attempted to send offer response`);
       return new Response(
         JSON.stringify({ error: "Forbidden: Admin access required" }),
         { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Verify the offer exists
     const { data: offer, error: offerError } = await serviceClient
       .from("exclusive_offers")
       .select("id, customer_email")
       .eq("id", offerId)
       .single();
 
     if (offerError || !offer) {
       return new Response(
         JSON.stringify({ error: "Offer not found" }),
         { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }

    console.log("Sending offer response to:", customerEmail);

    let subject = '';
    let statusHtml = '';
    let actionHtml = '';

    if (status === 'accepted') {
       subject = `Your offer for "${safeBeatTitle}" has been accepted!`;
      statusHtml = `
        <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">🎉 Offer Accepted!</h2>
          <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold;">$${originalAmount.toFixed(2)}</p>
        </div>
      `;
      actionHtml = `
        <p>We're excited to work with you! We'll be in touch shortly with payment details and next steps.</p>
        <p>Please reply to this email if you have any questions.</p>
      `;
    } else if (status === 'rejected') {
       subject = `Update on your offer for "${safeBeatTitle}"`;
      statusHtml = `
        <div style="background: #ef4444; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Offer Declined</h2>
        </div>
      `;
      actionHtml = `
        <p>Unfortunately, we're unable to accept your offer at this time.</p>
        <p>Feel free to browse our other beats or submit a new offer in the future!</p>
      `;
    } else if (status === 'countered') {
       subject = `Counter offer for "${safeBeatTitle}"`;
      statusHtml = `
        <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0;">Counter Offer</h2>
          <p style="margin: 10px 0 0 0;">
            Your offer: <s>$${originalAmount.toFixed(2)}</s>
            <br/>
            <span style="font-size: 24px; font-weight: bold;">Counter: $${counterAmount?.toFixed(2)}</span>
          </p>
        </div>
      `;
      actionHtml = `
        <p>We've reviewed your offer and would like to propose a counter offer.</p>
        <p>If you're interested, please reply to this email to proceed with the purchase.</p>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Sonex Beats <noreply@sonexbeats.shop>",
      to: [customerEmail],
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
           <h1 style="color: #333;">Hi ${safeCustomerName},</h1>
          
           <p style="color: #666;">Thank you for your interest in exclusive rights for <strong>${safeBeatTitle}</strong>.</p>
          
          ${statusHtml}
          
           ${safeAdminResponse ? `
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #333;">
               <p style="margin: 0; color: #333;">${safeAdminResponse}</p>
            </div>
          ` : ''}
          
          ${actionHtml}
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="color: #999; font-size: 12px;">
            This email was sent from Sonex Beats. If you have any questions, please reply to this email.
          </p>
        </div>
      `,
    });

    console.log("Offer response sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending offer response:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
