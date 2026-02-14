import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  beat_title: string;
  license_name: string;
  license_type?: string;
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
  generatedLicensePaths?: string[];
}

interface Attachment {
  filename: string;
  content: string; // base64 encoded
}

const generateEmailHtml = (data: SendOrderEmailRequest, hasAttachments: boolean): string => {
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

  const attachmentNote = hasAttachments 
    ? `<div style="background: #e0f2fe; border-radius: 8px; padding: 16px; margin-top: 24px;">
        <p style="margin: 0; color: #0369a1; font-size: 14px;">
          <strong>📎 Personalized License Agreements Attached:</strong> Your license PDF documents have been 
          automatically generated with your purchase details and are attached to this email. 
          Please save them for your records.
        </p>
      </div>`
    : '';

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
            Your order has been processed successfully. Your files are ready to download!
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
              Download Your Files
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
          
          ${attachmentNote}
          
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
            Questions about your order? Just reply to this email.
          </p>
        </div>
        
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 24px;">
          © ${new Date().getFullYear()} Sonex Beats. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
};

async function fetchGeneratedLicensePdfs(supabase: any, paths: string[]): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  
  for (const path of paths) {
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('licenses')
        .download(path);
      
      if (downloadError) {
        console.error(`Error downloading generated license ${path}:`, downloadError);
        continue;
      }
      
      // Convert blob to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Extract filename from path
      const filename = path.split('/').pop() || 'License.pdf';
      
      attachments.push({
        filename: filename,
        content: base64,
      });
      
      console.log(`Attached generated license PDF: ${filename}`);
    } catch (err) {
      console.error(`Error processing generated license ${path}:`, err);
    }
  }
  
  return attachments;
}

// Fallback: Map license names to license template types
function getLicenseType(licenseName: string): string {
  const name = licenseName.toLowerCase();
  if (name.includes('exclusive')) return 'exclusive';
  if (name.includes('stem') || name.includes('trackout')) return 'stems';
  if (name.includes('wav')) return 'wav';
  return 'mp3';
}

async function fetchTemplateLicensePdfs(supabase: any, orderItems: OrderItem[]): Promise<Attachment[]> {
  const attachments: Attachment[] = [];
  
  // Get unique license types needed
  const licenseTypes = [...new Set(orderItems.map(item => 
    item.license_type || getLicenseType(item.license_name)
  ))];
  
  console.log("Fetching template license PDFs for types:", licenseTypes);
  
  // Fetch license templates
  const { data: templates, error } = await supabase
    .from('license_templates')
    .select('type, name, file_path')
    .in('type', licenseTypes)
    .not('file_path', 'is', null);
  
  if (error) {
    console.error("Error fetching license templates:", error);
    return attachments;
  }
  
  console.log("Found templates:", templates?.length || 0);
  
  // Download each PDF and convert to base64
  for (const template of templates || []) {
    if (!template.file_path) continue;
    
    try {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('licenses')
        .download(template.file_path);
      
      if (downloadError) {
        console.error(`Error downloading ${template.type} license:`, downloadError);
        continue;
      }
      
      // Convert blob to base64
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      attachments.push({
        filename: `${template.name.replace(/\s+/g, '_')}_License.pdf`,
        content: base64,
      });
      
      console.log(`Attached template license PDF: ${template.name}`);
    } catch (err) {
      console.error(`Error processing ${template.type} license:`, err);
    }
  }
  
  return attachments;
}

async function sendEmail(to: string, subject: string, html: string, attachments: Attachment[] = []) {
  const emailPayload: any = {
    from: "Sonex Beats <onboarding@resend.dev>",
    to: [to],
    subject,
    html,
  };
  
  if (attachments.length > 0) {
    emailPayload.attachments = attachments;
  }
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(emailPayload),
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

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let data: SendOrderEmailRequest = await req.json();

    // If only orderId was provided, fetch the full order data from DB
    if (data.orderId && (!data.customerEmail || !data.orderItems)) {
      console.log("Fetching order data from DB for orderId:", data.orderId);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`*, order_items (*)`)
        .eq("id", data.orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Failed to fetch order ${data.orderId}: ${orderError?.message}`);
      }

      data = {
        ...data,
        customerEmail: data.customerEmail || order.customer_email,
        customerName: data.customerName || order.customer_name || undefined,
        orderItems: data.orderItems || (order.order_items || []).map((item: any) => ({
          beat_title: item.item_title || item.beat_title,
          license_name: item.license_name,
          price: item.price,
        })),
        total: data.total ?? order.total,
        downloadUrl: data.downloadUrl || `${Deno.env.get("SITE_URL") || "https://sonex.shop"}/order-confirmation?orderId=${order.id}&email=${encodeURIComponent(order.customer_email)}`,
        expiresAt: data.expiresAt || order.download_expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    
    console.log("Sending order confirmation email to:", data.customerEmail);

    let attachments: Attachment[] = [];
    
    // Prefer generated license PDFs if available
    if (data.generatedLicensePaths && data.generatedLicensePaths.length > 0) {
      console.log(`Using ${data.generatedLicensePaths.length} generated license PDF(s)`);
      attachments = await fetchGeneratedLicensePdfs(supabase, data.generatedLicensePaths);
    }
    
    // Fallback to template PDFs if no generated ones available
    if (attachments.length === 0 && data.orderItems) {
      console.log("No generated licenses found, falling back to templates");
      attachments = await fetchTemplateLicensePdfs(supabase, data.orderItems);
    }
    
    console.log(`Attaching ${attachments.length} license PDF(s) to email`);

    const emailResponse = await sendEmail(
      data.customerEmail,
      "🎵 Order Confirmed - Your files are ready to download!",
      generateEmailHtml(data, attachments.length > 0),
      attachments
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.id, attachmentsCount: attachments.length }),
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
