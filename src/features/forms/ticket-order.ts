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
