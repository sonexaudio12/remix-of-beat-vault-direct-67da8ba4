import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VERCEL_API_TOKEN = Deno.env.get("VERCEL_API_TOKEN");
    const VERCEL_PROJECT_ID = Deno.env.get("VERCEL_PROJECT_ID");

    if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
      throw new Error("Missing VERCEL_API_TOKEN or VERCEL_PROJECT_ID");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Check admin
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, domain } = await req.json();

    if (!domain || typeof domain !== "string") {
      throw new Error("Missing or invalid domain");
    }

    const cleanDomain = domain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");

    if (!cleanDomain || !cleanDomain.includes(".")) {
      throw new Error("Invalid domain format");
    }

    const vercelHeaders = {
      Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      "Content-Type": "application/json",
    };

    if (action === "add") {
      // Add domain to Vercel project
      const addRes = await fetch(
        `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
        {
          method: "POST",
          headers: vercelHeaders,
          body: JSON.stringify({ name: cleanDomain }),
        }
      );

      const addData = await addRes.json();

      if (!addRes.ok) {
        // Domain might already exist — that's fine
        if (addData?.error?.code === "domain_already_in_use") {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Domain already configured in Vercel",
              vercel: addData,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        throw new Error(
          addData?.error?.message || `Vercel API error: ${addRes.status}`
        );
      }

      // Also add www variant if it's a root domain (no subdomain)
      const parts = cleanDomain.split(".");
      if (parts.length === 2) {
        const wwwRes = await fetch(
          `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
          {
            method: "POST",
            headers: vercelHeaders,
            body: JSON.stringify({
              name: `www.${cleanDomain}`,
              redirect: cleanDomain,
              redirectStatusCode: 308,
            }),
          }
        );
        await wwwRes.text(); // consume body
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Domain ${cleanDomain} added to Vercel`,
          vercel: addData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "remove") {
      // Remove domain from Vercel project
      const removeRes = await fetch(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${cleanDomain}`,
        {
          method: "DELETE",
          headers: vercelHeaders,
        }
      );

      const removeText = await removeRes.text();

      // Also try removing www variant
      const parts = cleanDomain.split(".");
      if (parts.length === 2) {
        const wwwRemoveRes = await fetch(
          `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/www.${cleanDomain}`,
          {
            method: "DELETE",
            headers: vercelHeaders,
          }
        );
        await wwwRemoveRes.text();
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Domain ${cleanDomain} removed from Vercel`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "check") {
      // Check domain configuration status in Vercel
      const checkRes = await fetch(
        `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${cleanDomain}`,
        {
          method: "GET",
          headers: vercelHeaders,
        }
      );

      const checkData = await checkRes.json();

      return new Response(
        JSON.stringify({
          success: checkRes.ok,
          verified: checkData?.verified ?? false,
          vercel: checkData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      throw new Error('Invalid action. Use "add", "remove", or "check"');
    }
  } catch (e) {
    console.error("[manage-vercel-domain] Error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
