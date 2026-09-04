# STATUS TEAM — ПУЛЬС КОНТИНЕНТА

Single-page site for the STATUS TEAM fashion show **ПУЛЬС КОНТИНЕНТА / PULSE OF THE
CONTINENT**. Interface language is Russian. Next.js App Router, Tailwind v4 preflight
plus a hand-written token system, GSAP + ScrollTrigger for scroll choreography, Lenis
for inertial scroll, plain CSS for component state.

**There is no animation library beyond GSAP and Lenis.** Framer Motion was removed:
it cost ~40 KB gzip for two accordions and a menu, and this page has a 150 KB JS
budget it is already pressing against. Disclosure widgets use the `.panel`
primitive (`grid-template-rows: 0fr → 1fr`), the menu uses a `clip-path`
transition. Do not reintroduce a component-animation dependency.

## Commands

```bash
npm run dev        # local dev
npm run build      # static export -> ./out
npm start          # serve ./out on :4311  (next start does NOT work with output: export)
npm run verify     # drive the rendered page in a browser (88 checks)
npm run lint
npm run typecheck
npm run deploy         # build + wrangler deploy to Cloudflare (production)
npm run deploy:preview # build + upload a version, production keeps serving main
```

**Verify against a fresh build.** The static server snapshots `out/` at boot —
rebuild, then restart, or you are testing the previous build.

## Deployment — Cloudflare

The site is a **static export**. `wrangler.jsonc` declares an assets-only Worker
(no `main`), so Cloudflare serves `out/` from the edge and no Worker runs per
request. Nothing here needs a server: no route handlers, no server actions, no
per-request data.

`npm run deploy` needs `CLOUDFLARE_API_TOKEN` in the environment — wrangler cannot
authenticate non-interactively without it. The target Worker is named `statusteam`.

Keep `output: "export"` and `images.unoptimized` together: dropping either breaks
the other.

### Deploys are automatic — Workers Builds

The `statusteam` Worker is connected to this repository in the Cloudflare
dashboard (*Worker → Settings → Builds*), so pushing is the deploy:

| Push to | Build runs | Result |
|---|---|---|
| `main` | `npm run build` → `npx wrangler deploy` | the live site |
| any other branch | `npm run build` → `npx wrangler versions upload` | preview URL, live site untouched |

A preview **uploads a version without shifting traffic**. Each branch gets a
stable `<branch>-statusteam.<subdomain>.workers.dev` alias plus a per-commit URL,
and Cloudflare comments both onto the pull request.

Two settings this depends on: *Branch control → non-production branch builds*
must be **on** (otherwise only `main` ever builds), and the dashboard Worker name
must stay equal to `name` in `wrangler.jsonc` — Workers Builds fails the build
when they diverge.

There is no GitHub Actions workflow, and there should not be one: it would
deploy the same commit a second time and race the version Cloudflare uploaded.

`npm run deploy` still works for a manual push to production; `deploy:preview`
does the version-upload path by hand. Prefer just pushing — a hand-deploy from a
feature branch promotes an unreviewed build to the live site.

## Skills

`.claude/skills/` holds four project-local skills. They are committed, so they load
for anyone working in this repository — no marketplace, no per-machine setup. They
carry the *procedural* knowledge that does not belong in this file: exact commands,
failure modes, and the traps that have already cost a debugging session.

| Skill | Reach for it when |
|---|---|
| `verify-ui` | running or reading `npm run verify`, or adding a check |
| `motion-rules` | touching anything animated, pinned or scroll-driven |
| `design-tokens` | picking a colour, a size, a spacing value or an image |
| `responsive-audit` | writing layout CSS, or something breaks at one width |

Keep them honest: when a rule here changes, change it there too, and when a bug
turns out to have been silent, that is exactly what belongs in a skill.

## Repository rules

- All work lives in **`gorsheninai/statusteam`**. `gorsheninai/statusteam-website` is
  the client-approved visual baseline and is **read-only reference**.
- Original media (`1–9.png`, `style1–7.png`, `pre1–4.PNG`, `header_16_9.png`,
  `header_9_16.png`, `video.mp4`) stays in the repo root, untouched. Everything served
  to the browser is a derivative in `public/media/`. The two `header_*` originals are
  6.5 and 7.1 MB — dropping either into `public/media/` ships it to the edge and puts
  it in front of the LCP.

## Visual identity

