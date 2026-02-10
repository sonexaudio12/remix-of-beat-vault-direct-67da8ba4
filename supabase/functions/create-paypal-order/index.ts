import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

 // Input validation schemas
 const cartItemSchema = z.object({
   itemType: z.enum(['beat', 'sound_kit']),
   beatId: z.string().uuid().optional(),
   beatTitle: z.string().max(255).optional(),
   licenseTierId: z.string().uuid().optional(),
   licenseName: z.string().max(100).optional(),
   soundKitId: z.string().uuid().optional(),
   soundKitTitle: z.string().max(255).optional(),
   price: z.number().min(0).max(100000),
 });
 
 const createOrderSchema = z.object({
   items: z.array(cartItemSchema).min(1).max(50),
   customerEmail: z.string().email().max(255),
   customerName: z.string().max(255).optional(),
   discountCode: z.string().max(100).nullable().optional(),
   discountAmount: z.number().min(0).max(100000).optional(),
 });
 
 type CartItem = z.infer<typeof cartItemSchema>;

interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: string;
  baseUrl: string;
}

async function getPayPalConfig(): Promise<PayPalConfig> {
  // Try to get from database first using service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: settings } = await supabase
    .from("payment_settings")
    .select("setting_key, setting_value");

  let clientId = Deno.env.get("PAYPAL_CLIENT_ID") || "";
  let clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") || "";
  let mode = Deno.env.get("PAYPAL_MODE") || "sandbox";

  // Override with database values if present
  if (settings && settings.length > 0) {
    for (const setting of settings) {
      if (setting.setting_key === "paypal_client_id" && setting.setting_value) {
        clientId = setting.setting_value;
      } else if (setting.setting_key === "paypal_client_secret" && setting.setting_value) {
        clientSecret = setting.setting_value;
      } else if (setting.setting_key === "paypal_mode" && setting.setting_value) {
        mode = setting.setting_value;
      }
    }
  }

  const baseUrl = mode === "live" 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  return { clientId, clientSecret, mode, baseUrl };
}

async function getPayPalAccessToken(config: PayPalConfig): Promise<string> {
  if (!config.clientId || !config.clientSecret) {
    throw new Error("PayPal credentials not configured. Please add your PayPal credentials in Admin Settings.");
  }

  const auth = btoa(`${config.clientId}:${config.clientSecret}`);
  
  const response = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
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
    throw new Error("Failed to authenticate with PayPal. Check your credentials.");
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
     const body = await req.json();
 
     // Validate input with zod
     const parseResult = createOrderSchema.safeParse(body);
     if (!parseResult.success) {
       const errorMessage = parseResult.error.issues.map(i => i.message).join(', ');
       console.warn("Input validation failed:", errorMessage);
      return new Response(
         JSON.stringify({ error: "Invalid input: " + errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

     const { items, customerEmail, customerName, discountCode, discountAmount: discountAmt } = parseResult.data;
 
     // Validate items have proper structure
     for (const item of items) {
       if (item.itemType === 'beat') {
         if (!item.beatId || !item.beatTitle || !item.licenseTierId || !item.licenseName) {
           return new Response(
             JSON.stringify({ error: "Invalid beat item: missing required fields" }),
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
       } else if (item.itemType === 'sound_kit') {
         if (!item.soundKitId || !item.soundKitTitle) {
           return new Response(
             JSON.stringify({ error: "Invalid sound kit item: missing required fields" }),
             { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
           );
         }
       }
    }

    // Calculate total
    const total = items.reduce((sum, item) => sum + item.price, 0);

    // Get PayPal config and create order
    const paypalConfig = await getPayPalConfig();
    const accessToken = await getPayPalAccessToken(paypalConfig);

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
          name: item.itemType === 'beat' 
            ? `${item.beatTitle} - ${item.licenseName}` 
            : item.soundKitTitle || 'Sound Kit',
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

    const createResponse = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
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
        discount_code: discountCode || null,
        discount_amount: discountAmt || 0,
        download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
      item_type: item.itemType,
      beat_id: item.itemType === 'beat' ? item.beatId : null,
      license_tier_id: item.itemType === 'beat' ? item.licenseTierId : null,
      beat_title: item.itemType === 'beat' ? item.beatTitle : '',
      license_name: item.itemType === 'beat' ? item.licenseName : 'Sound Kit',
      sound_kit_id: item.itemType === 'sound_kit' ? item.soundKitId : null,
      item_title: item.itemType === 'beat' ? item.beatTitle : item.soundKitTitle,
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
