(() => {
  const PARAM = "acces_fondateur_v2";
  const STORAGE_KEY = "essor:founder-access:v1";
  const EXPECTED_SHA256 = "b98a35c571de0c1f45bd1ecd0011444e3b87534d3c15e5932c5fbd7365871a74";

  async function sha256Hex(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function activate() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get(PARAM);
    if (!token) return;

    url.searchParams.delete(PARAM);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);

    try {
      const digest = await sha256Hex(token);
      if (digest !== EXPECTED_SHA256) {
        window.sessionStorage.setItem("essor:founder-access-error", "invalid");
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      window.sessionStorage.removeItem("essor:founder-access-error");
      window.location.reload();
    } catch {
      window.sessionStorage.setItem("essor:founder-access-error", "unavailable");
    }
  }

  activate();
})();
