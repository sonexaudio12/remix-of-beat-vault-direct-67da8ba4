import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const { sessionId, orderId } = await req.json();

    if (!sessionId || !orderId) {
      throw new Error("Session ID and Order ID are required");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log("Stripe session status:", session.payment_status);

    if (session.payment_status === "paid") {
      // Check if order is already completed
      const { data: order } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      if (order?.status !== "completed") {
        // Update order status
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "completed",
            paypal_transaction_id: session.payment_intent as string,
          })
          .eq("id", orderId);

        if (updateError) {
          console.error("Failed to update order:", updateError);
          throw new Error("Failed to update order status");
        }

        // Send order email
        try {
          await supabase.functions.invoke("send-order-email", {
            body: { orderId },
          });
          console.log("Order email sent");
        } catch (emailErr) {
          console.error("Failed to send email:", emailErr);
        }
      }

      return new Response(
        JSON.stringify({ success: true, status: "paid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (session.payment_status === "unpaid") {
      return new Response(
        JSON.stringify({ success: false, status: "unpaid" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, status: session.payment_status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Verify session error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