Burgundy leads. It lives in **type, rules and flat fields — it is never tinted onto the
photography.**

| Token | Value | Use |
|---|---|---|
| `--burgundy` | `#761028` | brand field, primary CTA |
| `--wine` | `#4b0718` | archive chapter, mobile menu |
| `--red` | `#b51f2e` | small marks on paper |
| `--red-bright` | `#d8394a` | large type on ink (AA needs it) |
| `--ink` | `#100d0c` | warm-shifted black, sits under savanna imagery |
| `--paper` | `#f1eee8` | quiet chapters |
| `--sand` | `#c6a87c` | hairlines and small caps only — never a gradient, never "gold" |

No gold gradients, no black-and-gold clichés, no accent colours beyond this set. The
photography supplies the secondary colour.

### Typography — two faces, three roles

- **`--font-display`** (Tenor Sans) — **large only.** The lock-up, chapter titles,
  statements, composed numerals. One weight exists; there is no bold.
- **`--font-ui`** (Onest) — small uppercase: nav, buttons, labels, chapter numbers,
  form labels, credits, footer. Never above 500.
- **`--font-body`** (Onest) — running copy, forms.

`--font-ui` and `--font-body` resolve to the same family on purpose. They stay
separate roles so UI tracking and weight can move without touching running copy.

Both faces are **self-hosted** in `app/fonts/` (woff2, SIL OFL, licences beside
them) and loaded with `next/font/local`. No Google Fonts `<link>`, no CDN — the
production site must not depend on one. Onest is one variable file (100–900);
Tenor Sans is a single static weight. Both are subset to Latin + Cyrillic + the
punctuation this page uses; **re-subset before introducing a new glyph** (Tenor
Sans has no `→`, `↗` or `₽` at all — those live in Onest UI only).

`font-synthesis: none` is set on `body` and must stay: without it any stray
`font-weight` renders Tenor Sans as faux bold.

The reference site's Caveat script accent was **dropped deliberately**; it belonged to
the previous Slavic show, not this one. Do not reintroduce it.

Next/font variables are named `--ff-*` and set on `<html>`. Do **not** rename them to
`--font-sans`: Tailwind v4 defines that as a theme token on `:root` and would shadow it.

**Tenor Sans sets much wider than the condensed face it replaced.** Several sizes are
pinned by the longest Cyrillic word rather than by taste — the `.btn` tracking, and
above all the hero lock-up: «КОНТИНЕНТА» at ≥900px is sized against `.hero-inner`'s
68% box **at open tracking**, which is its resting state, not its narrowest. All of
them clip silently inside a mask. Re-run `npm run verify` after touching any of them.

### Signature — the breathing lock-up

`ПУЛЬС КОНТИНЕНТА` recurs exactly three times (hero → pulse → tickets). Its tracking
opens and closes on scroll, the two words moving in opposition, so the pair reads as one
breath. The final instance settles compressed — the pulse resolves. GSAP writes
`--pulse` (0–1); CSS multiplies it by `--pulse-spread`.

`--pulse-spread` is `0.05em` on phones and, from 900px, per instance: `0.09em` in the
hero, `0.1em` in `#pulse`, `0.14em` in `#tickets` — the hero's is the tightest because
its box is the one hemmed in by the photograph. **This is a correctness constraint, not
taste:** "КОНТИНЕНТА" at full tracking will slide under the reveal mask's
`overflow: hidden` and clip silently — the document never scrolls, so an overflow check
will not catch it. If you change any of those font sizes, re-run the clipped-text check.

Pulse is never drawn as an ECG line.

### No section labels, no placeholder blocks

Two rules keep the page from reading as generated:

**Chapters are not numbered and not labelled.** «01 STATUS TEAM», «02 Показ» and
the rest are gone, including the numbering in the mobile menu, the participation
doors and the programme list. A scene is separated by its ground, its scale and its
composition — that is what the change of colour and the full-bleed frames are for.
Order survives in exactly one place, because there it is information: the three
casting steps. `npm run verify` fails if numbering creeps back into a heading, a
door or the menu.

**A block either carries real content or it does not exist.** `CONTENT` in
`lib/config.ts` gates the guest wall, both logo marquees, the price waves with their
countdown, and the per-tier prices. All of them are written and waiting; none of them
render while the real material is missing, because a wall of «Имя Фамилия» and a
countdown of em dashes say *unfinished* louder than a shorter page says anything.
Flip the flag the day the content lands. The suite greps the rendered page for those
placeholders and fails if any reaches the browser.

