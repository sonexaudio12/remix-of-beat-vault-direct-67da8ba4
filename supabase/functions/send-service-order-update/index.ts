import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ServiceOrderUpdateRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  serviceTitle: string;
  newStatus: string;
  message?: string;
}

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_progress: "In Progress",
  revisions: "Revisions Requested",
  completed: "Completed",
};

const statusEmoji: Record<string, string> = {
  submitted: "📋",
  in_progress: "🔧",
  revisions: "🔄",
  completed: "✅",
};

function generateEmailHtml(data: ServiceOrderUpdateRequest): string {
  const label = statusLabels[data.newStatus] || data.newStatus;
  const emoji = statusEmoji[data.newStatus] || "📬";
  const isCompleted = data.newStatus === "completed";

  const messageBlock = data.message
    ? `<div style="background: #f1f5f9; border-left: 4px solid #8b5cf6; border-radius: 0 8px 8px 0; padding: 16px; margin: 24px 0;">
        <p style="margin: 0 0 4px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message from the producer</p>
        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
      </div>`
    : "";

  const completedNote = isCompleted
    ? `<div style="background: #ecfdf5; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0; color: #065f46; font-size: 14px;">
          <strong>🎉 Your order is complete!</strong> Check your account for any delivered files or follow-up instructions.
        </p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${emoji} Service Order Update</h1>
      <p style="color: #a0a0a0; margin-top: 8px; font-size: 15px;">Hey ${data.customerName}, your order status has changed.</p>
    </div>
    <div style="background: #ffffff; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Order ID</td>
            <td style="padding: 6px 0; text-align: right; font-family: monospace; font-size: 14px; color: #333;">#${data.orderId.slice(0, 8)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">Service</td>
            <td style="padding: 6px 0; text-align: right; font-size: 14px; color: #333; font-weight: 600;">${data.serviceTitle}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #666; font-size: 14px;">New Status</td>
            <td style="padding: 6px 0; text-align: right;">
              <span style="display: inline-block; background: ${isCompleted ? '#dcfce7' : '#ede9fe'}; color: ${isCompleted ? '#166534' : '#6d28d9'}; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">${label}</span>
            </td>
          </tr>
        </table>
      </div>
      ${messageBlock}
      ${completedNote}
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://www.sonexbeats.shop/account"
           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: bold; font-size: 15px;">
          View Your Orders
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
      <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
        Questions? Reply to this email or contact support@sonex.shop
      </p>
    </div>
    <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
      © ${new Date().getFullYear()} Sonex Studio. All rights reserved.
    </p>
  </div>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const data: ServiceOrderUpdateRequest = await req.json();

    if (!data.customerEmail || !data.orderId || !data.newStatus) {
      throw new Error("Missing required fields");
    }

    console.log(`Sending service order update email to ${data.customerEmail} — status: ${data.newStatus}`);

    const label = statusLabels[data.newStatus] || data.newStatus;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sonex Studio <no-reply@sonexbeats.shop>",
        to: [data.customerEmail],
        subject: `${statusEmoji[data.newStatus] || "📬"} Your order is now: ${label}`,
        html: generateEmailHtml(data),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Resend API error: ${errText}`);
    }

    const result = await response.json();
    console.log("Service order update email sent:", result);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending service order update email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
