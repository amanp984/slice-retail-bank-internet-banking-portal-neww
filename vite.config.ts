// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, readFileSync } from "node:fs";

const LIVE_SUPABASE_PROJECT_ID = "grnuuhoxpnezzmfovrxx";
const LIVE_SUPABASE_URL = `https://${LIVE_SUPABASE_PROJECT_ID}.supabase.co`;
const LIVE_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdybnV1aG94cG5lenptZm92cnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyNTUwMzAsImV4cCI6MjA5NDgzMTAzMH0.kFisDt3vaZPfYwDi5MLhykMwIiWcaYytdbKxB1Tb9P4";

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

const warnIfDotEnvIsNotLiveProject = () => {
  const projectId = dotEnv.VITE_SUPABASE_PROJECT_ID || dotEnv.SUPABASE_PROJECT_ID;
  const browserUrl = dotEnv.VITE_SUPABASE_URL;
  const serverUrl = dotEnv.SUPABASE_URL;

  const mismatches = [
    projectId && projectId !== LIVE_SUPABASE_PROJECT_ID
      ? `project id ${projectId}`
      : null,
    browserUrl && browserUrl !== LIVE_SUPABASE_URL
      ? "browser Supabase URL does not match the live project"
      : null,
    serverUrl && serverUrl !== LIVE_SUPABASE_URL
      ? "server Supabase URL does not match the live project"
      : null,
  ].filter(Boolean);

  if (mismatches.length) {
    console.error(
      `[Supabase Guard] Ignoring non-live .env Supabase configuration: ${mismatches.join(
        ", "
      )}. Browser bundle is pinned to live project ${LIVE_SUPABASE_PROJECT_ID}.`
    );
  }
};

warnIfDotEnvIsNotLiveProject();

const browserSupabaseEnv = {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(LIVE_SUPABASE_URL),
  "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(LIVE_SUPABASE_PROJECT_ID),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(LIVE_SUPABASE_PUBLISHABLE_KEY),
  "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(LIVE_SUPABASE_PUBLISHABLE_KEY),
};

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