### Structure — seven scenes

The page is one long scroll, but each scene should feel like its own page. The order
is the show's order and is a client requirement, not a preference:

| # | Anchor | Scene | Ground |
|---|---|---|---|
| — | `#hero` | ПУЛЬС КОНТИНЕНТА — one promise, one control | ink |
| 01 | `#statusteam` | STATUS TEAM — who / aftermovie / proof / numbers | burgundy |
| 02 | `#pulse` | Следующая глава → the four tenets | ink |
| 03 | `#experience` | Что вас ждёт + venue | paper |
| 04 | `#tickets` | Предзаказ билетов | ink |
| 05 | `#join` | Моделям, брендам, партнёрам и СМИ — model / brand / press | wine |
| 06 | `#faq` | Вопросы, then the footer | ink |

Chapters alternate loud and quiet — a media chapter is always followed by a breathing
one. Preserve that rhythm when adding sections.

Nothing is centred by default. Each scene is anchored to a different edge and the
offsets are fractions of the measure, not round numbers (see the ASYMMETRY block at
the end of `globals.css`). Campaign frames run full-bleed — a photograph inside a
padded container reads as a CMS. The vertical rhythm is deliberately tight: the
change of ground carries the transition, so air between chapters is just scroll.

**The hero carries two equal links:** preorder goes to `#tickets`, participation goes
to `#join`. Keeping both paths visible on the first screen and keeping the header's
ticket button visible at every scroll position and every width (outside the burger on
phones) is an acceptance criterion. `npm run verify` checks both.

Scene 1's four beats run in a fixed order — phrase → aftermovie → guests → press →
brands → numbers. Scene 4 is one preorder path until the date, venue and ticket
inventory are confirmed. It must not invent categories or send a buyer to the casting
or partner forms; the verify suite fails if those mistakes come back.

### Config, not code

`lib/config.ts` holds everything the client changes without touching a component:
the confirmed city, `SALES_OPEN` and `TICKETS_URL`. Flipping `SALES_OPEN` swaps the
preorder form for a real purchase link. Categories, prices, date and venue do not
exist in production content until they are confirmed.

Placeholder copy and imagery are marked `TODO: replace-content`; unconfirmed facts are
marked `TODO: confirm-number` / `TODO: set-deadline` / `TODO: set-ticket-url`. Keep
those markers greppable.

## Motion

Everything animates through `transform` and `opacity`. The two places that break that
rule do it on purpose and are named in the brief: the disclosure panels
(`grid-template-rows`) and the participation doors (`flex-grow`).

`components/Motion.tsx` is the whole scroll pass. It returns before building a single
tween when `prefers-reduced-motion: reduce` is set, so the reduced-motion page is not
a degraded version — it is the plain document.

Four mechanisms carry invariants that are easy to break:

**The ground.** A single fixed `.bg-field` sits behind the page and interpolates
between the scenes' colours. It works because three things line up: `Motion` adds
`html.js-motion`, which makes `[data-bg]` sections **and `body`** transparent —
`body` matters, because body's background paints *after* negative-z descendants and
would otherwise cover the field. Without JS every section paints its own ground and
the page is identical minus the blend. **A paper scene has ink-coloured type**, so if
you touch this, check `#experience` first: a broken field turns it into black on black.

**Position, not crossings.** The ground is chosen by reading `scrollY` against a table
of section offsets measured on `ScrollTrigger` refresh — never by `onEnter` callbacks.
A flung wheel, an anchor jump or a deep link can skip a boundary entirely; it cannot
skip a position.

**Pins refresh first.** `.tenets` and `.reel-zoom` both pin, and a pin adds several
screens of spacer that everything below is measured against. Both carry
`refreshPriority: 1`. Drop it and every trigger below them fires roughly one chapter
early — silently.

**The pinned chapter degrades by class.** `.tenets` is a plain vertical sequence of
four word + frame blocks; `Motion` adds `.is-pinned`, which stacks them absolutely for
the pin. No JS, or reduced motion, means four readable blocks rather than three
invisible ones.

Line reveals use `lib/split-lines.ts` (not GSAP's SplitText — 7 KB the budget cannot
spare). It measures rendered line boxes, so it must run after `document.fonts.ready`,
and it reverts to plain text once the reveal has played so headings re-wrap normally.

