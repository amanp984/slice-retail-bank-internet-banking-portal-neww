import { cp, mkdir, writeFile, rm, readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const clientDir = resolve(distDir, "client");
const indexPath = resolve(distDir, "index.html");
const spaDir = resolve(distDir, "spa");
const spaAssetsDir = resolve(spaDir, "assets");
const spaHtmlPath = resolve(spaDir, "src", "spa-index.html");
const rootAssetsDir = resolve(distDir, "assets");

// Build a standalone SPA bundle that does NOT depend on the Cloudflare
// Worker SSR runtime. This is what Vercel (and any other static host)
// will actually serve. Bypasses TanStack Start's SSR hydration handshake
// (which throws "Invariant failed" when no SSR stream is present).
console.log("Building standalone SPA bundle for static hosting...");
const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "build", "-c", "vite.spa.config.ts"],
  { stdio: "inherit", cwd: root },
);
if (result.status !== 0) {
  throw new Error(`SPA build failed with exit code ${result.status}`);
}
if (!existsSync(spaAssetsDir) || !existsSync(spaHtmlPath)) {
  throw new Error("SPA build did not produce expected output in dist/spa/");
}

// Rewrite paths in the generated SPA HTML so it lives at dist/index.html.
// Vite emits asset URLs relative to the input HTML location
// (e.g. "../assets/spa-index-*.js"); normalize them to absolute "/assets/...".
let html = await readFile(spaHtmlPath, "utf8");
html = html.replace(/(["'(])(?:\.\.\/)+assets\//g, "$1/assets/");

// Replace dist/assets with the SPA's assets (clears stale SSR chunks)
if (existsSync(rootAssetsDir)) {
  await rm(rootAssetsDir, { recursive: true, force: true });
}
await mkdir(distDir, { recursive: true });
await cp(spaAssetsDir, rootAssetsDir, { recursive: true });

// Copy favicon if present from the client build
const favicon = resolve(clientDir, "favicon.ico");
if (existsSync(favicon)) {
  await cp(favicon, resolve(distDir, "favicon.ico"), { force: true });
}

await writeFile(indexPath, html, "utf8");

// Strip everything Vercel shouldn't ship: Worker bundle, intermediate
// client/SPA dirs, and Nitro/Wrangler artifacts. Vercel's static build
// would otherwise try to use dist/server as a serverless function.
for (const dir of [resolve(distDir, "server"), clientDir, spaDir]) {
  if (existsSync(dir)) {
    await rm(dir, { recursive: true, force: true });
  }
}
for (const f of ["nitro.json", "package.json", "package-lock.json", "_headers"]) {
  const p = resolve(distDir, f);
  if (existsSync(p)) await rm(p, { force: true });
}

const finalAssets = await readdir(rootAssetsDir).catch(() => []);
console.log(`Prepared Vercel static output at ${indexPath} (${finalAssets.length} assets).`);

// Try SSR rendering for pre-rendered HTML; fall back to a client-only shell.
let html;
try {
  const serverBundle = await import(resolve(distDir, "server", "index.mjs"));
  const handler = serverBundle.default;
  const response = await handler.fetch(
    new Request("https://vercel.local/"),
    {},
    { waitUntil: () => {}, passThroughOnException: () => {} },
  );
  if (response.ok) {
    html = await response.text();
    console.log("SSR render succeeded.");
  } else {
    console.warn(`SSR render returned ${response.status}, using client-only fallback.`);
  }
} catch (err) {
  console.warn("SSR render failed, using client-only fallback:", err.message || err);
}

// Discover the client entry JS (the main index-*.js bundle)
if (!html) {
  const assets = await readdir(assetsDir);
  const indexBundles = await Promise.all(
    assets
      .filter((f) => /^index-[A-Za-z0-9_-]+\.js$/.test(f))
      .map(async (file) => ({ file, size: (await stat(join(assetsDir, file))).size })),
  );
  const entryJs = indexBundles.sort((a, b) => b.size - a.size)[0]?.file;
  const entryCss = assets.find((f) => /^styles-[A-Za-z0-9_-]+\.css$/.test(f));
  if (!entryJs) throw new Error("Could not find client entry JS in dist/client/assets");
  html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Slice Bank Internet Banking</title>${entryCss ? `\n  <link rel="stylesheet" href="/assets/${entryCss}" />` : ""}
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${entryJs}"></script>
</body>
</html>`;
}

// Copy client assets to dist root and write index.html
await mkdir(distDir, { recursive: true });
await cp(assetsDir, rootAssetsDir, { recursive: true, force: true });

// Copy favicon if present
const favicon = resolve(clientDir, "favicon.ico");
if (existsSync(favicon)) {
  await cp(favicon, resolve(distDir, "favicon.ico"), { force: true });
}

await writeFile(indexPath, html, "utf8");

// Remove server directory so Vercel doesn't try to use it as a serverless function
const serverDir = resolve(distDir, "server");
if (existsSync(serverDir)) {
  await rm(serverDir, { recursive: true, force: true });
  console.log("Removed dist/server/ (not needed for static deploy).");
}

// Remove client subdirectory (assets already copied to dist/assets)
if (existsSync(clientDir)) {
  await rm(clientDir, { recursive: true, force: true });
}

// Remove nitro artifacts
for (const f of ["nitro.json", "package.json", "package-lock.json"]) {
  const p = resolve(distDir, f);
  if (existsSync(p)) await rm(p, { force: true });
}

console.log("Prepared Vercel static output at dist/index.html");