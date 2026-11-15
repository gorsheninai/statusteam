const memoryKeys = new Map<string, { digest: string; key: string }>();
/** Browser requests stay on the Russian site; Workers previews never accept real data. */
export function apiEndpoint(route: string) {
  const configured = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";
  if (!configured || typeof window === "undefined" || window.location.hostname !== "statusteam-official.ru") return "";
  const url = new URL(configured, window.location.origin);
  if (url.origin !== window.location.origin || url.pathname !== "/api/index.php") return "";
  url.search = new URLSearchParams({ r: route }).toString();
  return url.toString();
}
export async function retryKey(purpose: string, payload: unknown, reuseAcrossChanges = false) {
  const digest = reuseAcrossChanges ? "" :
    Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(payload)))),
      v => v.toString(16).padStart(2, "0")).join("");
  const storageKey = `status-request-${purpose}`;
  let previous = memoryKeys.get(purpose);
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (stored && typeof stored.key === "string" && /^[a-f0-9]{64}$/.test(stored.key)) previous = stored;
  } catch { /* Storage can be unavailable or contain invalid data. */ }
  if (previous && (reuseAcrossChanges || previous.digest === digest)) return previous.key;
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, "0")).join("");
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ digest, key }));
    memoryKeys.delete(purpose);
  } catch {
    memoryKeys.set(purpose, { digest, key });
  }
  return key;
}

export function clearRetryKey(purpose: string) {
  memoryKeys.delete(purpose);
  try { sessionStorage.removeItem(`status-request-${purpose}`); } catch { /* storage may be unavailable */ }
}
