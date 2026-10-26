import type { FormKind } from "./fields";

/** Public build-time URL. No service credentials belong in this value. */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";

export function submitForm(kind: FormKind, data: Record<string, FormDataEntryValue>) {
  return fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form: kind, ...data }),
  });
}
