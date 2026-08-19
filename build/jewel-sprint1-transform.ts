import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Jewel Sprint 1] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

export function jewelSprint1(): Plugin {
  return {
    name: "essor-jewel-sprint-1",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;

      let source = code;
      source = replaceOnce(
        source,
        `<span className="magic-pill">✨ Chaque petit pas mérite sa lumière</span>\n          <h1>L’application qui enlève<br /><em>le mauvais sort.</em></h1>\n          <p>Transforme tes efforts en victoires visibles. Ton arbre grandit, tes badges s’allument et ta fierté aussi.</p>`,
        `<span className="magic-pill">ESSOR · Reprendre le contrôle</span>\n          <h1>Reprends<br /><em>le contrôle.</em></h1>\n          <p>Un espace clair pour avancer, un jour après l’autre. Ton parcours, ton journal, ton soutien, ta communauté et ton quotidien réunis au même endroit.</p>`,
        "signature publique",
      );

      source = source.replaceAll(
        `document.title = discreet ? "Mon quotidien" : "ESSOR — L’application qui enlève le mauvais sort";`,
        `document.title = discreet ? "Mon quotidien" : "ESSOR — Reprendre le contrôle";`,
      );

      source = source.replaceAll(
        `<p className="section-label">Compagnon ESSOR · toujours sans jugement</p>`,
        `<p className="section-label">Compagnon ESSOR · soutien immédiat, sans jugement</p>`,
      );

      return { code: source, map: null };
    },
  };
}
