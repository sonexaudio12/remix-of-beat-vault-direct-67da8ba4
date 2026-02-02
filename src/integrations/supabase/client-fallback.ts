// Fallback Supabase client.
//
// Why this exists:
// In some preview/build situations, Vite env injection can fail and `import.meta.env.VITE_*`
// becomes undefined at runtime, which crashes the app with a white screen.
//
// This module provides safe fallbacks using the project's public URL + publishable (anon) key.
// It is wired in via a Vite alias so existing imports continue to work.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const FALLBACK_SUPABASE_URL = "https://xjlgzxaukgshcytevdin.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbGd6eGF1a2dzaGN5dGV2ZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3ODk1MzgsImV4cCI6MjA4NDM2NTUzOH0.aNUF5z-DakO5EOItpkJju12RqxWCoFP4R4nfhrFnO4A";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  // Some setups may still use the old name.
  (import.meta.env as any).VITE_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL) {
  // Avoid leaking keys in logs.
  console.error("[backend] Missing backend URL configuration.");
}

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error("[backend] Missing backend public key configuration.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
