import { apiEndpoint, retryKey } from "./api";
import type { FormKind } from "./fields";
import { LEGAL_DOCUMENTS, documentsPublished } from "../../content/legal";
import { consentDocuments, requiredConsentsAccepted } from "./consents";

/** Public build-time URL. No service credentials belong in this value. */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";

export async function submitForm(kind: FormKind, data: Record<string, FormDataEntryValue>) {
  const documents = consentDocuments(kind, String(data.age ?? ""));
  if (!requiredConsentsAccepted(kind, data) || !documentsPublished(documents)) {
    throw new Error("Required consents or published documents are missing.");
  }
  const endpoint = apiEndpoint("forms");
  if (!endpoint || kind === "subscribe") throw new Error("Submission disabled");
  const payload = {
    ...data, form: kind,
    consentDocuments: documents.map(id => ({ id, version: LEGAL_DOCUMENTS[id].version })),
  };
  return fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, requestKey: await retryKey(kind, payload) }),
  });
}
