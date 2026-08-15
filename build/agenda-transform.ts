import type { Plugin } from "vite";

function replaceOnce(source: string, needle: string, replacement: string, label: string) {
  const index = source.indexOf(needle);
  if (index < 0) throw new Error(`[ESSOR Agenda] Bloc introuvable: ${label}`);
  return source.slice(0, index) + replacement + source.slice(index + needle.length);
}

export function agendaTransform(): Plugin {
  return {
    name: "essor-agenda",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
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
        `      const params = new URLSearchParams(window.location.search);\n      setIsAndroidApp(params.get("platform") === "android");`,
        `      const params = new URLSearchParams(window.location.search);\n      setIsAndroidApp(params.get("platform") === "android");\n      if (params.get("agenda") === "1") setAppView("agenda");`,
        "ouverture depuis un rappel",
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

      return { code: source, map: null };
    },
  };
}
