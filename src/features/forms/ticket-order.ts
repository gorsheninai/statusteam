export function ticketTotalKopecks(quantity: number, priceKopecks: number, capacity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > capacity
    || !Number.isSafeInteger(priceKopecks) || priceKopecks < 1
    || !Number.isSafeInteger(quantity * priceKopecks)) return null;
  return quantity * priceKopecks;
}

export function formatRubles(kopecks: number) {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(kopecks / 100);
}
