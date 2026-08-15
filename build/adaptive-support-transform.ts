import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Adaptive] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

export function adaptiveSupport(): Plugin {
  return {
    name: "essor-adaptive-support",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;
      let source = code;

      source = replaceOnce(
        source,
        `  const dailyMission = programMissionV3(plusDay);`,
        `  const dailyMission = programMissionV3(plusDay);\n  const adaptiveRecentEntries = recentDays(4).map((day) => activeCheckIns[day]).filter(Boolean);\n  const adaptiveDifficultCount = adaptiveRecentEntries.filter((entry) => entry.status === "hard" || entry.status === "lapse").length;\n  const adaptiveToday = activeCheckIns[localDate()];\n  const adaptiveSupportPrompt = adaptiveToday?.status === "lapse"\n    ? { icon: "↩️", eyebrow: "Après un écart", title: "Décide de la suite aujourd’hui, pas lundi.", copy: "Ton bilan d’aujourd’hui indique un écart. ESSOR te propose simplement de faire le point et de préparer les prochaines heures — sans effacer ce que tu as déjà construit.", action: "lapse" as const }\n    : adaptiveDifficultCount >= 2\n      ? { icon: "🧭", eyebrow: "Plusieurs journées difficiles", title: "N’attends pas que la prochaine vague décide à ta place.", copy: "Au moins deux de tes quatre derniers bilans ont été difficiles. Tu peux préparer maintenant une réponse courte pour le prochain déclencheur.", action: "craving" as const }\n      : null;`,
        "calcul du soutien adaptatif",
      );

      source = replaceOnce(
        source,
        `            <button className="urge-button" onClick={openPause}>`,
        `            {adaptiveSupportPrompt && (\n              <aside className="adaptive-support" aria-label="Suggestion ESSOR basée sur tes bilans locaux">\n                <span className="adaptive-support-icon" aria-hidden="true">{adaptiveSupportPrompt.icon}</span>\n                <div><small>{adaptiveSupportPrompt.eyebrow} · règle locale transparente</small><strong>{adaptiveSupportPrompt.title}</strong><p>{adaptiveSupportPrompt.copy}</p></div>\n                <button type="button" onClick={() => { openPause(); setCompanionStep(adaptiveSupportPrompt.action); }}>Faire le point <span aria-hidden="true">→</span></button>\n              </aside>\n            )}\n\n            <button className="urge-button" onClick={openPause}>`,
        "carte de soutien adaptatif",
      );

      return { code: source, map: null };
    },
  };
}
