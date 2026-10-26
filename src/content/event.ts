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
  city: "Москва",
  period: "30 ноября",
};

/* --- content gates ---------------------------------------------------
   STATUS TEAM proof is visible in the rebuilt section even before the final
   guest portraits and logo files arrive. Guests/press/brands use explicitly
   neutral placeholders in their components, so no unconfirmed real person,
   publication or partner is presented as production content.
   -------------------------------------------------------------------- */

export const CONTENT: {
  /** Guest wall — neutral placeholders until real portraits/names arrive. */
  guests: boolean;
  /** «О нас говорили» — neutral wordmarks until actual press logos arrive. */
  pressLogos: boolean;
  /** «Вместе с нами» — neutral wordmarks until actual partner logos arrive. */
  brandLogos: boolean;
} = {
  guests: true,
  pressLogos: true,
  brandLogos: true,
};

/* --- sales ----------------------------------------------------------- */

/** Flip to true the day the ticket operator goes live. */
export const SALES_OPEN = false;

/** TODO: set-ticket-url — the operator link. Only read when SALES_OPEN. */
export const TICKETS_URL = "";

/** Public project contact links. */
export const CONTACTS = { telegram: "https://t.me/statusteamru" };
