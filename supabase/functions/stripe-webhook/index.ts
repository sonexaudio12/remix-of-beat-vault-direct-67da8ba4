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

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

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
          paypal_transaction_id: session.payment_intent as string,
        })
        .eq("id", orderId);

      if (updateError) {
        console.error("Failed to update order:", updateError);
        throw new Error("Failed to update order");
      }

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Failed to fetch order:", orderError);
      } else {
        // Generate license PDFs for each order item
        const generatedLicensePaths: string[] = [];

        for (const item of order.order_items || []) {
          try {
            let licenseType = 'mp3';
            let itemType: 'beat' | 'sound_kit' = 'beat';
            let bpm: number | undefined;
            let genre: string | undefined;

            if (item.item_type === 'sound_kit') {
              itemType = 'sound_kit';
              licenseType = 'sound_kit';
            } else if (item.license_tier_id) {
              // Fetch license tier type
              const { data: tier } = await supabase
                .from("license_tiers")
                .select("type")
                .eq("id", item.license_tier_id)
                .single();
              if (tier) licenseType = tier.type;

              // Fetch beat details
              if (item.beat_id) {
                const { data: beat } = await supabase
                  .from("beats")
                  .select("bpm, genre")
                  .eq("id", item.beat_id)
                  .single();
                if (beat) {
                  bpm = beat.bpm;
                  genre = beat.genre;
                }
              }
            }

            console.log(`Generating license for item: ${item.item_title || item.beat_title}, type: ${licenseType}`);

            const { data: licenseResult, error: licenseError } = await supabase.functions.invoke(
              "generate-license-pdf",
              {
                body: {
                  orderId: order.id,
                  orderItemId: item.id,
                  itemType,
                  itemTitle: item.item_title || item.beat_title,
                  licenseName: item.license_name,
                  licenseType,
                  customerName: order.customer_name || customerName || '',
                  customerEmail: order.customer_email,
                  purchaseDate: order.created_at,
                  price: item.price,
                  bpm,
                  genre,
                },
              }
            );

            if (licenseError) {
              console.error(`License generation failed for item ${item.id}:`, licenseError);
            } else if (licenseResult?.filePath) {
              generatedLicensePaths.push(licenseResult.filePath);
              console.log(`License generated: ${licenseResult.filePath}`);
            }
          } catch (licErr) {
            console.error(`Error generating license for item ${item.id}:`, licErr);
          }
        }

        // Send order email with generated license paths
        try {
          const { error: emailError } = await supabase.functions.invoke("send-order-email", {
            body: {
              orderId: order.id,
              customerEmail: order.customer_email,
              customerName: order.customer_name || customerName,
              orderItems: order.order_items.map((item: any) => ({
                beat_title: item.item_title || item.beat_title,
                license_name: item.license_name,
                price: item.price,
              })),
              total: order.total,
              downloadUrl: `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/order-confirmation?orderId=${order.id}&email=${encodeURIComponent(order.customer_email)}`,
              expiresAt: order.download_expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              generatedLicensePaths,
            },
          });

          if (emailError) {
            console.error("Failed to send order email:", emailError);
          } else {
            console.log("Order email sent successfully with", generatedLicensePaths.length, "license PDFs");
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
