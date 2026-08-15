import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Growth V3] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

const OLD_HERO = `        <p className="section-label">ESSOR+ · le programme complet</p>\n        <h2 id="plus-title">{firstName}, donne 30 jours<br />à la personne que tu deviens.</h2>\n        <p>Pas un simple cadenas payant : un chemin guidé, une mission courte chaque jour et des preuves concrètes de ta progression.</p>\n        <span className="trial-ribbon">{TRIAL_DAYS} jours gratuits · annulation possible avant le premier prélèvement</span>`;

const NEW_HERO = `        <p className="section-label">ESSOR+ · ton compagnon complet</p>\n        <h2 id="plus-title">{firstName}, ne compte pas seulement les jours.<br />Traverse ceux qui comptent.</h2>\n        <p>Un parcours guidé jusqu’au jour 90, un compagnon quand l’envie monte, un journal privé, des repères documentés, ton agenda santé et une communauté qui avance avec toi.</p>\n        <span className="trial-ribbon">Tout ESSOR+ pendant {TRIAL_DAYS} jours · annulation possible avant le premier prélèvement</span>`;

const OLD_BENEFITS = `      <div className="plus-benefits" aria-label="Ce que comprend ESSOR plus">\n        <article><span>🗺️</span><div><strong>Un parcours de 30 jours</strong><p>Quatre étapes pour passer de l’effort fragile à une routine qui tient.</p></div></article>\n        <article><span>⚡</span><div><strong>Une mission quotidienne</strong><p>Une action faisable en quelques minutes, même dans une mauvaise journée.</p></div></article>\n        <article><span>📖</span><div><strong>Ton histoire et tes déclencheurs</strong><p>Bilans, notes et tendances pour comprendre ce qui t’aide vraiment.</p></div></article>\n        <article><span>🏆</span><div><strong>Plus de fierté visible</strong><p>XP, niveaux, arbre évolutif et récompenses qui donnent envie de revenir.</p></div></article>\n      </div>`;

const NEW_BENEFITS = `      <div className="plus-benefits" aria-label="Ce que comprend ESSOR plus">\n        <article><span>🗺️</span><div><strong>Un chemin guidé jusqu’à 90 jours</strong><p>30 jours pour installer ton système, puis 60 jours de consolidation pour le faire tenir dans la vraie vie.</p></div></article>\n        <article><span>🌊</span><div><strong>Un compagnon quand ça monte</strong><p>Craving, stress, solitude ou écart : ESSOR t’aide à choisir la prochaine petite action au moment où elle compte.</p></div></article>\n        <article><span>📖</span><div><strong>Journal privé & déclencheurs</strong><p>Dépose ce qui pèse, repère les situations qui reviennent et construis tes propres réponses.</p></div></article>\n        <article><span>🧠</span><div><strong>Comprendre ce qui t’arrive</strong><p>Psychologie du changement, motivation, envies, automatismes et reprise après un écart, avec des sources visibles.</p></div></article>\n        <article><span>🌳</span><div><strong>Voir tes preuves</strong><p>Jours, arbre, repères, trophées et tendances rendent visible ce que la mémoire minimise trop vite.</p></div></article>\n        <article><span>🫂</span><div><strong>Une communauté qui comprend</strong><p>Signes anonymes, histoires guidées et personnes à ton étape : le soutien reste gratuit, même sans ESSOR+.</p></div></article>\n        <article><span>📅</span><div><strong>Ton quotidien au même endroit</strong><p>Médicaments déjà prescrits, rendez-vous médicaux et activité physique peuvent rejoindre ton agenda avec rappels.</p></div></article>\n        <article><span>🔐</span><div><strong>Intime par conception</strong><p>PIN, mode discret, journal chiffré et données sensibles gardées localement autant que possible.</p></div></article>\n      </div>`;

const COMMUNITY_BRIDGE = `      <div className="plus-community-free">\n        <span aria-hidden="true">🫂</span>\n        <div><small>Toujours gratuit</small><strong>Le droit de ne pas être seul ne se paie pas.</strong><p>Entre dans la communauté ESSOR : Histoires guidées, signes de soutien et présence anonyme, sans abonnement.</p></div>\n        <a className="button ghost" href="/communaute">Voir la communauté →</a>\n      </div>\n\n      <div className="pricing-grid">`;

const OLD_PROGRAM_MISSION = `            <div className={todayMissionDone ? "daily-mission complete" : "daily-mission"}>\n              <span className="mission-icon" aria-hidden="true">{todayMissionDone ? "✓" : dailyMission.icon}</span>\n              <div><small>La mission qui compte aujourd’hui</small><h3>{todayMissionDone ? "Mission accomplie" : dailyMission.title}</h3><p>{todayMissionDone ? "Tu as ajouté 80 XP à ton histoire. Rien d’autre n’est obligatoire aujourd’hui." : dailyMission.copy}</p></div>\n              <button className={todayMissionDone ? "button mission-button done" : "button mission-button"} type="button" onClick={completeDailyMission} disabled={todayMissionDone}>\n                {todayMissionDone ? "Fierté gagnée ✨" : "Je l’ai fait · +80 XP"}\n              </button>\n            </div>`;

