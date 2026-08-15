import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("hostinger-dist/public");
await rm(resolve("hostinger-dist"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve("dist/client"), output, { recursive: true });

const mod = await import(resolve("dist/server/index.js"));
const env = {
  ASSETS: { fetch: async () => new Response("not found", { status: 404 }) },
  DB: { prepare(){ throw new Error("DB not used for homepage render"); }, batch(){ throw new Error("DB not used for homepage render"); } },
  IMAGES: { input(){ return { transform(){ return { output(){ return Promise.resolve({ response: () => new Response("", { status: 404 }) }); } }; } }; } },
};
const ctx = { waitUntil(){}, passThroughOnException(){} };
const response = await mod.default.fetch(new Request("https://essor-app.fr/"), env, ctx);
if (!response.ok) throw new Error(`SSR status ${response.status}`);
let html = await response.text();
html = html
  .replaceAll("/workspace/sites/essor-app/.vinext/fonts/", "/assets/_vinext_fonts/")
  .replaceAll("https://xdsawyerlol.github.io/Essor/", "https://essor-app.fr/");

if (!html.includes("ESSOR — Reprendre le contrôle")) throw new Error("Unexpected ESSOR title");
await writeFile(resolve(output, "index.html"), html);
await writeFile(resolve(output, "404.html"), html);

for (const file of ["manifest.webmanifest", "manifest-discret.webmanifest"]) {
  const path = resolve(output, file);
  try {
    const manifest = JSON.parse(await readFile(path, "utf8"));
    manifest.start_url = file === "manifest-discret.webmanifest" ? "/?mode=discret" : "/";
    manifest.scope = "/";
    await writeFile(path, JSON.stringify(manifest, null, 2));
  } catch (error) {
    throw new Error(`Cannot normalize ${file}: ${error.message}`);
  }
}

const assetlinks = resolve(output, ".well-known/assetlinks.json");
const assetlinksText = await readFile(assetlinks, "utf8");
if (!assetlinksText.includes("com.xdsawyer.essor")) throw new Error("assetlinks.json missing ESSOR package");

console.log("Hostinger export ready:", output);
