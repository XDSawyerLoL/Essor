import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Agenda] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

function replaceBetween(source: string, start: string, end: string, replacement: string, label: string) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`[ESSOR Agenda] Bloc introuvable: ${label}`);
  return source.slice(0, startIndex) + replacement + source.slice(endIndex);
}

export function agendaTransform(): Plugin {
  return {
    name: "essor-agenda",
    enforce: "pre",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");

      if (normalized.includes("/app/Agenda.tsx")) {
        let source = code;
        source = source.replaceAll(`window.setTimeout(() => openNativeReminder("schedule", item), 40);`, `openNativeReminder("schedule", item);`);
        source = source.replaceAll(`window.setTimeout(() => openNativeReminder("cancel", item), 40);`, `openNativeReminder("cancel", item);`);
        source = source.replaceAll(`window.setTimeout(() => openNativeReminder("schedule", updated), 40);`, `openNativeReminder("schedule", updated);`);
        source = source.replaceAll(`window.setTimeout(() => openNativeReminder("cancel", updated), 40);`, `openNativeReminder("cancel", updated);`);
        return { code: source, map: null };
      }

      if (!normalized.includes("/app/page.tsx")) return null;

      let source = code;

      source = replaceOnce(
        source,
        `"use client";\n\n`,
        `"use client";\n\nimport Agenda from "./Agenda";\n`,
        "import Agenda",
      );

      source = replaceOnce(
        source,
        `type AppView = "today" | "progress" | "journal" | "learn" | "help";`,
        `type AppView = "today" | "progress" | "journal" | "agenda" | "learn" | "help";`,
        "type AppView",
      );

      source = replaceOnce(
        source,
        `const PRIVACY_NOTICE_VERSION = "2026-08-14";`,
        `const PRIVACY_NOTICE_VERSION = "2026-08-15";`,
        "version confidentialité",
      );

      source = replaceOnce(
        source,
        `      const params = new URLSearchParams(window.location.search);\n      setIsAndroidApp(params.get("platform") === "android");`,
        `      const params = new URLSearchParams(window.location.search);\n      setIsAndroidApp(params.get("platform") === "android");\n      if (params.get("agenda") === "1") setAppView("agenda");`,
        "ouverture depuis un rappel",
      );

      source = replaceBetween(
        source,
        `  async function resetPrivateSpace() {`,
        `\n\n  function selectTrack`,
        `  function resetPrivateSpace() {\n    if (!window.confirm("Effacer définitivement ton profil, tes suivis, ton agenda, ton journal, tes victoires et tes signes du Cercle ? Ton abonnement Stripe ou Google Play, s’il existe, ne sera pas résilié.")) return;\n\n    const memberIdToDelete = circleMemberId;\n    const presenceSessionId = window.localStorage.getItem(PRESENCE_SESSION_KEY);\n\n    Object.keys(window.localStorage)\n      .filter((key) => key.startsWith("essor:") && key !== SUBSCRIPTION_KEY)\n      .forEach((key) => window.localStorage.removeItem(key));\n\n    if (memberIdToDelete) {\n      void fetch("/api/circle", {\n        method: "POST",\n        headers: { "content-type": "application/json" },\n        body: JSON.stringify({ action: "delete_all", memberId: memberIdToDelete }),\n        keepalive: true,\n      }).catch(() => undefined);\n    }\n\n    if (presenceSessionId) {\n      void fetch("/api/presence", {\n        method: "POST",\n        headers: { "content-type": "application/json" },\n        body: JSON.stringify({ action: "delete", sessionId: presenceSessionId }),\n        keepalive: true,\n      }).catch(() => undefined);\n    }\n\n    if (isAndroidApp) window.location.assign("essor://agenda?op=cancel_all");\n    else window.location.reload();\n  }`,
        "Tout effacer local-first",
      );

      source = replaceOnce(
        source,
        `          <button className={appView === "journal" ? "active" : ""} type="button" onClick={() => navigateApp("journal")} aria-current={appView === "journal" ? "page" : undefined}><span aria-hidden="true">📖</span><b>Journal</b></button>\n          <button className={appView === "learn" ? "active" : ""}`,
        `          <button className={appView === "journal" ? "active" : ""} type="button" onClick={() => navigateApp("journal")} aria-current={appView === "journal" ? "page" : undefined}><span aria-hidden="true">📖</span><b>Journal</b></button>\n          <button className={appView === "agenda" ? "active" : ""} type="button" onClick={() => navigateApp("agenda")} aria-current={appView === "agenda" ? "page" : undefined}><span aria-hidden="true">📅</span><b>Agenda</b></button>\n          <button className={appView === "learn" ? "active" : ""}`,
        "onglet Agenda",
      );

      source = replaceOnce(
        source,
        `      {hasPlusAccess && profile && !editing && appView === "learn" && (`,
        `      {hasPlusAccess && profile && !editing && appView === "agenda" && (\n        <Agenda isAndroidApp={isAndroidApp} firstName={personalProfile?.firstName ?? "toi"} />\n      )}\n\n      {hasPlusAccess && profile && !editing && appView === "learn" && (`,
        "vue Agenda",
      );

      source = replaceOnce(
        source,
        `              <article><span aria-hidden="true">💳</span><div><h3>Abonnement</h3><p>Stripe ou Google Play traite le paiement. ESSOR conserve seulement les identifiants et l’état nécessaires pour ouvrir, restaurer, gérer ou résilier ESSOR+. Aucune carte bancaire n’est stockée dans l’application.</p></div></article>`,
        `              <article><span aria-hidden="true">💳</span><div><h3>Abonnement</h3><p>Stripe ou Google Play traite le paiement. ESSOR conserve seulement les identifiants et l’état nécessaires pour ouvrir, restaurer, gérer ou résilier ESSOR+. Aucune carte bancaire n’est stockée dans l’application.</p></div></article>\n              <article><span aria-hidden="true">📅</span><div><h3>Agenda local</h3><p>Les noms de médicaments, notes et motifs de rendez-vous restent sur cet appareil. Android ne conserve pour déclencher un rappel qu’un identifiant technique, l’horaire, la répétition et le type de rappel.</p></div></article>`,
        "notice agenda",
      );

      return { code: source, map: null };
    },
  };
}
