import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo",
};

const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

async function verifyWebhookSignature(
  req: Request,
  body: string
): Promise<boolean> {
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID");
  
  if (!webhookId) {
    console.warn("PAYPAL_WEBHOOK_ID not configured, skipping verification");
    return true; // Skip verification if webhook ID not set (for testing)
  }

  const transmissionId = req.headers.get("paypal-transmission-id");
  const transmissionTime = req.headers.get("paypal-transmission-time");
  const transmissionSig = req.headers.get("paypal-transmission-sig");
  const certUrl = req.headers.get("paypal-cert-url");
  const authAlgo = req.headers.get("paypal-auth-algo");

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    console.error("Missing PayPal webhook headers");
    return false;
  }

  try {
    const accessToken = await getPayPalAccessToken();

    const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: authAlgo,
        cert_url: certUrl,
        transmission_id: transmissionId,
        transmission_sig: transmissionSig,
        transmission_time: transmissionTime,
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    });

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Webhook verification error:", error);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    
    // Verify webhook signature (optional but recommended)
    const isValid = await verifyWebhookSignature(req, body);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const event = JSON.parse(body);
    console.log("Received PayPal webhook event:", event.event_type);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        // Order was approved by buyer, waiting for capture
        const paypalOrderId = event.resource.id;
        console.log(`Order approved: ${paypalOrderId}`);
        break;
      }

      case "PAYMENT.CAPTURE.COMPLETED": {
        // Payment was successfully captured
        const captureId = event.resource.id;
        const paypalOrderId = event.resource.supplementary_data?.related_ids?.order_id;
        
        console.log(`Payment captured: ${captureId} for order ${paypalOrderId}`);

        if (paypalOrderId) {
          // Update order status
          const { error } = await supabase
            .from("orders")
            .update({
              status: "completed",
              paypal_transaction_id: captureId,
            })
            .eq("paypal_order_id", paypalOrderId);

          if (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED": {
        // Payment was denied or refunded
        const paypalOrderId = event.resource.supplementary_data?.related_ids?.order_id;
        
        if (paypalOrderId) {
          const status = event.event_type === "PAYMENT.CAPTURE.REFUNDED" ? "refunded" : "failed";
          
          const { error } = await supabase
            .from("orders")
            .update({ status })
            .eq("paypal_order_id", paypalOrderId);

          if (error) {
            console.error("Failed to update order:", error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.event_type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
