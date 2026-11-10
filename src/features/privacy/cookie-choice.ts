export const COOKIE_STORAGE_KEY = "status-cookie-choice";
export type CookieChoice = { analytics: boolean; version: string };

/** Unknown, stale or malformed choices never authorize analytics. */
export function readCookieChoice(raw: string | null, version: string): CookieChoice | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || !("analytics" in value)
      || !("version" in value) || typeof value.analytics !== "boolean"
      || typeof value.version !== "string") return null;
    if (value.analytics && (!version || value.version !== version)) return null;
    return { analytics: value.analytics, version: value.version };
  } catch { return null; }
}
