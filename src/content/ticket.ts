/** Confirmed with the organizer. Prices are stored in kopecks. */
export const TICKET = {
  id: "pulse-continent-2026",
  title: "Билет на шоу «Пульс Континента»",
  description: "Посещение fashion-шоу STATUS TEAM. Один билет — один гость, один проход на мероприятие. Без выбора мест.",
  priceKopecks: 2_500_000,
  currency: "RUB",
  capacity: 100,
  date: "30 ноября 2026",
  dateISO: "2026-11-30",
  venue: "LOTTE HOTEL MOSCOW / «Лотте Отель Москва»",
  address: "121099, г. Москва, Новинский бульвар, д. 8, стр. 2",
  doors: "18:30",
  start: "20:00",
  timezone: "Московское время",
  age: "18+",
  delivery: "Электронный билет с уникальным QR-кодом поступит на указанный e-mail в течение часа после успешной оплаты. Доставка бесплатная.",
  receipt: "Кассовый чек направляется на e-mail, указанный при оформлении заказа.",
};

/** Moderation preparation only. Real payment integration is not configured. */
export const CHECKOUT_ENABLED = false;
