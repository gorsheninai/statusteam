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
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(payload)))), v => v.toString(16).padStart(2, "0")).join("");
  const storageKey = `status-request-${purpose}`;
  try {
    const old = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (old && (reuseAcrossChanges || old.digest === digest) && /^[a-f0-9]{64}$/.test(old.key)) return old.key as string;
  } catch {
    const memory = memoryKeys.get(purpose);
    if (memory && (reuseAcrossChanges || memory.digest === digest)) return memory.key;
  }
  const key = Array.from(crypto.getRandomValues(new Uint8Array(32)), v => v.toString(16).padStart(2, "0")).join("");
  memoryKeys.set(purpose, { digest, key });
  try { sessionStorage.setItem(storageKey, JSON.stringify({ digest, key })); } catch { /* current request still works */ }
  return key;
}