Scroll is owned by Lenis, and only by Lenis: anchors go through `lib/scroll.ts`, and
so does the menu's scroll lock (`lenis.stop()`, not a fixed body). Touch keeps the
platform's own scrolling — `syncTouch: false` is a decision, not a default to tidy up.

The page opens on a **stage curtain**: two wine wings that part after the pulse line
writes itself across the seam. It is **pure CSS** and shown once per session — it
covers the whole page, so it has to open even if the JS bundle never arrives, and an
inline script in `layout.tsx` sets `.no-preload` on repeat visits before the element
is parsed. Two details it will not survive losing:

- The wings are `50.4%` wide each. They must overlap, or a strip of the page flashes
  through the seam before they move.
- `@keyframes pre-clear` carries `visibility: hidden` on **both** `from` and `to`.
  `visibility` interpolates discretely, so a lone `to` leaves the element visible for
  the whole active period — at a 1ms duration, that is the entire animation, and the
  cleared curtain goes on eating clicks.

Its schedule (line 0.1–1.05s, wings 1.05–2.0s) is what `OPEN` in `Motion.tsx` is tuned
against: the hero starts while the wings are still travelling, so the type is already
rising as the gap widens. Change one and change the other.

## Media policy

`public/media/MEDIA_INDEX.md` is the source of truth: what each asset shows, its crop
tolerance, whether type may sit on it, and where it belongs. **Read it before placing
any image.**

Non-negotiables:

- The `poster-*` files already carry the printed title lock-up. **Never** put type on them.
- `archive-*` and the reel are **real photography from the previous show** (СЛАВЯНСКИЙ
  ВЗГЛЯД), by **Паша Доренский**. Credit stays visible; never filter them.
- Campaign imagery and archive imagery are two different shows. Do not mix them in one
  chapter.
- Curate. Three unused key-art variants are held in reserve on purpose.
- **No frame is used twice.** One placement each — the build is grepped for it.
  Where the library has no right frame, the answer is type on a flat ground, not a
  second outing for a photograph: that is what the KINEMA venue block is.

## Quality floor

Every change must hold: no horizontal overflow and no mask-clipped text at 360–1440;
WCAG AA contrast; visible focus rings; 48px touch targets; every hover affordance has a
touch equivalent; `prefers-reduced-motion` disables GSAP entirely and leaves nothing
faded or offset.

Reveals set their initial state **from JS, never CSS**, so the page stays readable if
JS fails.

**Every image needs a reserved box** — an `aspect-ratio` on its `.media` frame, or
`width`/`height` attributes (the posters are the only ones that use the latter).
This is not only about CLS: an anchor jump computes its target before the images
below load, so an unreserved image lands every deep link hundreds of pixels short.

Bundle: **~160 KB gzip of JS on a modern browser** (a further 38 KB of `nomodule`
polyfills legacy browsers only). The brief asks for ≤ 150 KB. React + the Next
runtime are ~100 KB of that and GSAP core is ~40 KB, so the remaining levers are
structural — dropping GSAP, or dropping Next for a hand-rolled static build. Nothing
here blocks first paint: every script is deferred and LCP is the hero image.

## Not yet wired

- **Ticket sales** — `SALES_OPEN` is false and `TICKETS_URL` is empty by design. The
  CTA collects a no-payment preorder instead, and says so.
- **Form delivery** — set `NEXT_PUBLIC_FORM_ENDPOINT` and all five forms (casting,
  partner, press, ticket access, newsletter) POST JSON to it, tagged by `form`.
  Without it they say so plainly. Never fake a successful submission.
- **Guest names, press and brand logos** — grey placeholders; the marquee items are
  `<span>`s waiting to become `<img>`s.
- **Social / contact links** — omitted rather than invented.

## Responsive polish — September 2026

Current typography loads only Tenor Sans and Onest. Programme descriptions are
visible without disclosure controls. Ticket preorder uses a 52rem maximum measure
and a rectangular labelled action. Participation panels use an opaque wine ground
and inert while closed; open desktop panels expand into a full-width list rather
than compressing neighbouring forms. Press and partner placeholders are gated off.
Video supports explicit pause, metadata preload and reduced-motion opt-out.
Form requests time out after 15 seconds. Delivery still requires a configured endpoint.
