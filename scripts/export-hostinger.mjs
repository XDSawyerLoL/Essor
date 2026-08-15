import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("hostinger-dist/public");
await rm(resolve("hostinger-dist"), { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(resolve("dist/client"), output, { recursive: true });

const mod = await import(resolve("dist/server/index.js"));
const env = {
  ASSETS: { fetch: async () => new Response("not found", { status: 404 }) },
  DB: { prepare(){ throw new Error("DB not used for static render"); }, batch(){ throw new Error("DB not used for static render"); } },
  IMAGES: { input(){ return { transform(){ return { output(){ return Promise.resolve({ response: () => new Response("", { status: 404 }) }); } }; } }; } },
};
const ctx = { waitUntil(){}, passThroughOnException(){} };

function normalizeHtml(html) {
  return html
    .replaceAll("/workspace/sites/essor-app/.vinext/fonts/", "/assets/_vinext_fonts/")
    .replaceAll("https://xdsawyerlol.github.io/Essor/", "https://essor-app.fr/");
}

async function renderRoute(route, destination, expectedText) {
  const response = await mod.default.fetch(new Request(`https://essor-app.fr${route}`), env, ctx);
  if (!response.ok) throw new Error(`SSR ${route} status ${response.status}`);
  const html = normalizeHtml(await response.text());
  if (expectedText && !html.includes(expectedText)) throw new Error(`Unexpected content for ${route}: ${expectedText}`);
  const path = resolve(output, destination);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, html);
  return html;
}

const homeHtml = await renderRoute("/", "index.html", "ESSOR — Reprendre le contrôle");
await writeFile(resolve(output, "404.html"), homeHtml);
await renderRoute("/communaute", "communaute/index.html", "COMMUNAUTÉ ESSOR");
await renderRoute("/conditions-communaute", "conditions-communaute/index.html", "Conditions d’utilisation de la communauté");
await renderRoute("/confidentialite", "confidentialite/index.html", "Confidentialité");

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

console.log("Hostinger export ready:", output, "routes: /, /communaute, /conditions-communaute, /confidentialite");
