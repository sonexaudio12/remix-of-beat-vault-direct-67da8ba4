import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    // IMPORTANT: Order matters. The more specific alias must come before "@",
    // otherwise "@" will match first and prevent the fallback from resolving.
    alias: [
      {
        // Match both imports with and without explicit extension.
        // Some environments/tools emit imports like "@/integrations/supabase/client.ts"
        // which won't match a plain string alias.
        // Also match rare absolute-style imports like "src/integrations/supabase/client".
        find: /^(?:@|src)\/integrations\/supabase\/client(?:\.ts)?$/,
        replacement: path.resolve(__dirname, "./src/integrations/supabase/client-fallback.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
}));
