import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const defaultSiteUrl = "https://www.sonexstudio.shop";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantId } = await req.json();
    if (!tenantId || typeof tenantId !== "string") {
      throw new Error("A tenant is required");
    }

    const accessToken = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user: requestingUser }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
    if (userError || !requestingUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("owner_user_id")
      .eq("id", tenantId)
      .maybeSingle();

    if (tenantError || !tenant) {
      return new Response(JSON.stringify({ error: "Tenant not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { data: ownerData, error: ownerError } = await supabaseAdmin.auth.admin.getUserById(tenant.owner_user_id);
    const owner = ownerData.user;
    if (ownerError || !owner?.email) {
      return new Response(JSON.stringify({ error: "Tenant owner email is unavailable" }), {
        status: 422,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (owner.email_confirmed_at) {
      return new Response(JSON.stringify({ error: "This tenant email is already confirmed" }), {
        status: 409,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const redirectTo = new URL("/auth/callback", Deno.env.get("SITE_URL") || defaultSiteUrl).toString();
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/resend`, {
      method: "POST",
      headers: {
        apikey: Deno.env.get("SUPABASE_ANON_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: owner.email,
        type: "signup",
        redirect_to: redirectTo,
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.msg || body?.message || "Supabase could not resend the confirmation email");
    }

    return new Response(JSON.stringify({ success: true, email: owner.email }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Failed to resend tenant confirmation:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Could not resend confirmation email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
