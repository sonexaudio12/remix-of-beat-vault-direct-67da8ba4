import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function lookupTxtRecords(domain: string): Promise<string[]> {
  // Use Google DNS-over-HTTPS for TXT lookup
  const url = `https://dns.google/resolve?name=_sonexstudio.${domain}&type=TXT`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/dns-json" } });
    if (!res.ok) return [];
    const json = await res.json();
    if (!json.Answer) return [];
    return json.Answer.filter((a: any) => a.type === 16).map((a: any) =>
      (a.data || "").replace(/^"|"$/g, "").trim()
    );
  } catch (e) {
    console.error(`[DNS] Lookup failed for ${domain}:`, e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Optional: verify a single tenant domain (manual trigger)
    let singleTenantId: string | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        singleTenantId = body.tenant_id || null;
      } catch { /* no body is fine */ }
    }

    // Auth check for manual triggers
    if (singleTenantId) {
      const authHeader = req.headers.get("authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Check the user owns this tenant
        const { data: tenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("id", singleTenantId)
          .eq("owner_user_id", user.id)
          .maybeSingle();

        if (!tenant) {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Fetch pending domains
    let query = supabase
      .from("tenant_domains")
      .select("id, tenant_id, domain, verification_token, status")
      .in("status", ["pending", "verifying"])
      .not("verification_token", "is", null);

    if (singleTenantId) {
      query = query.eq("tenant_id", singleTenantId);
    }

    const { data: domains, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    const results: Array<{ domain: string; verified: boolean; records?: string[] }> = [];

    for (const domainRecord of domains || []) {
      const txtRecords = await lookupTxtRecords(domainRecord.domain);
      const tokenMatch = txtRecords.some(
        (txt) => txt === domainRecord.verification_token
      );

      results.push({
        domain: domainRecord.domain,
        verified: tokenMatch,
        records: txtRecords,
      });

      if (tokenMatch) {
        // Mark domain as verified/active
        await supabase
          .from("tenant_domains")
          .update({
            status: "active",
            verified_at: new Date().toISOString(),
          })
          .eq("id", domainRecord.id);

        // Also update the tenant's domain_status
        await supabase
          .from("tenants")
          .update({ domain_status: "verified" })
          .eq("id", domainRecord.tenant_id);

        console.log(`[Verify] ✅ Domain verified: ${domainRecord.domain}`);
      } else {
        // Update status to verifying (tried but not yet verified)
        if (domainRecord.status === "pending") {
          await supabase
            .from("tenant_domains")
            .update({ status: "verifying" })
            .eq("id", domainRecord.id);
        }
        console.log(
          `[Verify] ❌ Not verified: ${domainRecord.domain} — TXT records: ${txtRecords.join(", ") || "(none)"}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        checked: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("[Verify] Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
