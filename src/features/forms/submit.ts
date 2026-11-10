import type { FormKind } from "./fields";
import { LEGAL_DOCUMENTS, documentsPublished } from "../../content/legal";
import { consentDocuments, requiredConsentsAccepted } from "./consents";

/** Public build-time URL. No service credentials belong in this value. */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";

export function submitForm(kind: FormKind, data: Record<string, FormDataEntryValue>) {
  const documents = consentDocuments(kind, String(data.age ?? ""));
  if (!requiredConsentsAccepted(kind, data) || !documentsPublished(documents)) {
    throw new Error("Required consents or published documents are missing.");
  }
  return fetch(FORM_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...data,
      form: kind,
      consentRecordedAt: new Date().toISOString(),
      consentDocuments: documents.map((id) => ({
        id, href: LEGAL_DOCUMENTS[id].href, version: LEGAL_DOCUMENTS[id].version,
      })),
    }),
  });
}
