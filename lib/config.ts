/**
 * Everything the client changes without touching a component.
 *
 * The show is not on sale yet, so the ticket scene has two faces. Flip
 * SALES_OPEN and the CTA becomes a real purchase link; leave it false and the
 * scene collects intent instead. Nothing here fakes a state it is not in.
 */

/* --- the event ------------------------------------------------------- */

export const SHOW = {
  title: "ПУЛЬС КОНТИНЕНТА",
  /* TODO: replace-content — confirmed by poster-key-art, re-confirm with client */
  date: "07 ноября 2026",
  dateShort: "07.11.2026",
  venue: "Kinema",
  city: "Москва",
  /* ISO of doors-open, used by the wave timer's final deadline */
  startsAt: "2026-11-07T18:00:00+03:00",
};

/* --- sales ----------------------------------------------------------- */

/** Flip to true the day the ticket operator goes live. */
export const SALES_OPEN = false;

/** TODO: set-ticket-url — the operator link. Only read when SALES_OPEN. */
export const TICKETS_URL = "";

/**
 * Price waves. The active wave is the first one that has not expired; its
 * deadline drives the countdown. Add or remove waves freely — the scene
 * renders whatever is in this array.
 *
 * TODO: set-deadline — placeholder dates, the client sets the real ones.
 */
export const WAVES: { id: string; name: string; endsAt: string }[] = [
  { id: "early", name: "Early bird", endsAt: "2026-09-15T23:59:59+03:00" },
  { id: "regular", name: "Regular", endsAt: "2026-10-25T23:59:59+03:00" },
  { id: "last", name: "Last call", endsAt: SHOW.startsAt },
];

/**
 * Ticket categories. Prices stay as an em dash until the client sets them —
 * a placeholder number on a ticket page is worse than no number.
 *
 * TODO: replace-content — names, contents and prices are the client's call.
 */
export const TIERS: {
  id: string;
  name: string;
  price: string;
  includes: string[];
}[] = [
  {
    id: "standard",
    name: "Standard",
    price: "— ₽",
    includes: ["Место в зале", "Показ целиком"],
  },
  {
    id: "premium",
    name: "Premium",
    price: "— ₽",
    includes: ["Ближние ряды", "Welcome drink"],
  },
  {
    id: "vip",
    name: "Front row / VIP",
    price: "— ₽",
    includes: ["Первый ряд", "Лаунж-зона", "Afterparty"],
  },
];

/* --- form delivery ---------------------------------------------------- */

/**
 * One endpoint for every form on the page — casting, partners, press,
 * ticket access and the newsletter. Unset means the forms say so rather
 * than pretending to send.
 */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";
