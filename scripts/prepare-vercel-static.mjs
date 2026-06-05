import { cp, mkdir, writeFile, rm, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const clientDir = resolve(distDir, "client");
const assetsDir = resolve(clientDir, "assets");
const rootAssetsDir = resolve(distDir, "assets");
const indexPath = resolve(distDir, "index.html");

if (!existsSync(assetsDir)) {
  throw new Error("Missing dist/client/assets after Vite build");
}

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