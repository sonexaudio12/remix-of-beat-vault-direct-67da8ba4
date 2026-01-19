import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  beat_title: string;
  license_name: string;
  price: number;
}

interface SendOrderEmailRequest {
  customerEmail: string;
  customerName?: string;
  orderId: string;
  orderItems: OrderItem[];
  total: number;
  downloadUrl: string;
  expiresAt: string;
}

const generateEmailHtml = (data: SendOrderEmailRequest): string => {
  const itemsHtml = data.orderItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">
          <strong>${item.beat_title}</strong><br>
          <span style="color: #666; font-size: 14px;">${item.license_name}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎵 Order Confirmed!</h1>
          <p style="color: #a0a0a0; margin-top: 10px;">Thank you for your purchase${data.customerName ? `, ${data.customerName}` : ''}!</p>
        </div>
        
        <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="color: #333; font-size: 16px; margin-bottom: 24px;">
            Your order has been processed successfully. Your beats are ready to download!
          </p>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Order ID</p>
            <p style="margin: 0; font-family: monospace; font-size: 14px; color: #333;">${data.orderId}</p>
          </div>
          
          <h2 style="color: #333; font-size: 18px; margin-bottom: 16px;">Order Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${itemsHtml}
            <tr>
              <td style="padding: 16px 12px; font-weight: bold; font-size: 18px;">Total</td>
              <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #8b5cf6;">
                $${data.total.toFixed(2)}
              </td>
            </tr>
          </table>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${data.downloadUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Download Your Beats
            </a>
          </div>
          
          <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 24px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ Important:</strong> Your download link expires on ${new Date(data.expiresAt).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}. Make sure to download your files before then!
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            Questions about your order? Just reply to this email.
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Beat Store. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
};

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Beat Store <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return response.json();
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: SendOrderEmailRequest = await req.json();
    
    console.log("Sending order confirmation email to:", data.customerEmail);

    const emailResponse = await sendEmail(
      data.customerEmail,
      "🎵 Order Confirmed - Your beats are ready to download!",
      generateEmailHtml(data)
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("Error sending order email:", error);
    const message = error instanceof Error ? error.message : "Failed to send email";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});