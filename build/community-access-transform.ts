import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error("[ESSOR Community] Topbar introuvable");
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

export function communityAccess(): Plugin {
  return {
    name: "essor-community-access",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;
      const needle = `        <div className="top-actions">\n          <button className={hasPlusAccess ? "plus-chip active" : "plus-chip"}`;
      const replacement = `        <div className="top-actions">\n          <a className="community-chip" href="/communaute" aria-label="Ouvrir la communauté ESSOR"><span aria-hidden="true">🫂</span><b>Communauté</b></a>\n          <button className={hasPlusAccess ? "plus-chip active" : "plus-chip"}`;
      return { code: replaceOnce(code, needle, replacement), map: null };
    },
  };
}
