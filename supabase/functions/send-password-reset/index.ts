import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory rate limiting: max 3 requests per email per 15 minutes, max 10 per IP per 15 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;
const DEFAULT_SITE_URL = "https://www.sonexstudio.shop";

function isRateLimited(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= max) {
    return true;
  }

  entry.count++;
  return false;
}

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

async function getResetOrigin(request: Request, supabaseAdmin: any): Promise<string> {
  const origin = request.headers.get("origin");

  if (!origin) {
    return Deno.env.get("SITE_URL") || DEFAULT_SITE_URL;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "localhost" && url.protocol === "http:") {
      return url.origin;
    }

    if (url.protocol !== "https:") {
      return Deno.env.get("SITE_URL") || DEFAULT_SITE_URL;
    }

    if (hostname === "sonexstudio.shop" || hostname === "www.sonexstudio.shop") {
      return url.origin;
    }

    if (hostname.endsWith(".sonexstudio.shop")) {
      const slug = hostname.replace(/\.sonexstudio\.shop$/, "");
      const { data: tenant } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();

      if (tenant) return url.origin;
    } else {
      const { data: domain } = await supabaseAdmin
        .from("tenant_domains")
        .select("id")
        .eq("domain", hostname)
        .eq("status", "active")
        .maybeSingle();

      if (domain) return url.origin;
    }
  } catch {
  }

  return Deno.env.get("SITE_URL") || DEFAULT_SITE_URL;
}

function isSuperAdmin(email: string | undefined): boolean {
  const configuredEmails = Deno.env.get("SUPER_ADMIN_EMAILS") || Deno.env.get("ADMIN_EMAIL") || "";
  const allowedEmails = configuredEmails
    .split(",")
    .map((configuredEmail) => configuredEmail.trim().toLowerCase())
    .filter(Boolean);

  return !!email && allowedEmails.includes(email.toLowerCase());
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!Deno.env.get("RESEND_API_KEY")) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email: requestedEmail, tenantId } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let email = requestedEmail;
    let resetOrigin: string | null = null;

    if (tenantId) {
      if (typeof tenantId !== "string") {
        return new Response(JSON.stringify({ error: "Invalid tenant" }), {
          status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
      if (!accessToken) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
      if (userError || !requestingUser) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (!isSuperAdmin(requestingUser.email)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: tenant, error: tenantError } = await supabaseAdmin
        .from("tenants")
        .select("owner_user_id, slug, custom_domain, domain_status")
        .eq("id", tenantId)
        .maybeSingle();

      if (tenantError || !tenant) {
        return new Response(JSON.stringify({ error: "Tenant not found" }), {
          status: 404, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const { data: ownerData, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(tenant.owner_user_id);
      if (ownerError || !ownerData.user?.email) {
        return new Response(JSON.stringify({ error: "Tenant owner email is unavailable" }), {
          status: 422, headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      email = ownerData.user.email;
      resetOrigin = await getResetOrigin(req, supabaseAdmin);
    }

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!emailRegex.test(trimmedEmail) || trimmedEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Rate limit by IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`ip:${clientIp}`, MAX_PER_IP)) {
      console.warn(`Rate limited IP: ${clientIp}`);
      // Return success to not reveal rate limiting to attackers
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Rate limit by email
    if (isRateLimited(`email:${trimmedEmail}`, MAX_PER_EMAIL)) {
      console.warn(`Rate limited email: ${trimmedEmail}`);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: trimmedEmail,
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const tokenHash = data?.properties?.hashed_token;
    if (!tokenHash) {
      console.error("No hashed recovery token returned");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const resetUrl = new URL("/reset-password", resetOrigin || await getResetOrigin(req, supabaseAdmin));
    resetUrl.searchParams.set("token_hash", tokenHash);
    resetUrl.searchParams.set("type", "recovery");
    const resetLink = resetUrl.toString();

    console.log("Built password reset link for:", resetUrl.origin);

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Sonex Studio <no-reply@sonexstudio.shop>",
      to: [trimmedEmail],
      subject: "Reset Your Password - Sonex Beats",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #111; color: #fff; padding: 40px; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">Sonex Beats</h1>
          </div>
          
          <h2 style="color: #fff; margin-bottom: 10px;">Password Reset Request</h2>
          
          <p style="color: #aaa; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: #22c55e; color: #000; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #aaa; line-height: 1.6; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 30px 0;" />
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            &copy; Sonex Beats. All rights reserved.<br/>
            If you need help, contact us at support@sonexstudio.shop
          </p>
        </div>
      `,
    });

    if (emailError) {
      throw new Error(`Resend rejected password reset email: ${emailError.message}`);
    }

    console.log("Password reset email sent:", emailData?.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
