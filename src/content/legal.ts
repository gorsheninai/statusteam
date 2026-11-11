import approvedDocuments from "./legal-approved.json" with { type: "json" };

const TITLES = {
  privacy: "Политика обработки персональных данных",
  terms: "Пользовательское соглашение",
  casting: "Согласие на обработку персональных данных для рассмотрения заявки модели",
  partner: "Согласие на обработку персональных данных для рассмотрения предложения",
  press: "Согласие на обработку персональных данных для аккредитации",
  buyers: "Сведения об обработке персональных данных покупателей",
  newsletter: "Согласие на обработку персональных данных для рассылки",
  advertising: "Условия рассылки",
  cookies: "Согласие на обработку файлов cookie и данных веб-аналитики",
};

export type LegalDocumentId = keyof typeof TITLES;
type Publication = { href: string; version: string; section7Page?: number };
const approved: Partial<Record<LegalDocumentId, Publication>> = approvedDocuments;

export const LEGAL_DOCUMENTS = Object.fromEntries(
  (Object.keys(TITLES) as LegalDocumentId[]).map(id => [
    id,
    { title: TITLES[id], href: approved[id]?.href ?? "", version: approved[id]?.version ?? "", section7Page: approved[id]?.section7Page },
  ]),
) as Record<LegalDocumentId, Publication & { title: string }>;

export const PURCHASE_DOCUMENTS = ["terms", "buyers", "privacy"] as const;

export function documentsPublished(ids: readonly LegalDocumentId[]) {
  return ids.every(id => Boolean(LEGAL_DOCUMENTS[id].href && LEGAL_DOCUMENTS[id].version));
}
