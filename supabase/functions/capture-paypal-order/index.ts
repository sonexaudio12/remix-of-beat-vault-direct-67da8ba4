import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CaptureRequest {
  paypalOrderId: string;
  orderId: string;
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
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

interface OrderItem {
  id: string;
  beat_id: string | null;
  sound_kit_id: string | null;
  beat_title: string;
  item_title: string | null;
  item_type: string;
  license_name: string;
  license_tier_id: string | null;
  price: number;
  license_tiers?: { type: string } | null;
  beats?: { bpm: number; genre: string } | null;
}

async function generateLicensePdfs(
  supabase: any,
  order: any,
  orderItems: OrderItem[]
): Promise<string[]> {
  const generatedPaths: string[] = [];
  
  for (const item of orderItems) {
    try {
      const licenseType = item.license_tiers?.type || 'mp3';
      
      const requestData = {
        orderId: order.id,
        orderItemId: item.id,
        itemType: item.item_type || 'beat',
        itemTitle: item.item_title || item.beat_title,
        licenseName: item.license_name,
        licenseType: licenseType,
        customerName: order.customer_name || '',
        customerEmail: order.customer_email,
        purchaseDate: order.created_at,
        price: item.price,
        bpm: item.beats?.bpm,
        genre: item.beats?.genre,
      };
      
      console.log(`Generating license PDF for item: ${item.beat_title}`);
      
      const response = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-license-pdf`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(requestData),
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        if (result.filePath) {
          generatedPaths.push(result.filePath);
          console.log(`License PDF generated: ${result.filePath}`);
        }
      } else {
        const errorText = await response.text();
        console.error(`Failed to generate license PDF for ${item.beat_title}:`, errorText);
      }
    } catch (err) {
      console.error(`Error generating license for ${item.beat_title}:`, err);
    }
  }
  
  return generatedPaths;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paypalOrderId, orderId }: CaptureRequest = await req.json();

    if (!paypalOrderId || !orderId) {
      return new Response(
        JSON.stringify({ error: "Missing paypalOrderId or orderId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Capture the PayPal order
    const accessToken = await getPayPalAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error("PayPal capture error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to capture payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const captureData = await captureResponse.json();

    // Verify payment was successful
    if (captureData.status !== "COMPLETED") {
      console.error("Payment not completed:", captureData.status);
      return new Response(
        JSON.stringify({ error: "Payment was not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get transaction ID
    const transactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Update order status in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        paypal_transaction_id: transactionId,
        download_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq("id", orderId)
      .eq("paypal_order_id", paypalOrderId)
      .select(`
        *,
        order_items (
          id,
          beat_id,
          sound_kit_id,
          beat_title,
          item_title,
          item_type,
          license_name,
          price,
          license_tier_id,
          license_tiers:license_tier_id (type),
          beats:beat_id (bpm, genre)
        )
      `)
      .single();

    if (updateError) {
      console.error("Order update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Order ${orderId} completed with transaction ${transactionId}`);

    // Generate personalized license PDFs for each item
    const generatedLicensePaths = await generateLicensePdfs(supabase, order, order.order_items);
    console.log(`Generated ${generatedLicensePaths.length} license PDF(s)`);

    // Send confirmation email with generated licenses
    try {
      const siteUrl = Deno.env.get("SITE_URL") || "https://id-preview--430b91ad-0bb9-4350-bdc9-63aa5f481d35.lovable.app";
      const downloadUrl = `${siteUrl}/download?orderId=${orderId}&email=${encodeURIComponent(order.customer_email)}`;
      
      const emailPayload = {
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderId: orderId,
        orderItems: order.order_items.map((item: OrderItem) => ({
          beat_title: item.item_title || item.beat_title,
          license_name: item.license_name,
          license_type: item.license_tiers?.type || null,
          price: item.price,
        })),
        total: order.total,
        downloadUrl: downloadUrl,
        expiresAt: order.download_expires_at,
        generatedLicensePaths: generatedLicensePaths,
      };

      const emailResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (!emailResponse.ok) {
        console.error("Failed to send confirmation email:", await emailResponse.text());
      } else {
        console.log("Confirmation email sent successfully");
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the order if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: order,
        transactionId: transactionId,
        generatedLicenses: generatedLicensePaths.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Capture order error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
