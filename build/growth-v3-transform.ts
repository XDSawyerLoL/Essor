import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Growth V3] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

const OLD_HERO = `        <p className="section-label">ESSOR+ · le programme complet</p>\n        <h2 id="plus-title">{firstName}, donne 30 jours<br />à la personne que tu deviens.</h2>\n        <p>Pas un simple cadenas payant : un chemin guidé, une mission courte chaque jour et des preuves concrètes de ta progression.</p>\n        <span className="trial-ribbon">{TRIAL_DAYS} jours gratuits · annulation possible avant le premier prélèvement</span>`;

const NEW_HERO = `        <p className="section-label">ESSOR+ · ton compagnon complet</p>\n        <h2 id="plus-title">{firstName}, ne compte pas seulement les jours.<br />Traverse ceux qui comptent.</h2>\n        <p>Un parcours guidé, un compagnon quand l’envie monte, un journal privé, des repères documentés, ton agenda santé et une communauté qui avance avec toi.</p>\n        <span className="trial-ribbon">Tout ESSOR+ pendant {TRIAL_DAYS} jours · annulation possible avant le premier prélèvement</span>`;

const OLD_BENEFITS = `      <div className="plus-benefits" aria-label="Ce que comprend ESSOR plus">\n        <article><span>🗺️</span><div><strong>Un parcours de 30 jours</strong><p>Quatre étapes pour passer de l’effort fragile à une routine qui tient.</p></div></article>\n        <article><span>⚡</span><div><strong>Une mission quotidienne</strong><p>Une action faisable en quelques minutes, même dans une mauvaise journée.</p></div></article>\n        <article><span>📖</span><div><strong>Ton histoire et tes déclencheurs</strong><p>Bilans, notes et tendances pour comprendre ce qui t’aide vraiment.</p></div></article>\n        <article><span>🏆</span><div><strong>Plus de fierté visible</strong><p>XP, niveaux, arbre évolutif et récompenses qui donnent envie de revenir.</p></div></article>\n      </div>`;

const NEW_BENEFITS = `      <div className="plus-benefits" aria-label="Ce que comprend ESSOR plus">\n        <article><span>🗺️</span><div><strong>Un chemin 30 + 90 jours</strong><p>30 jours pour installer ton système, puis une phase de consolidation pour qu’il tienne dans la vraie vie.</p></div></article>\n        <article><span>🌊</span><div><strong>Un compagnon quand ça monte</strong><p>Craving, stress, solitude ou écart : ESSOR t’aide à choisir la prochaine petite action au moment où elle compte.</p></div></article>\n        <article><span>📖</span><div><strong>Journal privé & déclencheurs</strong><p>Dépose ce qui pèse, repère les situations qui reviennent et construis tes propres réponses.</p></div></article>\n        <article><span>🧠</span><div><strong>Comprendre ce qui t’arrive</strong><p>Psychologie du changement, motivation, envies, automatismes et reprise après un écart, avec des sources visibles.</p></div></article>\n        <article><span>🌳</span><div><strong>Voir tes preuves</strong><p>Jours, arbre, repères, trophées et tendances rendent visible ce que la mémoire minimise trop vite.</p></div></article>\n        <article><span>🫂</span><div><strong>Ne pas avancer seul</strong><p>Le Cercle, les présences et bientôt les Histoires relient des personnes qui connaissent le même type de combat.</p></div></article>\n        <article><span>📅</span><div><strong>Ton quotidien au même endroit</strong><p>Médicaments déjà prescrits, rendez-vous médicaux et activité physique peuvent rejoindre ton agenda avec rappels.</p></div></article>\n        <article><span>🔐</span><div><strong>Intime par conception</strong><p>PIN, mode discret, journal chiffré et données sensibles gardées localement autant que possible.</p></div></article>\n      </div>`;

export function growthV3(): Plugin {
  return {
    name: "essor-growth-v3",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;
      let source = code;
      source = replaceOnce(source, OLD_HERO, NEW_HERO, "hero ESSOR+");
      source = replaceOnce(source, OLD_BENEFITS, NEW_BENEFITS, "bénéfices ESSOR+");
      return { code: source, map: null };
    },
  };
}
