import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "node:path";

// Standalone SPA build for static hosts (e.g. Vercel) that cannot run
// the Cloudflare Worker SSR bundle. Outputs an independent client bundle
// in dist/spa/ that mounts <RouterProvider> directly without TanStack
// Start's SSR hydration handshake.
export default defineConfig({
  plugins: [
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src/spa-index.html"),
    },
  },
});