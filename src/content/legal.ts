/** Set href and version only after the approved document has been published. */
export const LEGAL_DOCUMENTS = {
  terms: { title: "Пользовательское соглашение", href: "", version: "" },
  privacy: { title: "Политика обработки персональных данных", href: "", version: "" },
  casting: { title: "Согласие на обработку персональных данных для рассмотрения заявки модели", href: "", version: "" },
  guardian: { title: "Согласие законного представителя на обработку данных несовершеннолетнего и своих данных", href: "", version: "" },
  partner: { title: "Согласие на обработку персональных данных для рассмотрения предложения", href: "", version: "" },
  press: { title: "Согласие на обработку персональных данных для аккредитации", href: "", version: "" },
  access: { title: "Согласие на обработку персональных данных для предзаписи на билеты", href: "", version: "" },
  newsletter: { title: "Согласие на обработку персональных данных для рассылки", href: "", version: "" },
  advertising: { title: "Условия рассылки", href: "", version: "" },
  buyers: { title: "Сведения об обработке персональных данных покупателей", href: "", version: "" },
};

export type LegalDocumentId = keyof typeof LEGAL_DOCUMENTS;

export function documentsPublished(ids: LegalDocumentId[]) {
  return ids.every((id) => Boolean(LEGAL_DOCUMENTS[id].href && LEGAL_DOCUMENTS[id].version));
}
