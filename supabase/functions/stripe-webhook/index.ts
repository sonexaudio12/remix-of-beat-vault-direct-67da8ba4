import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(
          JSON.stringify({ error: `Webhook Error: ${err.message}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      event = JSON.parse(body);
      console.warn("No webhook secret configured, processing without verification");
    }

    console.log("Stripe webhook event:", event.type);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;
      const customerName = session.metadata?.customer_name;

      if (!orderId) {
        console.error("No order ID in session metadata");
        return new Response(
          JSON.stringify({ error: "No order ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Processing completed checkout for order:", orderId);

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "completed",
          paypal_transaction_id: session.payment_intent as string, // Reusing field for Stripe
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        throw new Error("Failed to update order");
      }

      // Get order details for email
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (*)
        `)
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Failed to fetch order:", orderError);
      } else {
        // Generate licenses and send email
        try {
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: { orderId: order.id },
          });

          if (emailError) {
            console.error("Failed to send order email:", emailError);
          } else {
            console.log("Order email sent successfully");
          }
        } catch (emailErr) {
          console.error("Error invoking send-order-email:", emailErr);
        }
      }

      console.log("Order completed successfully:", orderId);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
