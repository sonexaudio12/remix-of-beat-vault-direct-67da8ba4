import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

 // Rate limiting for checkout creation
 const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
 const RATE_LIMIT_MAX = 10;
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
 
interface OrderItem {
  itemType: "beat" | "sound_kit";
  beatId?: string;
  beatTitle?: string;
  licenseTierId?: string;
  licenseName?: string;
  soundKitId?: string;
  soundKitTitle?: string;
  price: number;
}

interface CheckoutRequest {
  items: OrderItem[];
  customerEmail: string;
  customerName: string;
  discountCode?: string | null;
  discountAmount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const { items, customerEmail, customerName, discountCode, discountAmount }: CheckoutRequest = await req.json();

    if (!items || items.length === 0) {
      throw new Error("No items provided");
    }

    if (!customerEmail || !customerName) {
      throw new Error("Customer email and name are required");
    }

     // Validate email format
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!emailRegex.test(customerEmail)) {
       throw new Error("Invalid email format");
     }
 
     // Rate limit by email and IP
     const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("cf-connecting-ip") || 
                      "unknown";
     const rateLimitKey = `${customerEmail.toLowerCase()}_${clientIp}`;
     
     if (!checkRateLimit(rateLimitKey)) {
       console.warn(`Rate limit exceeded for checkout: ${rateLimitKey}`);
       return new Response(
         JSON.stringify({ error: "Too many checkout attempts. Please try again later." }),
         { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate total with discount
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const validDiscount = discountAmount && discountAmount > 0 ? Math.min(discountAmount, subtotal) : 0;
    const total = Math.max(0, subtotal - validDiscount);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        total,
        status: "pending",
        discount_code: discountCode || null,
        discount_amount: validDiscount,
        download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      item_type: item.itemType,
      beat_id: item.beatId || null,
      beat_title: item.beatTitle || item.soundKitTitle || "Item",
      item_title: item.beatTitle || item.soundKitTitle,
      license_tier_id: item.licenseTierId || null,
      license_name: item.licenseName || "Sound Kit",
      sound_kit_id: item.soundKitId || null,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      throw new Error("Failed to create order items");
    }

    // Create Stripe line items
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.beatTitle || item.soundKitTitle || "Item",
          description: item.itemType === "beat" 
            ? `${item.licenseName} License` 
            : "Sound Kit",
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: 1,
    }));

    // Get the origin for redirect URLs
    const origin = req.headers.get("origin") || "https://sonex.shop";

    // Build checkout session params
    const sessionParams: any = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${origin}/checkout?stripe_session_id={CHECKOUT_SESSION_ID}&orderId=${order.id}`,
      cancel_url: `${origin}/cart`,
      metadata: {
        order_id: order.id,
        customer_name: customerName,
        discount_code: discountCode || "",
        discount_amount: String(validDiscount),
      },
    };

    // Apply discount via Stripe coupon if applicable
    if (validDiscount > 0 && discountCode) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(validDiscount * 100),
        currency: "usd",
        duration: "once",
        name: `Discount: ${discountCode}`,
      });
      sessionParams.discounts = [{ coupon: coupon.id }];
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("Stripe session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderId: order.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
