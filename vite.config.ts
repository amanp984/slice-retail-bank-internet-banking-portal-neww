// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, readFileSync } from "node:fs";

const readDotEnv = () => {
  if (!existsSync(".env")) return {} as Record<string, string>;
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const [key, ...value] = line.split("=");
        return [key.trim(), value.join("=").trim().replace(/^['\"]|['\"]$/g, "")];
      })
  ) as Record<string, string>;
};

const dotEnv = readDotEnv();
const browserSupabaseEnv = Object.fromEntries(
  ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_ANON_KEY", "VITE_SUPABASE_PROJECT_ID"]
    .filter((key) => dotEnv[key])
    .map((key) => [`import.meta.env.${key}`, JSON.stringify(dotEnv[key])])
);

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  vite: {
    base: "/",
    define: browserSupabaseEnv,
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