const NEW_PROGRAM_MISSION = `            <div className={todayMissionDone ? "daily-mission complete" : "daily-mission"}>\n              <span className="mission-icon" aria-hidden="true">{todayMissionDone ? "✓" : dailyMission.icon}</span>\n              <div><small>Mission du jour · {dailyMission.method}</small><h3>{todayMissionDone ? "Mission accomplie" : dailyMission.title}</h3><p>{todayMissionDone ? "Tu as ajouté 80 XP à ton histoire. La mission reste visible pour que tu puisses garder son idée." : dailyMission.copy}</p></div>\n              <button className={todayMissionDone ? "button mission-button done" : "button mission-button"} type="button" onClick={completeDailyMission} disabled={todayMissionDone}>\n                {todayMissionDone ? "Fierté gagnée ✨" : "Je l’ai fait · +80 XP"}\n              </button>\n            </div>\n            <div className="mission-method">\n              <div><span aria-hidden="true">✍️</span><p><small>Question du jour</small><strong>{dailyMission.reflection}</strong></p></div>\n              <div><span aria-hidden="true">🔎</span><p><small>Pourquoi cette mission ?</small><strong>{dailyMission.method}</strong></p><a href={PROGRAM_SOURCES_V3[dailyMission.sourceKey].url} target="_blank" rel="noreferrer">Voir la source ou le repère méthodologique ↗</a></div>\n              {PROGRAM_SOURCES_V3[dailyMission.sourceKey].caveat && <p className="mission-caveat">{PROGRAM_SOURCES_V3[dailyMission.sourceKey].caveat}</p>}\n            </div>`;

export function growthV3(): Plugin {
  return {
    name: "essor-growth-v3",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;
      let source = code;

      source = replaceOnce(
        source,
        `"use client";\n\n`,
        `"use client";\n\nimport { PROGRAM_SOURCES_V3, PROGRAM_STAGES_V3, programMissionV3 } from "./program-v3";\n`,
        "import programme V3",
      );
      source = replaceOnce(source, OLD_HERO, NEW_HERO, "hero ESSOR+");
      source = replaceOnce(source, OLD_BENEFITS, NEW_BENEFITS, "bénéfices ESSOR+");
      source = replaceOnce(source, `      <div className="pricing-grid">`, COMMUNITY_BRIDGE, "pont communauté gratuite");

      source = replaceOnce(
        source,
        `  const plusDay = hasPlusAccess && plusStartedAt\n    ? Math.min(30, Math.max(1, Math.floor((Date.now() - new Date(plusStartedAt).getTime()) / 86_400_000) + 1))\n    : 1;`,
        `  const plusDay = hasPlusAccess && plusStartedAt\n    ? Math.min(90, Math.max(1, Math.floor((Date.now() - new Date(plusStartedAt).getTime()) / 86_400_000) + 1))\n    : 1;`,
        "jour programme 90",
      );
      source = replaceOnce(
        source,
        `  const plusStage = PROGRAM_STAGES.find((item) => plusDay >= item.from && plusDay <= item.to) ?? PROGRAM_STAGES[3];\n  const dailyMission = DAILY_MISSIONS[(plusDay - 1) % DAILY_MISSIONS.length];`,
        `  const plusStage = PROGRAM_STAGES_V3.find((item) => plusDay >= item.from && plusDay <= item.to) ?? PROGRAM_STAGES_V3[PROGRAM_STAGES_V3.length - 1];\n  const dailyMission = programMissionV3(plusDay);`,
        "mission et étape V3",
      );

      source = replaceOnce(source, `<span className="program-day">Jour {plusDay}<small>/ 30</small></span>`, `<span className="program-day">Jour {plusDay}<small>/ 90</small></span>`, "compteur programme");
      source = replaceOnce(source, `Étape {PROGRAM_STAGES.indexOf(plusStage) + 1}`, `Étape {PROGRAM_STAGES_V3.indexOf(plusStage) + 1}`, "index étape");
      source = replaceOnce(source, `<div className="program-track" aria-label={\`Jour \${plusDay} sur 30\`}><i style={{ width: \`\${(plusDay / 30) * 100}%\` }} /></div>`, `<div className="program-track" aria-label={\`Jour \${plusDay} sur 90\`}><i style={{ width: \`\${(plusDay / 90) * 100}%\` }} /></div>`, "progression 90 jours");
      source = replaceOnce(source, OLD_PROGRAM_MISSION, NEW_PROGRAM_MISSION, "profondeur mission");
      source = replaceOnce(source, `<div className="stage-row" aria-label="Les quatre étapes du programme">\n              {PROGRAM_STAGES.map((item, index) => {`, `<div className="stage-row" aria-label="Les huit étapes du programme">\n              {PROGRAM_STAGES_V3.map((item, index) => {`, "huit étapes");

      return { code: source, map: null };
    },
  };
}
