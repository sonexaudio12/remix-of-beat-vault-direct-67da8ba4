import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getOutputText(response: any): string {
  if (typeof response.output_text === "string") return response.output_text;
  return (response.output || [])
    .flatMap((item: any) => item.content || [])
    .filter((content: any) => content.type === "output_text")
    .map((content: any) => content.text)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Unauthorized");

    const { tenantId } = await req.json();
    if (!tenantId || typeof tenantId !== "string") throw new Error("A tenant is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", tenantId)
      .eq("owner_user_id", user.id)
      .maybeSingle();
    if (!tenant) throw new Error("Forbidden");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    const { data: beats, error: beatsError } = await supabase
      .from("beats")
      .select("id, title, genre, mood")
      .eq("tenant_id", tenantId);
    if (beatsError) throw beatsError;
    if (!beats?.length) return Response.json({ translated: 0 }, { headers: corsHeaders });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.6-luna",
        reasoning: { effort: "none" },
        instructions: "Translate the supplied beat metadata from English to natural Spanish. Preserve proper names. Return only JSON with a translations array. Each item must contain id, title, genre, and mood.",
        input: JSON.stringify(beats),
      }),
    });
    const responseBody = await response.json();
    if (!response.ok) throw new Error(responseBody?.error?.message || "OpenAI translation failed");

    const rawText = getOutputText(responseBody).replace(/^```json\s*|\s*```$/g, "");
    const translations = JSON.parse(rawText).translations;
    if (!Array.isArray(translations)) throw new Error("OpenAI returned an invalid translation response");

    const rows = translations.flatMap((translation: any) => ["title", "genre", "mood"]
      .filter((field) => typeof translation[field] === "string" && translation[field].trim())
      .map((field) => ({
        tenant_id: tenantId,
        locale: "es",
        source_type: "beat",
        source_id: translation.id,
        field,
        translated_text: translation[field].trim(),
        updated_at: new Date().toISOString(),
      })));

    const { error: saveError } = await supabase
      .from("tenant_content_translations")
      .upsert(rows, { onConflict: "tenant_id,locale,source_type,source_id,field" });
    if (saveError) throw saveError;

    return Response.json({ translated: rows.length }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed";
    return Response.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400, headers: corsHeaders });
  }
});
