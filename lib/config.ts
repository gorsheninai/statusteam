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

/* --- form delivery ---------------------------------------------------- */

/**
 * One endpoint for every form on the page — casting, partners, press,
 * ticket access and the newsletter. Unset means the forms say so rather
 * than pretending to send.
 */
export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";
