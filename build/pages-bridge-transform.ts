import type { Plugin } from "vite";

const API_ORIGIN = "https://essor-api-bridge.vercel.app";
const GITHUB_PUBLIC_URL = "https://xdsawyerlol.github.io/Essor/";
const CUSTOM_HOST = "essor-app.fr";

export function pagesBridge(): Plugin {
  return {
    name: "essor-pages-bridge",
    transform(code, id) {
      const normalized = id.replaceAll("\\", "/");
      if (!normalized.includes("/app/page.tsx")) return null;

      let source = code;

      source = source.replaceAll("window.location.origin", "ESSOR_PUBLIC_URL");
      source = source.replaceAll('fetch("/api/presence"', 'fetch(`${ESSOR_API_ORIGIN}/api/presence`');
      source = source.replaceAll('fetch("/api/circle"', 'fetch(`${ESSOR_API_ORIGIN}/api/circle`');
      source = source.replaceAll('fetch(`/api/circle?member=', 'fetch(`${ESSOR_API_ORIGIN}/api/circle?member=');
      source = source.replaceAll('fetch("/api/stripe/verify"', 'fetch(`${ESSOR_API_ORIGIN}/api/stripe/verify`');
      source = source.replaceAll('fetch("/api/stripe/portal"', 'fetch(`${ESSOR_API_ORIGIN}/api/stripe/portal`');
      source = source.replaceAll('fetch("/api/google-play/verify"', 'fetch(`${ESSOR_API_ORIGIN}/api/google-play/verify`');

      source = source.replace(
        'const PLAY_BILLING_METHOD = "https://play.google.com/billing";',
        `const ESSOR_HOSTNAME = typeof window !== "undefined" ? window.location.hostname : "";\nconst ESSOR_IS_GITHUB_PAGES = ESSOR_HOSTNAME === "xdsawyerlol.github.io";\nconst ESSOR_IS_CUSTOM_DOMAIN = ESSOR_HOSTNAME === "${CUSTOM_HOST}" || ESSOR_HOSTNAME === "www.${CUSTOM_HOST}";\nconst ESSOR_IS_STATIC_HOST = ESSOR_IS_GITHUB_PAGES || ESSOR_IS_CUSTOM_DOMAIN;\nconst ESSOR_API_ORIGIN = ESSOR_IS_STATIC_HOST ? "${API_ORIGIN}" : "";\nconst ESSOR_BASE_PATH = ESSOR_IS_GITHUB_PAGES ? "/Essor" : "";\nconst ESSOR_PUBLIC_URL = ESSOR_IS_GITHUB_PAGES ? "${GITHUB_PUBLIC_URL}" : (ESSOR_IS_CUSTOM_DOMAIN ? (typeof window !== "undefined" ? window.location.origin + "/" : "https://${CUSTOM_HOST}/") : (typeof window !== "undefined" ? window.location.origin : "https://essor-app.valentin88hernandez.chatgpt.site"));\nconst PLAY_BILLING_METHOD = "https://play.google.com/billing";`,
      );

      source = source.replace(
        'discreet ? "/manifest-discret.webmanifest" : "/manifest.webmanifest"',
        'discreet ? `${ESSOR_BASE_PATH}/manifest-discret.webmanifest` : `${ESSOR_BASE_PATH}/manifest.webmanifest`',
      );
      source = source.replace(
        'link.href = discreet ? "/neutral-icon.svg" : "/favicon.svg";',
        'link.href = discreet ? `${ESSOR_BASE_PATH}/neutral-icon.svg` : `${ESSOR_BASE_PATH}/favicon.svg`;',
      );

      return { code: source, map: null };
    },
  };
}
