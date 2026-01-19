import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  beatId: string;
  beatTitle: string;
  licenseTierId: string;
  licenseName: string;
  price: number;
}

interface CreateOrderRequest {
  items: CartItem[];
  customerEmail: string;
  customerName?: string;
}

const PAYPAL_BASE_URL = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID");
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, customerEmail, customerName }: CreateOrderRequest = await req.json();

    // Validate input
    if (!items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "No items provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: "Customer email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price, 0);

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();

    const paypalOrder = {
      intent: "CAPTURE",
      purchase_units: [{
        amount: {
          currency_code: "USD",
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: "USD",
              value: total.toFixed(2),
            },
          },
        },
        items: items.map((item) => ({
          name: `${item.beatTitle} - ${item.licenseName}`,
          unit_amount: {
            currency_code: "USD",
            value: item.price.toFixed(2),
          },
          quantity: "1",
          category: "DIGITAL_GOODS",
        })),
      }],
      application_context: {
        brand_name: "SonexLite",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    };

    const createResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paypalOrder),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error("PayPal order creation error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create PayPal order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paypalOrderData = await createResponse.json();

    // Create pending order in database using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        paypal_order_id: paypalOrderData.id,
        status: "pending",
        total: total,
        download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      })
      .select()
      .single();

    if (orderError) {
      console.error("Database order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      beat_id: item.beatId,
      license_tier_id: item.licenseTierId,
      beat_title: item.beatTitle,
      license_name: item.licenseName,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
    }

    console.log(`Created order ${order.id} with PayPal order ${paypalOrderData.id}`);

    return new Response(
      JSON.stringify({
        orderId: order.id,
        paypalOrderId: paypalOrderData.id,
        approvalUrl: paypalOrderData.links.find((l: any) => l.rel === "approve")?.href,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Create order error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
