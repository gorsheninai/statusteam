import type { FormKind } from "./fields";
import type { LegalDocumentId } from "../../content/legal";

export function isMinorAge(age: string) {
  return age.trim() !== "" && Number(age) > 0 && Number(age) < 18;
}

export function validCastingAge(age: string) {
  return age.trim() !== "" && Number.isInteger(Number(age)) && Number(age) > 0;
}

export function consentDocuments(kind: FormKind): LegalDocumentId[] {
  const dataDocument: LegalDocumentId = kind === "subscribe" ? "newsletter" : kind;
  return ["terms", "privacy", dataDocument, ...(kind === "subscribe" ? ["advertising" as const] : [])];
}

export function requiredConsentsAccepted(kind: FormKind, data: Record<string, unknown>) {
  return data.termsAccepted === "yes" && data.consent === "yes"
    && (kind !== "subscribe" || data.advertisingConsent === "yes")
    && (kind !== "casting" || (validCastingAge(String(data.age ?? ""))
      && data.consentSubject === (isMinorAge(String(data.age)) ? "guardian" : "candidate")));
}
