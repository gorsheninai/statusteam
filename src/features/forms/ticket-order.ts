export function ticketTotalKopecks(quantity: number, priceKopecks: number, capacity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > capacity
    || !Number.isSafeInteger(priceKopecks) || priceKopecks < 1
    || !Number.isSafeInteger(quantity * priceKopecks)) return null;
  return quantity * priceKopecks;
}

export function formatRubles(kopecks: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(kopecks / 100);
}


type CheckoutDocument = { id: string; version: string; href: string };

export function checkoutMatchesPublication(
  response: unknown, amountKopecks: number, documents: CheckoutDocument[],
) {
  if (!response || typeof response !== "object" || !("amountKopecks" in response) ||
    response.amountKopecks !== amountKopecks || !("documents" in response) ||
    !Array.isArray(response.documents) || response.documents.length !== documents.length) return false;
  const actualDocuments = response.documents;
  return documents.every(expected => actualDocuments.some(actual =>
    actual?.id === expected.id && actual.version === expected.version && actual.href === expected.href,
  ));
}


const checkoutErrors: Readonly<Record<string, string>> = {
  invalid_name: "Укажите имя и фамилию.",
  name_and_surname_required: "Укажите имя и фамилию через пробел.",
  invalid_email: "Проверьте адрес электронной почты.",
  invalid_phone: "Проверьте номер телефона. Например: +7 900 123-45-67.",
  consent_required: "Подтвердите условия покупки и проверьте поля формы.",
  launch_checkout_restricted: "Продажа скоро откроется.",
  launch_ticket_exists: "Проверочный заказ уже создан.",
  sold_out: "На данный момент все билеты куплены или забронированы.",
  checkout_disabled: "Онлайн-оплата сейчас недоступна.",
};

export function checkoutErrorMessage(status: number, code: unknown): string {
  if (status === 429) return "Слишком много попыток. Подождите несколько минут и повторите.";
  if (typeof code === "string" && Object.hasOwn(checkoutErrors, code)) return checkoutErrors[code];
  if (status >= 500) return "Сервис оплаты временно недоступен. Повторите с теми же данными.";
  return `Не удалось оформить заказ. Код ответа: ${status}. Проверьте данные или обратитесь в поддержку.`;
}
