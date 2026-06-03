import { cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const distDir = resolve(root, "dist");
const clientDir = resolve(distDir, "client");
const assetsDir = resolve(clientDir, "assets");
const rootAssetsDir = resolve(distDir, "assets");
const indexPath = resolve(distDir, "index.html");

if (!existsSync(assetsDir)) {
  throw new Error("Missing dist/client/assets after Vite build");
}

const serverBundle = await import(resolve(distDir, "server", "index.js"));
const response = await serverBundle.default.fetch(new Request("https://vercel.local/"), {}, {});

if (!response.ok) {
  throw new Error(`Unable to render production index.html: ${response.status}`);
}

await mkdir(distDir, { recursive: true });
await cp(assetsDir, rootAssetsDir, { recursive: true, force: true });
await writeFile(indexPath, await response.text(), "utf8");

console.log("Prepared Vercel static output at dist/index.html");