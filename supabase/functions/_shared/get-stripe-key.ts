import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Resolves the Stripe secret key by checking the payment_settings DB table first,
 * then falling back to the STRIPE_SECRET_KEY environment variable.
 */
export async function getStripeSecretKey(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("setting_value")
      .eq("setting_key", "stripe_secret_key")
      .maybeSingle();

    if (!error && data?.setting_value && data.setting_value.startsWith("sk_")) {
      return data.setting_value;
    }
  } catch (e) {
    console.warn("Could not read stripe key from DB, falling back to env:", e);
  }

  const envKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!envKey) {
    throw new Error("Stripe secret key not configured");
  }
  return envKey;
}
